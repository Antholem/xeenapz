export const GEMINI_MODELS =
  process.env.NEXT_PUBLIC_MODELS?.split(",") || ["gemini-1.5-flash"];

export const GEMINI_MODEL =
  process.env.NEXT_PUBLIC_GEMINI_MODEL || GEMINI_MODELS[0];

