/*
(convered)
EXAMPLE: SearchL2 + AskL1 + ProvL1

T> What did you have for breakfast this morning?
S> I had a toast with butter and…
S> ¿Cómo se dice 'mermelada'? (<trans: how do you say 'jam'?)
T> Jam
S> Jam
(it repeats until S pronounces the word 'jam' correctly)
T> Uh-huh
T> Did you have anything else?

1.
S> Yes, I had a juice too
T> Yummy!
T> Did you... (repeats until negative answer)
T> Ok, good breakfast!
STOP --> init

2.
S> No.
T> Ok, good breakfast!
STOP --> init

------------------------------------

(not convered so far)
EXAMPLE: SearchL2 + ProvL1 + AskL1

T> What did you have for breakfast this morning?
S> I had a toast with butter and…
S> Mermelada (<trans: jam>)
S> ¿Cómo se dice? (<trans: how do you say it?)
T> Jam
S> Jam
T> Jam



T> What did you have for breakfast this morning?
S> I had a toast with butter and…
T> 
*/


import { MachineConfig, send, assign, Action } from "xstate";




function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}


const esDict: { [index: string]: string } = {
    'mermelada': 'jam.',
    'mantequilla': 'butter.',
    'tostada': 'toast.',
    'cereales': 'cereals.',
    'leche': 'milk.',
    'café': 'coffee.',
    'zumo': 'juice.',
    'queso': 'cheese.',
    'tortitas': 'pancakes.',
    'jamón': 'ham.',
    'yogur': 'yogurt.',
    'aceite': 'olive oil',
    'fruta': 'fruit.',
    'tomate': 'tomato.'

}


let askL1 = ["cómo se dice","cómo es"]
//indask --> no sé cómo se dice




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
                    { target: 'helpWord', cond: (context) => context.recResultL2[0].utterance.toLowerCase().includes("cómo se dice") },
                    //{ target: 'helpWord', cond: (context) => askL1.map((x) => context.recResultL2[0].utterance.toLowerCase().includes(x)).reduce((a,b) => a||b) },
                    { target: 'unrelated' }],
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
                    entry: [
                        assign((context, event) => { return { unknownWord: esDict[context.recResultL2[0].utterance.split(" ")[context.recResultL2[0].utterance.split(" ").length - 1].replace(/[?!]/, "")] } }),
                        send((context: SDSContext) => ({
                        type: "SPEAK",
                        value: context.unknownWord
                    }))],
                    on: { ENDSPEECH: 'test' }
                },
                test: {
                    entry: send('LISTEN'),
                    on: { RECOGNISED: 
                        [
                        {target: 'ack', cond: (context) => context.unknownWord === context.recResult[0].utterance.toLowerCase()},
                        {target: 'provL2'}
                    ] 
                }
                },
                ack: {
                    entry: say("Uh-huh"),
                    on: { ENDSPEECH: '#root.dm.secondQuestion' }
                },
                provL2: {
                    entry: [
                        send((context: SDSContext) => ({
                        type: "SPEAK",
                        value: context.unknownWord
                    }))],
                    on: { ENDSPEECH: 'test' }
                }

            }
        },
        unrelated: {
            initial: 'prompt',
            states: {
                prompt: {
                    entry: say("Yummy!"),
                    on: { ENDSPEECH: 'unrelated' }
                },
                unrelated: {
                    always: '#root.dm.secondQuestion'
                }
            }
        },
        secondQuestion: {
            initial: 'prompt',
            on: {
                RECOGNISED: [
                    { target: 'stop', cond: (context) => context.recResult[0].utterance === 'No.' },
                    { target: 'helpWord', cond: (context) => context.recResultL2[0].utterance.toLowerCase().includes("cómo se dice") },
                    { target: 'unrelated' }],
                TIMEOUT: '..',
            },
            states: {
                prompt: {
                    entry: say("Did you have anything else?"),
                    on: { ENDSPEECH: 'ask' }
                },
                ask: {
                    entry: send('LISTEN')
                }
            }
        },
        stop: {
            entry: say("Ok, good breakfast!"),
            always: 'init'
        },
    }
})

