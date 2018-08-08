// @flow

import {Batch} from '@swarm/ron';
import {reduce} from '../src';
import {ron2js} from "../src/rga";

test('rga reduce', () => {
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
