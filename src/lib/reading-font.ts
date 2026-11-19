// The font of the lesson text: serif (EB Garamond, the default) or sans (Geist).
// The choice is kept in this browser only.
export const READING_FONT_KEY = "charrette:reading-font";
export type ReadingFont = "serif" | "sans";

// Set the choice on the html element before the first paint. If storage is not available, the
// lesson text stays serif.
export const readingFontScript = `try{if(localStorage.getItem(${JSON.stringify(READING_FONT_KEY)})==="sans")document.documentElement.dataset.reading="sans"}catch(e){}`;
