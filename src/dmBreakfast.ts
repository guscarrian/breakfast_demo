/*
EXAMPLE: SearchL2 + ProvL1 + AskL1

T> What did you have for breakfast this morning?
S> I had toast with butter and…
CODE-SWITCHING BUTTON (L2 → L1)
S> Mermelada (<trans: jam>)
S> ¿Cómo se dice? (<trans: how do you say it?)
CODE-SWITCHING BUTTON (L1 → L2)??
T> Jam
S> Jam
T> Mhm


T> What did you have for breakfast this morning?
S> I had toast with butter and…
T> Sorry, I didn't get that. What did you have for breakfast this morning?
*/


import { MachineConfig, send, assign, Action } from "xstate";

function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
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
                    {
                        target: 'missingWord',
                        cond: (context) => context.recResult[0].utterance in breakfastGrammar,
                        actions: assign({ breakfast: (context) => breakfastGrammar[context.recResult[0].utterance] })
                    },
                    {
                       target: 'categoryNotKnown'
                    }
                ]
            },
            states: {
                prompt: {
                    entry: say("What did you have for breakfast this morning?"),
                    on: { ENDSPEECH: 'ask' }
                },
                ask: {
                    entry: send('LISTEN')
                },
                nomatch: {
                    entry: say("Sorry, I didn't get that."),
                    on: { ENDSPEECH: 'prompt'}
                }
            }
        },
        missingWord: {
            initial: 'prompt',
            states: {
                prompt: {
                    entry: say("What did you have for breakfast this morning?"),
                },
                
            }
        },
        categoryNotKnown: {}
    }
})