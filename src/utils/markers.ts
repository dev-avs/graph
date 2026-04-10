import { KeyPoint } from '../types';

export function findKeyPoints(
  fn: (x: number) => number,
  color: string,
  xMin: number,
  xMax: number,
  maxPoints = 15
): KeyPoint[] {
  const points: KeyPoint[] = [];
  const STEPS = 300;
  const dx = (xMax - xMin) / STEPS;
  const h = 1e-5;

  const safeEval = (x: number): number | null => {
    try {
      const y = fn(x);
      return isFinite(y) ? y : null;
    } catch {
      return null;
    }
  };

  const deriv = (x: number): number | null => {
    const a = safeEval(x - h);
    const b = safeEval(x + h);
    if (a === null || b === null) return null;
    return (b - a) / (2 * h);
  };

  // Sample the visible range
  const xs: number[] = [];
  const ys: (number | null)[] = [];
  for (let i = 0; i <= STEPS; i++) {
    const x = xMin + i * dx;
    xs.push(x);
    ys.push(safeEval(x));
  }

  const tol = (xMax - xMin) * 0.005;
  const isDuplicate = (x: number, y: number): boolean =>
    points.some(p => Math.abs(p.x - x) < tol && Math.abs(p.y - y) < tol * 10);

  // Y-intercept
  if (xMin <= 0 && 0 <= xMax) {
    const y = safeEval(0);
    if (y !== null && !isDuplicate(0, y)) {
      points.push({ x: 0, y, kind: 'yint', label: `(0, ${fmt(y)})`, color });
    }
  }

  // X-intercepts (zeros)
  for (let i = 0; i < STEPS && points.length < maxPoints; i++) {
    const y0 = ys[i], y1 = ys[i + 1];
    if (y0 === null || y1 === null) continue;
    if (Math.abs(y0) < 1e-9) {
      if (!isDuplicate(xs[i], 0))
        points.push({ x: xs[i], y: 0, kind: 'zero', label: `(${fmt(xs[i])}, 0)`, color });
      continue;
    }
    if (y0 * y1 < 0) {
      const z = bisect(fn, xs[i], xs[i + 1]);
      if (z !== null && !isDuplicate(z, 0))
        points.push({ x: z, y: 0, kind: 'zero', label: `(${fmt(z)}, 0)`, color });
    }
  }

  // Local extrema (derivative sign changes)
  let prevD: number | null = null;
  for (let i = 1; i < xs.length && points.length < maxPoints; i++) {
    const d = deriv(xs[i]);
    if (d === null) { prevD = null; continue; }
    if (prevD !== null && prevD * d < 0) {
      const ex = bisectDeriv(fn, xs[i - 1], xs[i], h);
      if (ex !== null) {
        const ey = safeEval(ex);
        if (ey !== null && !isDuplicate(ex, ey)) {
          const kind = d < 0 ? 'max' : 'min';
          points.push({ x: ex, y: ey, kind, label: `(${fmt(ex)}, ${fmt(ey)})`, color });
        }
      }
    }
    prevD = d;
  }

  return points;
}

function bisect(fn: (x: number) => number, a: number, b: number, iters = 40): number | null {
  try {
    let fa = fn(a), fb = fn(b);
    if (!isFinite(fa) || !isFinite(fb) || fa * fb > 0) return null;
    for (let i = 0; i < iters; i++) {
      const m = (a + b) / 2;
      const fm = fn(m);
      if (!isFinite(fm)) return null;
      if (Math.abs(fm) < 1e-12 || b - a < 1e-12) return m;
      if (fa * fm <= 0) { b = m; fb = fm; } else { a = m; fa = fm; }
    }
    return (a + b) / 2;
  } catch { return null; }
}

function bisectDeriv(fn: (x: number) => number, a: number, b: number, h: number, iters = 30): number | null {
  const d = (x: number): number | null => {
    try {
      const v = (fn(x + h) - fn(x - h)) / (2 * h);
      return isFinite(v) ? v : null;
    } catch { return null; }
  };
  const da0 = d(a), db0 = d(b);
  if (da0 === null || db0 === null || da0 * db0 > 0) return null;
  let lo = a, hi = b, dlo = da0;
  for (let i = 0; i < iters; i++) {
    const m = (lo + hi) / 2;
    const dm = d(m);
    if (dm === null) return null;
    if (Math.abs(dm) < 1e-10 || hi - lo < 1e-10) return m;
    if (dlo * dm <= 0) { hi = m; } else { lo = m; dlo = dm; }
  }
  return (lo + hi) / 2;
}

function fmt(n: number): string {
  if (Math.abs(n) < 1e-9) return '0';
  if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
  const abs = Math.abs(n);
  if (abs >= 100) return n.toFixed(1);
  if (abs >= 10) return n.toFixed(2);
  return n.toFixed(3);
}

export function findIntersections(
  fn1: (x: number) => number,
  fn2: (x: number) => number,
  color: string,
  xMin: number,
  xMax: number,
  maxPoints = 15
): KeyPoint[] {
  const points: KeyPoint[] = [];
  const STEPS = 160;
  const dx = (xMax - xMin) / STEPS;

  const diff = (x: number) => {
    try {
      const y1 = fn1(x), y2 = fn2(x);
      return (isFinite(y1) && isFinite(y2)) ? y1 - y2 : null;
    } catch { return null; }
  };

  const xs: number[] = [];
  const dfs: (number | null)[] = [];
  for (let i = 0; i <= STEPS; i++) {
    const x = xMin + i * dx;
    xs.push(x);
    dfs.push(diff(x));
  }

  const tol = (xMax - xMin) * 0.005;
  const isDuplicate = (x: number, y: number): boolean =>
    points.some(p => Math.abs(p.x - x) < tol && Math.abs(p.y - y) < tol * 10);

  for (let i = 0; i < STEPS && points.length < maxPoints; i++) {
    const d0 = dfs[i], d1 = dfs[i + 1];
    if (d0 === null || d1 === null) continue;
    
    if (d0 * d1 < 0) {
      const z = bisectIntersect(fn1, fn2, xs[i], xs[i + 1]);
      if (z !== null) {
        try {
          const y = fn1(z);
          if (isFinite(y) && !isDuplicate(z, y)) {
            points.push({ x: z, y, kind: 'intersect', label: `(${fmt(z)}, ${fmt(y)})`, color: '#aaaaaa' });
          }
        } catch {}
      }
    }
  }

  return points;
}

function bisectIntersect(fn1: (x: number) => number, fn2: (x: number) => number, a: number, b: number, iters = 40): number | null {
  try {
    let fa = fn1(a) - fn2(a), fb = fn1(b) - fn2(b);
    if (!isFinite(fa) || !isFinite(fb) || fa * fb > 0) return null;
    for (let i = 0; i < iters; i++) {
      const m = (a + b) / 2;
      const fm = fn1(m) - fn2(m);
      if (!isFinite(fm)) return null;
      if (Math.abs(fm) < 1e-12 || b - a < 1e-12) return m;
      if (fa * fm <= 0) { b = m; fb = fm; } else { a = m; fa = fm; }
    }
    return (a + b) / 2;
  } catch { return null; }
}
