/**
 * Loads only the Noto variant for the active locale so Next.js does not preload
 * every CJK font on every marketing page (reduces console noise and bytes).
 */
export async function resolveLocaleFontClasses(locale: string): Promise<string> {
  switch (locale) {
    case "ko":
      return (await import("./ko")).getLocaleFontClasses();
    case "zh-CN":
      return (await import("./zh-CN")).getLocaleFontClasses();
    case "zh-TW":
      return (await import("./zh-TW")).getLocaleFontClasses();
    case "ja":
      return (await import("./ja")).getLocaleFontClasses();
    default:
      return "font-sans";
  }
}
