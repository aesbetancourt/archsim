/** The storage key of the font of the app. The choice is kept in this browser only. */
export const READING_FONT_KEY = "charrette:reading-font";
/** The font of the app: serif (Literata, the default) or sans (Geist). */
export type ReadingFont = "serif" | "sans";

/**
 * A script for the page. It sets the font on the html element before the first paint. If
 * storage is not available, the lesson text stays serif.
 */
export const readingFontScript = `try{if(localStorage.getItem(${JSON.stringify(READING_FONT_KEY)})==="sans")document.documentElement.dataset.reading="sans"}catch(e){}`;
