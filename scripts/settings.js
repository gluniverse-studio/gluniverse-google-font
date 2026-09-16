import { MODULE_ID, SETTINGS } from "./const.js";
import FontManager from "./font-manager.js";

const { ArrayField, StringField, BooleanField } = foundry.data.fields;

export function registerSettings() {
  game.settings.registerMenu(MODULE_ID, SETTINGS.MENU, {
    name: "GLGF.Menu.Name",
    label: "GLGF.Menu.Label",
    hint: "GLGF.Menu.Hint",
    icon: "fa-solid fa-font",
    type: FontManager,
    restricted: true
  });

  const hidden = { scope: "world", config: false };
  game.settings.register(MODULE_ID, SETTINGS.FAMILIES, {
    ...hidden, type: new ArrayField(new StringField({ blank: false })), default: []
  });
  game.settings.register(MODULE_ID, SETTINGS.SUBSETS, {
    ...hidden, type: new StringField(), default: "latin, latin-ext"
  });
  for ( const key of [SETTINGS.UI_FONT, SETTINGS.HEADING_FONT, SETTINGS.CANVAS_FONT, SETTINGS.DICE_FONT] ) {
    game.settings.register(MODULE_ID, key, { ...hidden, type: new StringField(), default: "" });
  }
  game.settings.register(MODULE_ID, SETTINGS.FORCE_ALL, {
    ...hidden, type: new BooleanField(), default: false
  });

  game.settings.register(MODULE_ID, SETTINGS.DISABLE_UI, {
    name: "GLGF.DisableUi.Name",
    hint: "GLGF.DisableUi.Hint",
    scope: "client",
    config: true,
    type: new BooleanField(),
    default: false,
    requiresReload: true
  });
}

/** Read the full configuration. */
export function getConfig() {
  const get = key => game.settings.get(MODULE_ID, key);
  return {
    families: get(SETTINGS.FAMILIES) ?? [],
    subsets: String(get(SETTINGS.SUBSETS) ?? "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean),
    subsetsRaw: get(SETTINGS.SUBSETS),
    uiFont: get(SETTINGS.UI_FONT),
    headingFont: get(SETTINGS.HEADING_FONT),
    canvasFont: get(SETTINGS.CANVAS_FONT),
    diceFont: get(SETTINGS.DICE_FONT),
    forceAll: get(SETTINGS.FORCE_ALL),
    disableUi: get(SETTINGS.DISABLE_UI)
  };
}
