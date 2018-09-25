// @flow

import {Batch} from '@swarm/ron';
import {reduce} from '../src';
import {ron2js} from "../src/rga";
import {Frame} from "../../ron/lib";

test('rga \'Hello world!\' reduce', () => {
    const cases = [[
        "*rga#1UQ8p+bart!",
        "*rga#1UQ8p+bart@1UQ8s+bart:0'H'",
        "*rga#1UQ8p+bart@1UQ8sr+bart:1UQ8s+bart'e'",
        "*rga#1UQ8p+bart@1UQ8t+bart:1UQ8sr+bart'l'",
        "*rga#1UQ8p+bart@1UQ8tT+bart:1UQ8t+bart'l'",
        "*rga#1UQ8p+bart@1UQ8ti+bart:1UQ8tT+bart'o'",
        "*rga#1UQ8p+bart@1UQ8w+lisa:1UQ8ti+bart' '",
        "*rga#1UQ8p+bart@1UQ8x+lisa:1UQ8w+lisa'w'",
        "*rga#1UQ8p+bart@1UQ8y+lisa:1UQ8x+lisa'o'",
        "*rga#1UQ8p+bart@1UQ8y1+lisa:1UQ8y+lisa'r'",
        "*rga#1UQ8p+bart@1UQ8y1a+lisa:1UQ8y1+lisa'l'",
        "*rga#1UQ8p+bart@1UQ8y2+lisa:1UQ8y1a+lisa'd'",
        "*rga#1UQ8p+bart@1UQ8yk+lisa:1UQ8y2+lisa'!'",
    ]];

    for (const c of cases) {
        // const result = c.pop();
        const result = "Hello world!";
        let reduced:Frame = reduce(Batch.fromStringArray(...c));
        expect(ron2js(reduced.toString())).toBe(result);
    }
});

test('test', () => {
    let f = new Frame('*rga#test@2:1!:0\'B\'');
    for (const op of f) {
        console.log(op.toString());
    }
});

test('rga reduce', () => {
    const fixtures = [
        // [
        //     '*~ \'empty state + an op\' ?',
        //     '*rga#textB!',
        //     '*rga#textB@time\'A\'',                                                            // ok
        //     '*~ \'a state\' !',
        //     '*rga#textB@time!@\'A\''
        // ],
        // [
        //     '*~ \'a state plus an op\'?',
        //     '*rga#test@1!@\'A\'',                                                              // ok
        //     '*rga#test@2:1\'B\';',
        //     '*~ \'a merged state\'!',
        //     '*rga#test@2!@1\'A\'@2\'B\''
        // ],
        // [
        //     '*~ \'an op plus another op\'?',
        //     '*rga#test@2:1\'B\';',                                                         // ok
        //     '*rga#test@3:2\'C\';',
        //     '*~ \'a subtree patch\'!',
        //     '*rga#test@3:1!@2:0\'B\'@3\'C\''
        // ],
        // [
        //     '*~ \'a state plus a patch\'?',
        //     '*rga#test@1!@\'A\'',
        //     '*rga#test@2:1!:0\'B\'',                                                         // ok
        //     '*~ \'a merged state\'!',
        //     '*rga#test@2!@1\'A\'@2\'B\''
        // ],
        // [
        //     '*~ \'a patch plus a patch\'?',
        //     '*rga#test@2:1!:0\'B\'',                                                        // ok
        //     '*rga#test@3:2!:0\'C\'',
        //     '*~ \'a merged patch\'!',
        //     '*rga#test@3:1!@2:0\'B\'@3\'C\''
        // ],
        // [
        //     '*~ \'a state plus a later state\'?',
        //     '*rga#test@1!@\'A\'',
        //     '*rga#test@2!@1\'A\'@2\'B\'',                                                // ok
        //     '*~ \'the later state\'!',
        //     '*rga#test@2!@1\'A\'@2\'B\''
        // ],
        // [
        //     '*~ \'two diverged states\'?',
        //     '*rga#test@2!@1\'A\'@2\'B\'',
        //     '*rga#test@3!@1\'A\'@3\'C\'',
        //     '*~ \'a merged state\'!',                                                 // ok
        //     '*rga#test@3!@1\'A\'@3\'C\'@2\'B\''
        // ],
        // [
        //     '*~ \'state + state with a new rm\'?',
        //     '*rga#test@2!@1\'A\'@2\'B\'',
        //     '*rga#test@4!@1:4\'A\'@3:0\'C\'',                                            // ok rm
        //     '*~ \'rm applied\'!',
        //     '*rga#test@4!@1:4\'A\'@3:0\'C\'@2\'B\''
        // ],
        // [
        //     '*~ \'an op and a backspace rm\'?',
        //     '*rga#test@2:1\'B\';',                                                    // ok rm
        //     '*rga#test@3:2;',
        //     '*~ \'a patch, rm applied\'!',
        //     '*rga#test@3:1!@2:3\'B\''
        // ],
        // [
        //     '*~ \'a patch and a backspace rm\'?',
        //     '*rga#test@3:1!@2:0\'B\'@3\'C\'',                                       // error rm
        //     '*rga#test@4:2;',
        //     '*~ \'a patch with the rm applied\'!',
        //     '*rga#test@4:1!@2:4\'B\'@3:0\'C\''
        // ],
        // [
        //     '*~ \'a state and an rm-patch\'?',
        //     '*rga#test@2!@1\'A\'@2\'B\'',                                           // error rm
        //     '*rga#test@4:rm!@3:1,@4:2,',
        //     '*~ \'a state with all rms applied\'!',
        //     '*rga#test@4!@1:3\'A\'@2:4\'B\''
        // ],
        // [
        //    '*~ \'diverged states with concurrent rms and stuff\'?',
        //    '*rga#test@5!@1:4a\'A\'@2:5\'B\'',                                     //ok
        //     '*rga#test@4!@1:4\'A\'@3:0\'C\'',
        //     '*~ \'a merged state\'!',
        //     '*rga#test@4!@1:4a\'A\'@3:0\'C\'@2:5\'B\''
        // ],
        // [
        //     '*~ \'two states diverged in a convoluted way\'?',
        //     '*rga#test@3!@1:4a\'A\'@3:0\'C\'@2:5\'B\'',
        //     '*rga#test@4!@1:4a\'A\'@3:0\'C\'@4:0\'D\'@2:5\'B\'',                 // ok
        //     '*~ \'merged\'!',
        //     '*rga#test@4!@1:4a\'A\'@3:0\'C\'@4\'D\'@2:5\'B\''
        // ],
        // [
        //     '*~ \'even more convoluted divergence\'?',
        //     '*rga#test@5!@1:4a\'A\'@5:0\'E\'@3:0\'C\'@2:5\'B\'',
        //     '*rga#test@7!@1:4a\'A\'@6:0\'F\'@3:7\'C\'@4:0\'D\'@2:5\'B\'',           // ok
        //     '*~ \'merged\'!',
        //     '*rga#test@7!@1:4a\'A\'@6:0\'F\'@5\'E\'@3:7\'C\'@4:0\'D\'@2:5\'B\''
        // ]
        // [
        //     '*~ \'a state and an insert op\'?',
        //     '*rga#test@2!@1\'A\'@2\'B\'',                                                 // ok
        //     '*rga#test@3:1\'-\';',
        //     '*~ \'inserted properly\'!',
        //     '*rga#test@3!@1\'A\'@3\'-\'@2\'B\''
        // ],
        // [
        //     '*~ \'rm eclipsed by a concurrent rm\'?',
        //     '*rga#test@4!@1\'A\'@2:4\'B\'',
        //     '*rga#test@3:2;',                                                      // ok rm
        //     '*~ \'skipped\'!',
        //     '*rga#test@3!@1\'A\'@2:4\'B\''
        // ]
        // [
        //     '*~\'reorders: unapplicable remove\'?',
        //     '*rga#test@2!@1\'A\'@2\'B\'',
        //     '*rga#test@4:3;',
        //     '*~ \'rm that is stashed in a separate rm frame\'!',                 // error rm
        //     '*rga#test@4!@1\'A\'@2\'B\'',
        //     '*#@4:rm!:3,'
        // ],
        // [
        //     '*~ \'for a stashed remove, the target arrives\'?',
        //     '*rga#test@4!@1\'A\'@2\'B\' *#@4:rm!:3,',                                   // error rm
        //     '*rga#test@3:2\'C\';',
        //     '*~ \'target removed\'!',
        //     '*rga#test@3!@1\'A\'@2\'B\'@3:4\'C\''
        // ],
        // [
        //     '*~ \'unapplicable patch\'?',
        //     '*rga#test@2!@1\'A\'@2\'B\'',
        //     '*rga#test@5:3!@4:0\'D\'@5\'E\'',
        //     '*~ \'the patch goes into a separate frame\'!',                              // error
        //     '*rga#test@5!@1\'A\'@2\'B\'',
        //     '*#@5:3!@4:0\'D\'@5\'E\''
        // ],
        // [
        //     '*~ \'the stashed patch becomes applicable (the missing link arrives)\'?',
        //     '*rga#test@2!@1\'A\'@2\'B\' *#@5:3!@4:0\'D\'@5\'E\'',                               // ok
        //     '*rga#test@3:2\'C\';',
        //     '*~ \'the patch is applied\'!',
        //     '*rga#test@3!@1\'A\'@2\'B\'@3\'C\'@4\'D\'@5\'E\''
        // ],
        // [
        //     '*~ \'an unappliecable patch with its own rm stash\'?',
        //     '*rga#test@2!@1\'A\'@2\'B\'',
        //     '*rga#test@6:3!@4:0\'D\'@5\'E\'',
        //     '*#@6:rm!:3,',
        //     '*~ \'all separate frames\'!',                                                       // error rm
        //     '*rga#test@6!@1\'A\'@2\'B\'',
        //     '*#@6:3!@4:0\'D\'@5\'E\'',
        //     '*#@6:rm!:3,'
        // ],
        // [
        //     '*~ \'unapplied frames become applicable\'?',
        //     '*rga#test@6!@1\'A\'@2\'B\' *#@6:3!@4:0\'D\'@5\'E\' *#@6:rm!:3,',                       // error rm
        //     '*rga#test@3:2!@\'C\'',
        //     '*~ \'all applied\'!',
        //     '*rga#test@3!@1\'A\'@2\'B\'@3:6\'C\'@4:0\'D\'@5\'E\''
        // ]
    ];

    for (const fixt of fixtures) {
        const outputBatch = new Batch();
        const inputBatch = new Batch();
        let index = 0;
        for (const raw of fixt) {
            const output = new Frame(raw);
            if (output.isComment()) {
                console.info(output.toString());
                index++;
                continue;
            }
            if (index === 1) {
                let b = Batch.split(raw);
                for (const f of b) {
                    inputBatch.frames.push(f);
                }
            }
            if (index === 2) {
                let b = Batch.split(raw);
                for (const f of b) {
                    outputBatch.frames.push(f);
                }
            }

        }

        const reduced:Frame = reduce(inputBatch);
        let s = '';
        for (let o of reduced) {
            s = s + o.toString() +  + '\n';
        }
        // console.log(s);

        expect(reduced.toString()).toBe(outputBatch.join().toString());
    }
});