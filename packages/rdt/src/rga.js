// @flow

import Op, {Batch, Frame, Cursor, FRAME_SEP, ron2js as stringToJs} from '@swarm/ron';
import type { Atom }  from '@swarm/ron';
import UUID, { ZERO as ZERO_UUID } from '@swarm/ron-uuid';
import IHeap, { refComparatorDesc, eventComparatorDesc } from './iheap';
import {ZERO} from "../../ron-uuid/lib";

export const type = UUID.fromString('rga');
const RM_UUID = UUID.fromString('rm');
//private static UUID RM_UUID = UUID.newName("rm");


// [x] multiframe handling: the O(N) multiframe merge
// [ ] undo/redo

// rmmap map[ron.UUID]ron.UUID
function AddMax(rmmap: Map, event: UUID, target: UUID) {
    let ok = rmmap.has(target.toString());
    let rm  = rmmap.get(target.toString());
    if (!ok || event.le(rm)) {
        rmmap[target.toString()] = event
    }
}

function refOrderedBatchComparator(): (Cursor, Cursor) => number {
    return (...args: Array<Cursor>): number => {
        let less = args[0].op.uuid(3).lt(args[1].op.uuid(3));
        // return (less) ? -1 : 1;
        return (less) ? -1 : 1;
    };
}

function revOrderedUUIDSliceComparator(): (UUID, UUID) => number {
    return (...args: Array<UUID>): number => {
        return args[0].gt(args[1]);
    };
}

const active = new IHeap(eventComparatorDesc, refComparatorDesc);
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
    let pending: Array<Cursor> = [];

    for (const frame of batch) {
        if (!frame.isHeader()) {
            if (frame.unzip()[0].values === "") {
                AddMax(rms, frame.event(), frame.ref())
            } else {
                // pending = append(pending, b)
                pending.push(frame.cursor());
            }
        } else {
            if (frame.ref().eq(RM_UUID)) { // rm batch, must be the last
                frame.next();
                while (!frame.eof() && !frame.isHeader()) {
                    AddMax(rms, frame.event(), frame.ref());
                    frame.next()
                }
            } else {
                pending.push(frame.cursor());
            }
        }
    }

    pending.sort(refOrderedBatchComparator());

    for (let i = pending.length - 1; i >= 0; i--) {
        traps[pending[i].op.uuid(3).toString()] = i;
        console.log(pending[i].op.uuid(3).toString() + " " + i)
    }

    for (let i = 0; i < pending.length;) {

        let result:Frame = new Frame();

        let at:UUID = pending[i].op.uuid(3);
        for (; i < pending.length && !pending[i].eof() && pending[i].op.uuid(3).eq(at); i++) {
            active.put(new Frame(pending[i].body));
        }
        delete traps[at.toString()];

        spec.location = new UUID(at.value, at.origin, at.sep);
        spec.event = new UUID(event.value, event.origin, event.sep);
        // TODO
        // result.AppendStateHeader(spec)

        result.push(
            spec.clone()
            // new Op(type, op.uuid(1), op.uuid(2), ZERO, undefined, FRAME_SEP),
        );

        while (!active.eof()) {
            // for (const op of active.frame()) {
                let op:Op = active.current();
                // let op:Op = active.nextPrim();
                if (!op) break;
                // let op:Frame = active.frame();
                // console.log(op.toString());
                let ev:UUID = new UUID(op.event.value, op.event.origin, op.event.sep);
                // spec.SetEvent(ev)
                spec.event = ev;
                let ref:UUID = new UUID(op.location.value, op.location.origin, op.location.sep);
                if (op.isRaw()) {
                    ref = ZERO_UUID;
                }
                if (ev in rms) {
                    let rm:UUID = rms[ev];
                    if (rm.gt(ref)) {
                        ref = rm;
                    }
                    delete rms[ev];
                }

                // TODO
                // result.AppendReducedRef(ref, *op);
                op.location = new UUID(ref.value, ref.origin, ref.sep);
                op.event = new UUID(ev.value, ev.origin, ev.sep);
                // console.log("ev " + ev.toString());
                let s = "op      " + op.toString() + "\n";
                s = s + "result  " + result.toString() + "\n";

                result.pushWithTerm(op, ',');
                s = s + "result2 " + result.toString();
                console.log(s);
                active.nextPrim();

                // console.log("find trap ev=" + ev.toString());
                for (let t = traps[ev.toString()]; (t != null) && t < pending.length; t++) {
                    if (!pending[t].eof() && pending[t].op.uuid(3).eq(ev)) {
                        active.put(pending[t]);
                    } else {
                        break;
                    }
                }
            // }



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
        result.push(spec.clone());
        // take removed event ids

        let refs = [];
        for (let ref in rms) {
            refs.push(UUID.fromString(ref));
        }
        refs.sort(revOrderedUUIDSliceComparator());
        // scan, append
        for (let key in refs) {
            spec.location = key;
            spec.event = rms[key.toString()];
            // TODO
            // result.AppendEmptyReducedOp(spec);
            result.pushWithTerm(spec, ',');
            delete rms[key.toString()];
        }
        produce.push(result);

    }

    // ins = pending[:0] // reuse memory
    for (let x in traps) {
        delete traps[x];
    }

    // int l = produce.frames.length;
    // for (var i = 0; i < pending.length; i++) {
    //     if (!pending[i].eof()) {
    //         produce = new Batch(Frame.append(produce.frames, pending[i].split().frames));
    //     }
    // }

    let l = produce.length;
    for (let i = 0; i < pending.length; i++) {
        // if (!pending[i].eof()){
        let batch = Batch.split(pending[i].body);
        if (batch.frames.length === 1) {
            continue;
        }
        for (let f of batch.frames) {
            produce.push(f);
        }
    }

    if (produce.length === 1) {
        return produce.frames[0];
    } else if (l === produce.frames.length) {
        return produce.join();
    } else {
        // produce.frames[0] = produce.frames[produce.frames.length - 1];
        // produce.frames[produce.frames.length - 1] = produce.frames[0];
        produce.frames[0] = produce.clone().frames[produce.frames.length - 1];
        produce.frames[produce.frames.length - 1] = produce.clone().frames[0];
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
