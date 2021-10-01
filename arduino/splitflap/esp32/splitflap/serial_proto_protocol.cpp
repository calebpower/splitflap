/*
   Copyright 2021 Scott Bezek and the splitflap contributors

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
#include "../core/common.h"

#include "../proto_gen/splitflap.pb.h"

#include "crc32.h"

#include "pb_encode.h"
#include "pb_decode.h"
#include "serial_proto_protocol.h"

static SerialProtoProtocol* singleton_for_packet_serial = 0;


SerialProtoProtocol::SerialProtoProtocol(SplitflapTask& splitflap_task) : SerialProtocol(splitflap_task) {
    packet_serial_.setStream(&Serial);
    Serial.setRxBufferSize((PB_ToSplitflap_size + 4) * 2);

    // Note: not threadsafe or instance safe!! but PacketSerial requires a legacy function pointer, so we can't
    // use a member, std::function, or lambda with captures
    assert(singleton_for_packet_serial == 0);
    singleton_for_packet_serial = this;

    packet_serial_.setPacketHandler([](const uint8_t* buffer, size_t size) {
        singleton_for_packet_serial->handlePacket(buffer, size);
    });
}

void SerialProtoProtocol::handleState(const SplitflapState& old_state, const SplitflapState& new_state) {
    pb_tx_buffer_ = {};
    pb_tx_buffer_.which_payload = PB_FromSplitflap_splitflap_state_tag;
    pb_tx_buffer_.payload.splitflap_state.modules_count = NUM_MODULES;
    for (uint8_t i = 0; i < NUM_MODULES; i++) {
        pb_tx_buffer_.payload.splitflap_state.modules[i] = {
            .state = (PB_SplitflapState_ModuleState_State) new_state.modules[i].state,
            .flap_index = new_state.modules[i].flap_index,
            .moving = new_state.modules[i].moving,
            .home_state = new_state.modules[i].home_state,
            .count_unexpected_home = new_state.modules[i].count_unexpected_home,
            .count_missed_home = new_state.modules[i].count_missed_home,
        };
    }

    sendPbTxBuffer();
}

void SerialProtoProtocol::log(const char* msg) {
    pb_tx_buffer_ = {};
    pb_tx_buffer_.which_payload = PB_FromSplitflap_log_tag;

    strncpy(pb_tx_buffer_.payload.log.msg, msg, sizeof(pb_tx_buffer_.payload.log.msg));

    sendPbTxBuffer();
}

void SerialProtoProtocol::loop() {
    do {
        packet_serial_.update();
        if (packet_serial_.overflow()) {
            log("Overflow");
        }
    } while (Serial.available());
}

void SerialProtoProtocol::handlePacket(const uint8_t* buffer, size_t size) {
    if (size <= 4) {
        // Too small, ignore bad packet
        log("Small packet");
        return;
    }

    // Compute and append little-endian CRC32
    uint32_t expected_crc = 0;
    crc32(buffer, size - 4, &expected_crc);

    uint32_t provided_crc = buffer[size - 4]
                         | (buffer[size - 3] << 8)
                         | (buffer[size - 2] << 16)
                         | (buffer[size - 1] << 24);
    
    char buf[200];
    snprintf(buf, sizeof(buf), "Got %u byte packet with computed CRC %08x", size - 4, expected_crc);
    log(buf);

    if (expected_crc != provided_crc) {
        char buf[200];
        snprintf(buf, sizeof(buf), "Bad CRC. Expected %08x but got %08x.", expected_crc, provided_crc);
        log(buf);
        return;
    }

    pb_istream_t stream = pb_istream_from_buffer(buffer, size - 4);
    if (!pb_decode(&stream, PB_ToSplitflap_fields, &pb_rx_buffer_)) {
        char buf[200];
        snprintf(buf, sizeof(buf), "Decoding failed: %s", PB_GET_ERROR(&stream));
        log(buf);
        return;
    }
    
    switch (pb_rx_buffer_.which_payload) {
        case PB_ToSplitflap_splitflap_command_tag: {
            PB_SplitflapCommand command = pb_rx_buffer_.payload.splitflap_command;
            Command c = {};
            c.command_type = CommandType::MODULES;
            for (uint8_t i = 0; i < min((int)command.modules_count, NUM_MODULES); i++) {
                switch (command.modules[i].action) {
                    case PB_SplitflapCommand_ModuleCommand_Action_NO_OP:
                        c.data[i] = QCMD_NO_OP;
                        break;
                    case PB_SplitflapCommand_ModuleCommand_Action_RESET_AND_HOME:
                        c.data[i] = QCMD_RESET_AND_HOME;
                        break;
                    case PB_SplitflapCommand_ModuleCommand_Action_GO_TO_FLAP:
                        if (command.modules[i].param <= 255 - QCMD_FLAP) {
                            c.data[i] = QCMD_FLAP + command.modules[i].param;
                        }
                        break;
                    default:
                        // Ignore unknown action
                        break;
                }
            }
            splitflap_task_.postRawCommand(c);
            break;
        }
        default: {
            char buf[200];
            snprintf(buf, sizeof(buf), "Unknown ToSplitflap type: %d", pb_rx_buffer_.which_payload);
            log(buf);
            return;
        }
    }
}

void SerialProtoProtocol::sendPbTxBuffer() {
    // Encode protobuf message to byte buffer
    pb_ostream_t stream = pb_ostream_from_buffer(tx_buffer_, sizeof(tx_buffer_));
    if (!pb_encode(&stream, PB_FromSplitflap_fields, &pb_tx_buffer_)) {
        Serial.println(stream.errmsg);
        Serial.flush();
        assert(false);
    }

    // Compute and append little-endian CRC32
    uint32_t crc = 0;
    crc32(tx_buffer_, stream.bytes_written, &crc);
    tx_buffer_[stream.bytes_written + 0] = (crc >> 0)  & 0xFF;
    tx_buffer_[stream.bytes_written + 1] = (crc >> 8)  & 0xFF;
    tx_buffer_[stream.bytes_written + 2] = (crc >> 16) & 0xFF;
    tx_buffer_[stream.bytes_written + 3] = (crc >> 24) & 0xFF;

    // Encode and send proto+CRC as a COBS packet
    packet_serial_.send(tx_buffer_, stream.bytes_written + 4);
}
