import * as z from "zod"; // https://zod.dev/basics

// TODO: When the arctracker-ui directory is normalized to use "ko-KR" as the locale
// key for Korean, we can rename this to LocalizedText and remove the other private schemas.
const LocalizedTextCanonical = z
  .object({
    // Match the locales defined by:
    //  https://github.com/RaidTheory/arcraiders-data/tree/main/arctracker-ui
    da: z.string(),
    de: z.string(),
    en: z.string(),
    es: z.string(),
    fr: z.string(),
    he: z.string(),
    hr: z.string(),
    it: z.string(),
    ja: z.string(),
    "ko-KR": z.string(),
    no: z.string(),
    pl: z.string(),
    "pt-BR": z.string(),
    pt: z.string(),
    ru: z.string(),
    sr: z.string(),
    tr: z.string(),
    uk: z.string(),
    "zh-CN": z.string(),
    "zh-TW": z.string()
  })
  .describe("LocalizedTextCanonical");

const LocalizedTextRaw = LocalizedTextCanonical.extend({
  ko: z.string().optional(),
  "ko-KR": z.string().optional(),
  kr: z.string().optional()
}).describe("LocalizedTextRaw");

export const LocalizedText = LocalizedTextRaw.transform((data) => {
  const { ko, ["ko-KR"]: _koKR, kr, ...rest } = data;

  return {
    ...rest,
    "ko-KR": _koKR ?? ko ?? kr
  };
})
  .pipe(LocalizedTextCanonical.strict())
  .describe("LocalizedText");

// Private data exported for testing purposes only. Not intended for public use.
export const __internal__ = {
  LocalizedTextCanonical,
  LocalizedTextRaw
};
