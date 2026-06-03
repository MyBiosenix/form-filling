export const toStr = (v) => (v === null || v === undefined ? "" : String(v));

export const normalizeSpaces = (s) => toStr(s).replace(/\s+/g, " ").trim();
export const removePunctuation = (s) => toStr(s).replace(/[^\w\s]|_/g, "");
export const lower = (s) => toStr(s).toLowerCase();

export const levenshtein = (a, b) => {
  a = toStr(a);
  b = toStr(b);
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
};

export const compareCell = (excelVal, userVal) => {
  const A = normalizeSpaces(excelVal);
  const B = normalizeSpaces(userVal);

  if (!A && !B) return { match: true, type: "empty" };
  if (A === B) return { match: true, type: "exact" };

  if (lower(A) === lower(B)) return { match: false, type: "case" };

  const Ap = normalizeSpaces(removePunctuation(A));
  const Bp = normalizeSpaces(removePunctuation(B));
  if (lower(Ap) === lower(Bp)) return { match: false, type: "punctuation" };

  const wordsA = lower(Ap).split(" ").filter(Boolean);
  const wordsB = lower(Bp).split(" ").filter(Boolean);
  const setA = new Set(wordsA);
  const setB = new Set(wordsB);

  let missing = 0;
  let extra = 0;
  for (const w of setA) if (!setB.has(w)) missing++;
  for (const w of setB) if (!setA.has(w)) extra++;

  if (missing > 0 || extra > 0) {
    return { match: false, type: "missing/extra", missing, extra };
  }

  const dist = levenshtein(lower(A), lower(B));
  const maxLen = Math.max(lower(A).length, lower(B).length);
  const ratio = maxLen === 0 ? 0 : dist / maxLen;

  if (ratio <= 0.25) return { match: false, type: "spelling", dist };

  return { match: false, type: "mismatch" };
};