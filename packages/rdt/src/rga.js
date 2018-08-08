// @flow

import Op, {Batch, Frame, FRAME_SEP, ron2js as stringToJs} from '@swarm/ron';
import type { Atom }  from '@swarm/ron';
import UUID, { ZERO as ZERO_UUID } from '@swarm/ron-uuid';
import IHeap, { refComparator, eventComparatorDesc } from './iheap';
import {ZERO} from "../../ron-uuid/lib";

export const type = UUID.fromString('rga');
const RM_UUID = UUID.fromString('rm');
//private static UUID RM_UUID = UUID.newName("rm");


// [x] multiframe handling: the O(N) multiframe merge
// [ ] undo/redo

// rmmap map[ron.UUID]ron.UUID
function AddMax(rmmap: Map, event: UUID, target: UUID) {
    let ok = rmmap.has(target);
    let rm  = rmmap.get(target);
    if (!ok || event.le(rm)) {
        rmmap[target] = event
    }
}

function refOrderedBatchComparator(): (Frame, Frame) => number {
    return (...args: Array<Frame>): number => {
        let less = args[0].ref().lt(args[1].ref());
        // return (less) ? -1 : 1;
        return (less) ? -1 : 1;
    };
}

function revOrderedUUIDSliceComparator(): (UUID, UUID) => number {
    return (...args: Array<UUID>): number => {
        return args[0].gt(args[1]);
    };
}

const active = new IHeap(refComparator, eventComparatorDesc);
// <UUID,UUID>
const rms = new Map();
const ins = [];
// <String, int>
const traps = new Map();

// RGA reducer.
export function reduce(batch: Batch): Frame {

    let rdtype:UUID;
    let object:UUID;
    let event:UUID;
    for (const op of batch.frames[0]) {
        rdtype = op.uuid(0);
        object = op.uuid(1);
        break;
    }

    for (const op of batch.frames[batch.frames.length - 1]) {
        // console.log(op);
        event = op.uuid(2);
        break;
    }

    let spec:Op = new Op(rdtype,object, event, ZERO_UUID, undefined, FRAME_SEP);

    let produce:Batch = new Batch();
    let pending = [];

    for (const frame of batch) {
        if (!frame.isHeader()) {
            if (frame.length === 0) {
                AddMax(rms, frame.event(), frame.ref())
            } else {
                // pending = append(pending, b)
                pending.push(frame);
            }
        } else {
            if (frame.ref().eq(RM_UUID)) { // rm batch, must be the last
                frame.next();
                while (!frame.eof() && !frame.isHeader()) {
                    AddMax(rms, frame.event(), frame.ref());
                    frame.next()
                }
            } else {
                pending.push(frame);
            }
        }
    }

    pending.sort(refOrderedBatchComparator());

    for (let i = pending.length - 1; i >= 0; i--) {
        traps[pending[i].ref().toString()] = i;
    }

    for (let i = 0; i < pending.length;) {

        let result:Frame = new Frame();

        let at:UUID = pending[i].ref();
        for (; i < pending.length /*&& !pending[i].eof() */&& pending[i].ref().eq(at); i++) {
            active.put(pending[i]);
        }
        delete traps[at.toString()];

        spec.ref = at;
        spec.event = event;
        // TODO
        // result.AppendStateHeader(spec)

        result.push(
            spec
            // new Op(type, op.uuid(1), op.uuid(2), ZERO, undefined, FRAME_SEP),
        );

        for (;!active.eof();) {
            let op:Op = active.current();
            // let op:Frame = active.frame();
            // console.log(op);
            let ev:UUID = op.event;
            // spec.SetEvent(ev)
            spec.event = ev;
            let ref:UUID = op.location;
            if (op.isRaw()) {
                ref = ZERO_UUID;
            }
            if (ev in rms) {
                let rm = rms[ev];
                if (rm.lt(ref)) {
                    ref = rm;
                }
                delete rms[ev];
            }

            // TODO
            // result.AppendReducedRef(ref, *op);
            // for (let o in op) {
            op.location = ref;
            // console.log("pushWithTerm " + op.toString());
                result.pushWithTerm(op, ',');
            // }

            active.nextPrim();

            for (let t = traps[ev]; (t != null) && t < pending.length; t++) {
                if (/*!pending[t].eof() &&*/ pending[t].ref().eq(ev)) {
                    active.put(pending[t]);
                } else {
                    break;
                }
            }
        }
        produce.push(result);

        for (;i < pending.length /*&& pending[i].eof()*/;) {
            i++
        }
    }

    // a separate frame for all the removes we don't have a target for
    if (rms.length > 0) {
        let result = new Frame();
        spec.event = event;
        spec.location = RM_UUID;
        // result.AppendStateHeader(spec)
        result.push(spec);
        // take removed event ids

        let refs = [];
        for (let ref in rms) {
            refs.push(ref);
        }
        refs.sort(revOrderedUUIDSliceComparator());
        // scan, append
        for (let key in refs) {
            spec.location = key;
            spec.event = rms[key];
            // TODO
            // result.AppendEmptyReducedOp(spec);
            result.pushWithTerm(spec, ',');
            delete rms[key];
        }
        produce.push(result);

    }

    // ins = pending[:0] // reuse memory
    for (let x in traps) {
        delete traps[x];
    }

    let l = produce.length;
    for (let i = 0; i < pending.length; i++) {
        // TODO
        // if (!pending[i].eof()) {
        //     for (let f of Batch.splitByID(pending[i]).frames) {
        //         produce.push(f);
        //     }
        // }
    }

    if (produce.length === 1) {
        return produce.frames[0];
    } else if (l === produce.length) {
        return produce.join();
    } else {
        let b = produce[0];
        produce.frames[produce.length-1] = produce[0].frames;
        produce.frames[produce.length-1] = b.frames;
        return reduce(produce);
    }

    ////////////
}

export function ron2js(rawFrame: string): string {
    const ret = {};

    const rga:Frame = new Frame(rawFrame);

    // if (!rga.type().equals(RGA_UUID) || !rga.isHeader()) {
    //     return "";
    // }
    let sb:string = '';
    for (const op of rga) {
        if (op.location.isZero()) {
             sb = sb + stringToJs(op.values);
        }
    }
    // for (rga.next(); !rga.eof() && !rga.isHeader(); rga.next()) {
    //
    // }
    return sb;
}

export default { reduce, type };
