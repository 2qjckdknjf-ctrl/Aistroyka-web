/**
 * Shared raw Tailwind color class detector for check:design.
 * Matches utilities at string start, after whitespace, after variant prefixes,
 * directed borders (border-l/r/t/b/x/y), and opacity suffixes (/20).
 * Avoids false positives inside longer identifiers.
 */

const COLOR =
  "slate|red|amber|emerald|gray|zinc|neutral|stone|orange|yellow|lime|green|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const UTILITY = `text|bg|border(?:-[trblxy])?|ring|from|to|via|divide|placeholder`;

/** Global regex; reset lastIndex before each use. */
export const RAW_COLOR_CLASS_RE = new RegExp(
  `(?:^|[^a-zA-Z0-9_-])(?:[a-z0-9@][\\w@./-]*:)*(?:${UTILITY})-((?:${COLOR})-[0-9]+(?:/[0-9]+)?)(?![a-zA-Z0-9_-])`,
  "g"
);

/**
 * @param {string} content
 * @returns {string[]} unique color tokens e.g. "red-500", "amber-500/20"
 */
export function findRawColorClasses(content) {
  RAW_COLOR_CLASS_RE.lastIndex = 0;
  const found = [];
  let m;
  while ((m = RAW_COLOR_CLASS_RE.exec(content)) !== null) {
    found.push(m[1]);
  }
  return [...new Set(found)];
}

/**
 * Regression cases for the scanner (positive + negative).
 * @returns {{ ok: boolean, failures: string[] }}
 */
export function runRawColorPatternSelfTest() {
  const failures = [];

  /** @type {Array<{ name: string; input: string; expect: string[] }>} */
  const cases = [
    { name: "string-start bg", input: '"bg-red-500"', expect: ["red-500"] },
    { name: "string-start text", input: '"text-green-600"', expect: ["green-600"] },
    {
      name: "directed border-l",
      input: '"border-l-4 border-l-amber-500"',
      expect: ["amber-500"],
    },
    {
      name: "ring with opacity",
      input: '"ring-1 ring-amber-500/20"',
      expect: ["amber-500/20"],
    },
    {
      name: "allowed semantic token",
      input: '"bg-aistroyka-warning ring-aistroyka-warning/20"',
      expect: [],
    },
    {
      name: "after whitespace",
      input: " className={done ? \" text-red-500\" : \"\"}",
      expect: ["red-500"],
    },
    {
      name: "variant prefix",
      input: '"hover:bg-red-500 sm:text-blue-600"',
      expect: ["red-500", "blue-600"],
    },
    {
      name: "directed border-x/y",
      input: '"border-x-red-500 border-y-emerald-600"',
      expect: ["red-500", "emerald-600"],
    },
    {
      name: "no false positive in identifier",
      input: "const mybg-red-500 = 1; const foobg_red_500 = 2;",
      expect: [],
    },
    {
      name: "plain prose without utility",
      input: "The red-500 paint code is not a Tailwind utility alone.",
      expect: [],
    },
  ];

  for (const c of cases) {
    const got = findRawColorClasses(c.input).sort();
    const want = [...c.expect].sort();
    if (JSON.stringify(got) !== JSON.stringify(want)) {
      failures.push(`${c.name}: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
    }
  }

  return { ok: failures.length === 0, failures };
}
