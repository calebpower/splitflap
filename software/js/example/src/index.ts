import SerialPort = require('serialport')
import {Splitflap, Util, PB} from 'splitflapjs'

const main = async (): Promise<void> => {
    const ports = await SerialPort.list()

    const matchingPorts = ports.filter((portInfo) => {
        return portInfo.vendorId === '10c4' && portInfo.productId === 'ea60' && (
            portInfo.serialNumber === '02280A9E' || portInfo.serialNumber === '022809A3')
    })

    if (matchingPorts.length < 1) {
        console.error(`No splitflap usb serial port found! ${JSON.stringify(ports, undefined, 4)}`)
        return
    } else if (matchingPorts.length > 1) {
        console.error(`Multiple splitflap usb serial ports found: ${JSON.stringify(matchingPorts, undefined, 4)}`)
        return
    }

    const portInfo = matchingPorts[0]
    const splitflap = new Splitflap(portInfo.path, (message: PB.FromSplitflap) => {
        if (message.payload === 'log') {
            console.log(message.log!.msg)
        } else if (message.payload === 'splitflapState' && message.splitflapState && message.splitflapState.modules) {
            const remapped = Util.convert1dChainlinkTo2dDualRowZigZag(message.splitflapState.modules, 18, true)
            let s = ''
            for (let i = 0; i < remapped.length; i++) {
                s += JSON.stringify(remapped[i].map((mod) => { return mod.flapIndex })) + '\n'
            }
            console.log(`State:\n${s}`)
        }
    })

    const readline = require("readline");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const reset = await new Promise<string>((resolve) => {
        rl.question("Reset? y/n", resolve);
    })

    if (reset === 'y') {
        await splitflap.hardReset()
    }

    const flaps = [
        ' ', // BLACK
        'J', // 1
        'B', // 2
        'M', // 3
        'R', // 4
        '$', // 5
        'V', // 6
        'K', // 7
        'A', // 8
        'E', // 9
        'N', // 10
        'O', // 11
        'y', // YELLOW
        '*', // 13
        'g', // GREEN
        'G', // 15
        'I', // 16
        '%', // 17
        'D', // 18
        'L', // 19
        '&', // 20
        '@', // 21
        'C', // 22
        'W', // 23
        'H', // 24
        'Y', // 25
        'w', // WHITE
        'Q', // 27
        'p', // PINK
        'o', // ORANGE
        '!', // 30
        'T', // 31
        'Z', // 32
        'P', // 33
        'F', // 34
        '?', // 35
        'S', // 36
        '#', // 37
        'U', // 38
        'X', // 39
    ]

    const charToFlapIndex = (c: string): number | null => {
        const i = flaps.indexOf(c)
        if (i >= 0) {
            return i
        } else {
            return null
        }
    }

    const stringToFlapIndexArray = (str: string): Array<number | null> => {
        return str.split('').map(charToFlapIndex)
    }

    type anim = [number, string[]]
    const animation: anim[] = [
        [10000, [
            '$$$$$$$$$$$$$$$$$$',
            '$$$$$$$$$$$$$$$$$$',
            '$$$$$$$$$$$$$$$$$$',
            '$$$$$$$$$$$$$$$$$$',
            '$$$$$$$$$$$$$$$$$$',
            '$$$$$$$$$$$$$$$$$$',
        ]],
        [3000, [
            'yyyyyyyyyyyyyyyyyy',
            'yyyyyyyyyyyyyyyyyy',
            'yyyyyyyyyyyyyyyyyy',
            'yyyyyyyyyyyyyyyyyy',
            'yyyyyyyyyyyyyyyyyy',
            'yyyyyyyyyyyyyyyyyy',
        ]],
        [700, [
            'gggggggggggggggggg',
            'g~~~~~~~~~~~~~~~~g',
            'g~~~~~~~~~~~~~~~~g',
            'g~~~~~~~~~~~~~~~~g',
            'g~~~~~~~~~~~~~~~~g',
            'gggggggggggggggggg',
        ]],
        [500, [
            '~~~~~~~~~~~~~~~~~~',
            '~gggggggggggggggg~',
            '~g~~~~~~~~~~~~~~g~',
            '~g~~~~~~~~~~~~~~g~',
            '~gggggggggggggggg~',
            '~~~~~~~~~~~~~~~~~~',
        ]],
        [350, [
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~g~~~~~~~~~~~~g~~',
            '~~g~~~~~~~~~~~~g~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
        ]],
        [300, [
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~g~~~~~~~~~~g~~~',
            '~~~g~~~~~~~~~~g~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
        ]],
        [250, [
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~g~~~~~~~~g~~~~',
            '~~~~g~~~~~~~~g~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
        ]],
        [200, [
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~g~~~~~~g~~~~~',
            '~~~~~g~~~~~~g~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
        ]],
        [100, [
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~g~~~~g~~~~~~',
            '~~~~~~g~~~~g~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
        ]],
        [100, [
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~g~~g~~~~~~~',
            '~~~~~~~g~~g~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
        ]],
        [3000, [
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~gg~~~~~~~~',
            '~~~~~~~~gg~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
        ]],
        [4000, [
            '~~~~~~~~~~~~~~~~~~',
            '~~~~          ~~~~',
            '~~~~          ~~~~',
            '~~~~          ~~~~',
            '~~~~          ~~~~',
            '~~~~~~~~~~~~~~~~~~',
        ]],
        [8000, [
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~CODE~~~~~~~~~',
            '~~~~~~~~~~ART~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
        ]],
        [8000, [
            ' OCTOBER  SEVENTH ',
            '          EIGHTH  ',
            '        & NINTH   ',
            '                  ',
            '  FIVE TO TEN PM  ',
            '                  ',
        ]],
        [8000, [
            '                  ',
            '                  ',
            '     DOWNTOWN     ',
            '    PALO  ALTO    ',
            '                  ',
            '                  ',
        ]],
        [3800, [
            '@@@@@@@@@@@@@@@@@@',
            '@@@@@@@@@@@@@@@@@@',
            '@@@@@@@@@@@@@@@@@@',
            '@@@@@@@@@@@@@@@@@@',
            '@@@@@@@@@@@@@@@@@@',
            '@@@@@@@@@@@@@@@@@@',
        ]],
        [500, [
            'wwwwwwwwwwwwwwwwww',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
        ]],
        [500, [
            '~~~~~~~~~~~~~~~~~~',
            'wwwwwwwwwwwwwwwwww',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
        ]],
        [500, [
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            'wwwwwwwwwwwwwwwwww',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
        ]],
        [500, [
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            'wwwwwwwwwwwwwwwwww',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
        ]],
        [500, [
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            'wwwwwwwwwwwwwwwwww',
            '~~~~~~~~~~~~~~~~~~',
        ]],
        [500, [
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            'wwwwwwwwwwwwwwwwww',
        ]],
        [200, [
            '~~~~~~~~~~~~~~~~~p',
            '~~~~~~~~~~~~~~~~~p',
            '~~~~~~~~~~~~~~~~~p',
            '~~~~~~~~~~~~~~~~~p',
            '~~~~~~~~~~~~~~~~~p',
            '~~~~~~~~~~~~~~~~~p',
        ]],
        [200, [
            '~~~~~~~~~~~~~~~~p~',
            '~~~~~~~~~~~~~~~~p~',
            '~~~~~~~~~~~~~~~~p~',
            '~~~~~~~~~~~~~~~~p~',
            '~~~~~~~~~~~~~~~~p~',
            '~~~~~~~~~~~~~~~~p~',
        ]],
        [200, [
            '~~~~~~~~~~~~~~~p~~',
            '~~~~~~~~~~~~~~~p~~',
            '~~~~~~~~~~~~~~~p~~',
            '~~~~~~~~~~~~~~~p~~',
            '~~~~~~~~~~~~~~~p~~',
            '~~~~~~~~~~~~~~~p~~',
        ]],
        [200, [
            '~~~~~~~~~~~~~~p~~~',
            '~~~~~~~~~~~~~~p~~~',
            '~~~~~~~~~~~~~~p~~~',
            '~~~~~~~~~~~~~~p~~~',
            '~~~~~~~~~~~~~~p~~~',
            '~~~~~~~~~~~~~~p~~~',
        ]],
        [200, [
            '~~~~~~~~~~~~~p~~~~',
            '~~~~~~~~~~~~~p~~~~',
            '~~~~~~~~~~~~~p~~~~',
            '~~~~~~~~~~~~~p~~~~',
            '~~~~~~~~~~~~~p~~~~',
            '~~~~~~~~~~~~~p~~~~',
        ]],
        [200, [
            '~~~~~~~~~~~~p~~~~~',
            '~~~~~~~~~~~~p~~~~~',
            '~~~~~~~~~~~~p~~~~~',
            '~~~~~~~~~~~~p~~~~~',
            '~~~~~~~~~~~~p~~~~~',
            '~~~~~~~~~~~~p~~~~~',
        ]],
        [200, [
            '~~~~~~~~~~~p~~~~~~',
            '~~~~~~~~~~~p~~~~~~',
            '~~~~~~~~~~~p~~~~~~',
            '~~~~~~~~~~~p~~~~~~',
            '~~~~~~~~~~~p~~~~~~',
            '~~~~~~~~~~~p~~~~~~',
        ]],
        [200, [
            '~~~~~~~~~~p~~~~~~~',
            '~~~~~~~~~~p~~~~~~~',
            '~~~~~~~~~~p~~~~~~~',
            '~~~~~~~~~~p~~~~~~~',
            '~~~~~~~~~~p~~~~~~~',
            '~~~~~~~~~~p~~~~~~~',
        ]],
        [200, [
            '~~~~~~~~~p~~~~~~~~',
            '~~~~~~~~~p~~~~~~~~',
            '~~~~~~~~~p~~~~~~~~',
            '~~~~~~~~~p~~~~~~~~',
            '~~~~~~~~~p~~~~~~~~',
            '~~~~~~~~~p~~~~~~~~',
        ]],
        [200, [
            '~~~~~~~~p~~~~~~~~~',
            '~~~~~~~~p~~~~~~~~~',
            '~~~~~~~~p~~~~~~~~~',
            '~~~~~~~~p~~~~~~~~~',
            '~~~~~~~~p~~~~~~~~~',
            '~~~~~~~~p~~~~~~~~~',
        ]],
        [200, [
            '~~~~~~~p~~~~~~~~~~',
            '~~~~~~~p~~~~~~~~~~',
            '~~~~~~~p~~~~~~~~~~',
            '~~~~~~~p~~~~~~~~~~',
            '~~~~~~~p~~~~~~~~~~',
            '~~~~~~~p~~~~~~~~~~',
        ]],
        [200, [
            '~~~~~~p~~~~~~~~~~~',
            '~~~~~~p~~~~~~~~~~~',
            '~~~~~~p~~~~~~~~~~~',
            '~~~~~~p~~~~~~~~~~~',
            '~~~~~~p~~~~~~~~~~~',
            '~~~~~~p~~~~~~~~~~~',
        ]],
        [200, [
            '~~~~~p~~~~~~~~~~~~',
            '~~~~~p~~~~~~~~~~~~',
            '~~~~~p~~~~~~~~~~~~',
            '~~~~~p~~~~~~~~~~~~',
            '~~~~~p~~~~~~~~~~~~',
            '~~~~~p~~~~~~~~~~~~',
        ]],
        [200, [
            '~~~~p~~~~~~~~~~~~~',
            '~~~~p~~~~~~~~~~~~~',
            '~~~~p~~~~~~~~~~~~~',
            '~~~~p~~~~~~~~~~~~~',
            '~~~~p~~~~~~~~~~~~~',
            '~~~~p~~~~~~~~~~~~~',
        ]],
        [200, [
            '~~~p~~~~~~~~~~~~~~',
            '~~~p~~~~~~~~~~~~~~',
            '~~~p~~~~~~~~~~~~~~',
            '~~~p~~~~~~~~~~~~~~',
            '~~~p~~~~~~~~~~~~~~',
            '~~~p~~~~~~~~~~~~~~',
        ]],
        [200, [
            '~~p~~~~~~~~~~~~~~~',
            '~~p~~~~~~~~~~~~~~~',
            '~~p~~~~~~~~~~~~~~~',
            '~~p~~~~~~~~~~~~~~~',
            '~~p~~~~~~~~~~~~~~~',
            '~~p~~~~~~~~~~~~~~~',
        ]],
        [200, [
            '~p~~~~~~~~~~~~~~~~',
            '~p~~~~~~~~~~~~~~~~',
            '~p~~~~~~~~~~~~~~~~',
            '~p~~~~~~~~~~~~~~~~',
            '~p~~~~~~~~~~~~~~~~',
            '~p~~~~~~~~~~~~~~~~',
        ]],
        [200, [
            'p~~~~~~~~~~~~~~~~~',
            'p~~~~~~~~~~~~~~~~~',
            'p~~~~~~~~~~~~~~~~~',
            'p~~~~~~~~~~~~~~~~~',
            'p~~~~~~~~~~~~~~~~~',
            'p~~~~~~~~~~~~~~~~~',
        ]],
        [200, [
            'oooooooooooooooooo',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
        ]],
        [200, [
            '~~~~~~~~~~~~~~~~~~',
            'oooooooooooooooooo',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
        ]],
        [200, [
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            'oooooooooooooooooo',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
        ]],
        [200, [
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            'oooooooooooooooooo',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
        ]],
        [200, [
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            'oooooooooooooooooo',
            '~~~~~~~~~~~~~~~~~~',
        ]],
        [2000, [
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            '~~~~~~~~~~~~~~~~~~',
            'oooooooooooooooooo',
        ]],
    ]

    let cur = 0
    const runAnimation = () => {
        splitflap.setPositions(Util.convert2dDualRowZigZagTo1dChainlink(animation[cur][1].map(stringToFlapIndexArray), true))
        setTimeout(runAnimation, animation[cur][0])
        cur = (cur + 1) % animation.length
    }

    runAnimation()
}

main()
