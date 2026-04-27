/**
 * Vitest/Vite SSR: named `import { z } from "zod"` can be undefined with zod 3.25+.
 * Import the real package by path so this file is not confused with the `zod` alias.
 */
import zodDefault from "../../node_modules/zod/index.js";

export const z = zodDefault;
export default zodDefault;
