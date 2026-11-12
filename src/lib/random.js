// The random numbers of the page: a run of numbers from 0 up to 1 that
// follows from its seed, so a reload draws what the last visit drew.

export function createRandom(seed) {
  let s = (Math.imul(seed + 1, 2654435761) >>> 0) || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

// The next number from `random`, moved to run from -width / 2 up to width / 2.
export const pickAroundZero = (random, width) => (random() - 0.5) * width;
