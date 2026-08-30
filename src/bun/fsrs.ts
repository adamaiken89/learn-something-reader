// FSRS-6 default parameters (21 params, from open-spaced-repetition/ts-fsrs default_w)
export const W = [
  0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666, 0.796, 1.4835,
  0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658, 0.1542,
] as const;

const DECAY = -W[20];
const FACTOR = 0.9 ** (1 / DECAY) - 1;
const MAX_INTERVAL = 36500;

export function clamp(v: number, lo = 0.001, hi = MAX_INTERVAL): number {
  return Math.max(lo, Math.min(hi, v));
}

export function retrievability(elapsedDays: number, stability: number): number {
  return (1 + (FACTOR * elapsedDays) / stability) ** DECAY;
}

export function initStability(rating: number): number {
  return clamp(W[rating - 1]);
}

export function initDifficulty(rating: number): number {
  const d = W[4] - Math.exp(W[5] * (rating - 1)) + 1;
  return Math.max(1, Math.min(10, d));
}

export function shortTermStability(stability: number, rating: number): number {
  let increase = Math.exp(W[17] * (rating - 3 + W[18])) * stability ** -W[19];
  if (rating >= 3) increase = Math.max(increase, 1.0);
  return clamp(stability * increase);
}

function linearDamping(deltaD: number, d: number): number {
  return ((10 - d) * deltaD) / 9;
}

function meanReversion(arg1: number, arg2: number): number {
  return W[7] * arg1 + (1 - W[7]) * arg2;
}

export function nextDifficulty(difficulty: number, rating: number): number {
  const arg1 = W[4] - Math.exp(W[5] * (4 - 1)) + 1;
  const deltaD = -W[6] * (rating - 3);
  const arg2 = difficulty + linearDamping(deltaD, difficulty);
  const nd = meanReversion(arg1, arg2);
  return Math.max(1, Math.min(10, nd));
}

export function nextRecallStability(
  difficulty: number,
  stability: number,
  retriev: number,
  rating: number,
): number {
  const hardPenalty = rating === 2 ? W[15] : 1;
  const easyBonus = rating === 4 ? W[16] : 1;
  const delta =
    Math.exp(W[8]) *
    (11 - difficulty) *
    stability ** -W[9] *
    (Math.exp((1 - retriev) * W[10]) - 1) *
    hardPenalty *
    easyBonus;
  return clamp(stability * (1 + delta));
}

export function nextForgetStability(
  difficulty: number,
  stability: number,
  retriev: number,
): number {
  const longTerm =
    W[11] * difficulty ** -W[12] * ((stability + 1) ** W[13] - 1) * Math.exp((1 - retriev) * W[14]);
  const shortTerm = stability / Math.exp(W[17] * W[18]);
  return clamp(Math.min(longTerm, shortTerm));
}

export function nextInterval(stability: number): number {
  const interval = (stability / FACTOR) * (0.9 ** (1 / DECAY) - 1);
  return Math.max(1, Math.min(MAX_INTERVAL, Math.round(interval)));
}

export function rating(correct: boolean): number {
  return correct ? 3 : 1;
}
