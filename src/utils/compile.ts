const BLOCKED = new Set([
  'window', 'document', 'fetch', 'XMLHttpRequest', 'eval', 'Function',
  'import', 'require', 'process', 'global', 'globalThis', 'self', 'top',
  'parent', 'frames', 'alert', 'confirm', 'prompt', 'open', 'location',
  'history', 'navigator', 'localStorage', 'sessionStorage', 'indexedDB',
]);

export function compile(rawExpr: string): (x: number) => number {
  let expr = rawExpr.trim();
  if (!expr) throw new Error('empty expression');

  // strip y= or f(x)=
  expr = expr.replace(/^[yf]\s*(?:\([^)]*\))?\s*=\s*/i, '');

  // |expr| → abs(expr)
  expr = expr.replace(/\|([^|]+)\|/g, 'abs($1)');

  // ^ → **
  expr = expr.replace(/\^/g, '**');

  // implicit multiplication: 2x, 2(, )(, )x, x(
  expr = expr.replace(/(\d)(x\b)/gi, '$1*$2');
  expr = expr.replace(/(\d)\(/g, '$1*(');
  expr = expr.replace(/\)(\d)/g, ')*$1');
  expr = expr.replace(/\)(x\b)/gi, ')*$2');
  expr = expr.replace(/(x\b)\(/gi, '$1*(');

  for (const b of BLOCKED) {
    if (new RegExp(`\\b${b}\\b`).test(expr)) {
      throw new Error(`blocked: ${b}`);
    }
  }

  const body = `
    "use strict";
    const {abs,floor,ceil,round,sign,max,min,sqrt,cbrt,log,log2,exp,pow,
           sin,cos,tan,asin,acos,atan,atan2,sinh,cosh,tanh,PI:pi,E:e} = Math;
    const tau = 2 * pi;
    const ln = log;
    const log10 = (x) => Math.log(x) / Math.LN10;
    const sec = (x) => 1 / cos(x);
    const csc = (x) => 1 / sin(x);
    const cot = (x) => 1 / tan(x);
    return (${expr});
  `;

  // eslint-disable-next-line no-new-func
  const fn = new Function('x', body) as (x: number) => number;
  const test = fn(1);
  if (typeof test !== 'number') throw new Error('must return a number');
  return fn;
}
