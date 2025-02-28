import { isEqual } from 'lodash';
import { Delta } from 'quill';

function deltaLength(delta: Delta): number {
  return delta.ops.reduce((acc, op) => {
    if (typeof op.insert === 'string') {
      return acc + op.insert.length;
    }
    return acc + 1;
  }, 0);
}

/**
 * Diffs two pure insert Deltas and returns the difference between them.
 */
export default function diffDeltas(d1: Delta, d2: Delta): Delta {
  // WARNING: Really janky and inefficient diff checking algorithm
  // Check from the back and front, and find the common parts
  const d1Length = deltaLength(d1);
  const d2Length = deltaLength(d2);
  let keepStart = 0;
  let keepStartObjs = 0;
  for (let i = 0; i < d1.ops.length; i++) {
    const op = d1.ops[i];
    const newOp = d2.ops[i];
    if (isEqual(op, newOp)) {
      keepStart += typeof op.insert === 'string' ? op.insert.length : 1;
      keepStartObjs++;
    } else {
      console.log('diff', op, newOp);
      break;
    }
  }

  // Now, from the back!
  let keepEnd = 0;
  let keepEndObjs = 0;
  for (let i = d1.ops.length - 1; i >= 0; i--) {
    const op = d1.ops[i];
    const newOp = d2.ops[i];
    if (isEqual(op, newOp)) {
      keepEnd += typeof op.insert === 'string' ? op.insert.length : 1;
      keepEndObjs++;
    } else {
      console.log('diff', op, newOp);
      break;
    }
  }

  console.log(`Keep start: ${keepStart}, end: ${keepEnd}, length: ${d2Length}`);

  // Retain up to keepStart, then delete the middle and replace, then retain the end
  let delta = new Delta();
  if (keepStart > 0) delta = delta.retain(keepStart);
  delta = delta.delete((d1Length || 0) - keepStart - keepEnd);

  for (let i = keepStartObjs; i < d2.ops.length - keepEndObjs; i++) {
    delta.push(d2.ops[i]);
  }
  if (keepEnd > 0) delta = delta.retain(keepEnd);
  console.log(delta.ops);
  return delta;
}
