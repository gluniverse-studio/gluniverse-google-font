import { GOOGLE_CSS_URL, MODULE_ID } from "./const.js";

/**
 * Variant requests tried in order. Google returns HTTP 400 when a family lacks a
 * requested weight/style, so fall back to progressively simpler requests.
 */
const VARIANTS = [
  ":ital,wght@0,400;0,700;1,400;1,700",
  ":wght@400;700",
  ""
];

const cssCache = new Map();

/**
 * Accept a plain family name or a pasted fonts.google.com URL and return the family name.
 * @param {string} input
 * @returns {string}
 */
export function normalizeFamily(input) {
  let value = String(input ?? "").trim();
  const specimen = value.match(/fonts\.google\.com\/specimen\/([^/?#]+)/i);
  const family = value.match(/[?&]family=([^:&]+)/i);
  if ( specimen ) value = specimen[1];
  else if ( family ) value = family[1];
  value = decodeURIComponent(value.replace(/\+/g, " "));
  return value.replace(/["']/g, "").replace(/\s+/g, " ").trim();
}

function familyParam(family) {
  return encodeURIComponent(family).replace(/%20/g, "+");
}

/**
 * Build a simple stylesheet URL for a family (used for lazy previews).
 * @param {string} family
 * @returns {string}
 */
export function previewUrl(family) {
  return `${GOOGLE_CSS_URL}?family=${familyParam(family)}&display=swap`;
}

/**
 * Fetch the Google Fonts stylesheet for a family.
 * @param {string} family
 * @returns {Promise<string>} The CSS text.
 * @throws If the family does not exist or Google Fonts is unreachable.
 */
export async function fetchFontCss(family) {
  if ( cssCache.has(family) ) return cssCache.get(family);
  let lastError;
  for ( const variant of VARIANTS ) {
    const url = `${GOOGLE_CSS_URL}?family=${familyParam(family)}${variant}&display=swap`;
    try {
      const response = await fetch(url);
      if ( !response.ok ) {
        lastError = new Error(`HTTP ${response.status}`);
        continue;
      }
      const css = await response.text();
      cssCache.set(family, css);
      return css;
    }
    catch(err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error("Unknown error");
}

/**
 * Parse @font-face blocks from a Google Fonts stylesheet.
 * Google prefixes each block with a subset comment such as "/* latin *\/".
 * @param {string} css
 * @returns {{subset: string, style: string, weight: string, urls: string[], unicodeRange?: string}[]}
 */
export function parseFontFaces(css) {
  const faces = [];
  const regex = /(?:\/\*\s*([^*]*?)\s*\*\/\s*)?@font-face\s*\{([^}]*)\}/g;
  for ( const [, subset, body] of css.matchAll(regex) ) {
    const prop = name => body.match(new RegExp(`${name}\\s*:\\s*([^;]+);`))?.[1]?.trim();
    const urls = [...(prop("src") ?? "").matchAll(/url\(([^)]+)\)/g)].map(m => m[1].replace(/["']/g, ""));
    if ( !urls.length ) continue;
    const face = {
      subset: (subset ?? "").toLowerCase(),
      style: prop("font-style") ?? "normal",
      weight: prop("font-weight") ?? "400",
      urls
    };
    const range = prop("unicode-range");
    if ( range ) face.unicodeRange = range;
    faces.push(face);
  }
  return faces;
}

/**
 * Fetch every family, inject its stylesheet for the DOM, and register it in
 * CONFIG.fontDefinitions so Foundry preloads it for the canvas, the text editor,
 * drawings, and Dice So Nice.
 * @param {string[]} families
 * @param {string[]} subsets  Subsets Foundry should eagerly load (e.g. ["latin", "thai"]).
 * @returns {Promise<string[]>} Families that registered successfully.
 */
export async function registerGoogleFonts(families, subsets) {
  const results = await Promise.all(families.map(async family => {
    try {
      const css = await fetchFontCss(family);
      injectStyle(`${MODULE_ID}-css-${family}`, css);

      const faces = parseFontFaces(css);
      let eager = faces.filter(f => subsets.includes(f.subset));
      // Families without a matching subset (e.g. CJK sliced fonts) fall back to everything.
      if ( !eager.length ) eager = faces;
      CONFIG.fontDefinitions[family] = {
        editor: true,
        fonts: eager.map(({ subset, ...descriptors }) => descriptors)
      };
      return family;
    }
    catch(err) {
      console.warn(`${MODULE_ID} | Could not load Google Font "${family}":`, err);
      return null;
    }
  }));
  return results.filter(Boolean);
}

/**
 * Create or replace a <style> element in the document head.
 * @param {string} id
 * @param {string} css
 */
export function injectStyle(id, css) {
  const safeId = id.replace(/[^\w-]/g, "_");
  let el = document.getElementById(safeId);
  if ( !el ) {
    el = document.createElement("style");
    el.id = safeId;
    document.head.append(el);
  }
  el.textContent = css;
}

/**
 * Ensure a lazy preview stylesheet for a family is present.
 * @param {string} family
 */
export function ensurePreview(family) {
  const id = `${MODULE_ID}-preview-${family}`.replace(/[^\w-]/g, "_");
  if ( document.getElementById(id) || CONFIG.fontDefinitions[family] ) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = previewUrl(family);
  document.head.append(link);
}
