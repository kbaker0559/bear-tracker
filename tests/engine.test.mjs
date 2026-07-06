function assert(name, condition) {
  if (!condition) throw new Error(`FAIL: ${name}`);
  console.log(`PASS: ${name}`);
}

function strokesOnHole(handicap, strokeIndex) {
  if (handicap <= 0) return 0;
  const base = Math.floor(handicap / 18);
  const remainder = handicap % 18;
  return base + (strokeIndex <= remainder ? 1 : 0);
}

function stablefordPoints(net, par) {
  const relative = net - par;
  if (relative <= -3) return 8;
  if (relative === -2) return 6;
  if (relative === -1) return 4;
  if (relative === 0) return 2;
  if (relative === 1) return 1;
  return 0;
}

function quotaAdjustment(delta, inMoney) {
  if (delta <= -10) return -4;
  if (delta <= -6) return -3;
  if (delta <= -3) return -2;
  if (delta <= -1) return -1;
  if (delta === 0) return 0;
  if (!inMoney) return 0;
  if (delta <= 2) return 1;
  if (delta <= 4) return 2;
  if (delta <= 6) return 3;
  if (delta <= 9) return 4;
  return Math.ceil(delta / 2);
}

assert('12 handicap gets stroke on SI 5', strokesOnHole(12, 5) === 1);
assert('12 handicap gets no stroke on SI 17', strokesOnHole(12, 17) === 0);
assert('19 handicap gets 2 strokes on SI 1', strokesOnHole(19, 1) === 2);
assert('net par is 2 Stableford points', stablefordPoints(4, 4) === 2);
assert('net birdie is 4 Stableford points', stablefordPoints(3, 4) === 4);
assert('net double bogey is 0 Stableford points', stablefordPoints(6, 4) === 0);
assert('plus 3 in money goes up 2', quotaAdjustment(3, true) === 2);
assert('plus 3 out of money does not increase', quotaAdjustment(3, false) === 0);
assert('plus 11 in money rounds up half to 6', quotaAdjustment(11, true) === 6);
assert('minus 10 drops 4', quotaAdjustment(-10, false) === -4);
