import { MODULE_ID } from "./const.js";
import { injectStyle, registerGoogleFonts } from "./google-fonts.js";
import { getConfig, registerSettings } from "./settings.js";

/** Longest we hold up Foundry's own font preload while Google responds. */
const FETCH_TIMEOUT = 8000;

/** Selectors that must keep their icon fonts when "force everywhere" is on. */
const ICON_SELECTORS = [
  "i", ".fa", ".fas", ".far", ".fab", ".fal", ".fad", ".fa-solid", ".fa-regular", ".fa-light",
  ".fa-thin", ".fa-brands", ".fa-duotone", ".fa-sharp", "[class^='fa-']", "[class*=' fa-']",
  ".material-icons", ".material-symbols-outlined", "code", "pre", "kbd", "samp"
].join(", ");

const quote = family => `"${family.replace(/"/g, "")}"`;

Hooks.once("init", () => {
  registerSettings();
  const config = getConfig();
  if ( !config.families.length ) return;

  const loaded = registerGoogleFonts(config.families, config.subsets);
  patchFontLoader(loaded);

  if ( !config.disableUi ) applyInterfaceFonts(config);
  if ( config.canvasFont ) {
    CONFIG.defaultFontFamily = config.canvasFont;
    CONFIG.canvasTextStyle.fontFamily = config.canvasFont;
  }
});

/**
 * Foundry preloads CONFIG.fontDefinitions before drawing the canvas, but init hooks are
 * not awaited. Make that preload wait for our Google requests first (bounded by a timeout).
 * @param {Promise<string[]>} loaded
 */
function patchFontLoader(loaded) {
  const FontConfig = foundry.applications.settings.menus.FontConfig;
  const original = FontConfig._loadFonts;
  const timeout = new Promise(resolve => setTimeout(resolve, FETCH_TIMEOUT));
  const ready = Promise.race([loaded, timeout]);
  FontConfig._loadFonts = async function(...args) {
    await ready;
    return original.apply(this, args);
  };
}

/**
 * Point Foundry's core CSS font variables (and optionally every element) at the chosen fonts.
 * @param {ReturnType<typeof getConfig>} config
 */
function applyInterfaceFonts({ uiFont, headingFont, forceAll }) {
  const rules = [];
  if ( uiFont ) {
    const stack = `${quote(uiFont)}, "Signika", sans-serif`;
    rules.push(`:root {
      --glgf-ui-font: ${stack};
      --font-primary: ${stack};
      --font-sans: ${stack};
      --font-body: ${stack};
      --font-blockquote: ${stack};
    }`);
    if ( forceAll ) {
      rules.push(`body, body *:not(${ICON_SELECTORS}) { font-family: var(--glgf-ui-font) !important; }`);
    }
  }
  if ( headingFont ) {
    const stack = `${quote(headingFont)}, serif`;
    rules.push(`:root {
      --glgf-heading-font: ${stack};
      --font-h1: ${stack};
      --font-h2: ${stack};
      --font-serif: ${stack};
    }`);
    if ( forceAll ) {
      rules.push(`body :is(h1, h2, h3, h4, h5, h6):not(${ICON_SELECTORS}),
        body :is(h1, h2, h3, h4, h5, h6) *:not(${ICON_SELECTORS}) {
        font-family: var(--glgf-heading-font) !important;
      }`);
    }
  }
  if ( rules.length ) injectStyle(`${MODULE_ID}-apply`, rules.join("\n"));
}

/**
 * Dice So Nice resolves an "auto" font from the die preset first, so setting the preset
 * font makes our font the default for every player who hasn't picked one explicitly.
 * Fonts are also listed in Dice So Nice's own font dropdown, since they are editor fonts.
 */
Hooks.once("diceSoNiceReady", dice3d => {
  const { diceFont } = getConfig();
  if ( !diceFont || !CONFIG.fontDefinitions[diceFont] ) return;
  try {
    for ( const system of dice3d.DiceFactory.systems.values() ) {
      for ( const preset of system.dice?.values() ?? [] ) {
        if ( !preset.font ) preset.font = diceFont;
      }
    }
  }
  catch(err) {
    console.warn(`${MODULE_ID} | Could not apply dice font to Dice So Nice:`, err);
  }
});
