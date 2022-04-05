/*
EXAMPLE: SearchL2 + ProvL1 + AskL1

T> What did you have for breakfast this morning?
S> I had a toast with butter and…
CODE-SWITCHING BUTTON (L2 → L1)
S> Mermelada (<trans: jam>)
S> ¿Cómo se dice? (<trans: how do you say it?)
CODE-SWITCHING BUTTON (L1 → L2)??
T> Jam
S> Jam
T> Mhm


T> What did you have for breakfast this morning?
S> I had a toast with butter and…
T> 
*/


import { MachineConfig, send, Action } from "xstate";


function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}


const esDict: { [index: string]: string } = {
    'mermelada': 'jam',
    'mantequilla': 'butter',
    'tostada': 'toast'
}


export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'idle',
    states: {
        idle: {
            on: {
                CLICK: 'init'
            }
        },
        init: {
            on: {
                TTS_READY: 'welcome',
                CLICK: 'welcome'
            }
        },
        welcome: {
            initial: 'prompt',
            on: {
                RECOGNISED: [
                    { target: 'helpWord', cond: (context) => context.recResultL2[0].utterance.includes("cómo se dice") }],
                TIMEOUT: '..',
            },
            states: {
                prompt: {
                    entry: say("What did you have for breakfast this morning?"),
                    on: { ENDSPEECH: 'ask' }
                },
                ask: {
                    entry: send('LISTEN')
                }
            }
        },
        helpWord: {
            initial: 'prompt',
            states: {
                prompt: {
                    entry: send((context: SDSContext) => ({
                        type: "SPEAK",
                        value: esDict[context.recResultL2[0].utterance.split(" ")[context.recResultL2[0].utterance.split(" ").length - 1].replace(/[?!]/, "")]
                    })),
                    on: { ENDSPEECH: 'ask' }
                },
                ask: {
                    entry: send('LISTEN')
                }
            }
        }
    }
})