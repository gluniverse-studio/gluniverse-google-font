import { MODULE_ID, SETTINGS } from "./const.js";
import { ensurePreview, fetchFontCss, normalizeFamily } from "./google-fonts.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * GM window for choosing Google Fonts and assigning them to parts of Foundry.
 */
export default class FontManager extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options) {
    super(options);
    this.#families = [...(game.settings.get(MODULE_ID, SETTINGS.FAMILIES) ?? [])];
  }

  /** Working copy of the font list, saved on submit. */
  #families;

  static DEFAULT_OPTIONS = {
    id: "gluniverse-google-font-manager",
    tag: "form",
    classes: ["glgf-manager"],
    window: {
      title: "GLGF.Manager.Title",
      icon: "fa-solid fa-font",
      contentClasses: ["standard-form"]
    },
    position: { width: 560 },
    form: {
      handler: FontManager.#onSubmit,
      closeOnSubmit: true
    },
    actions: {
      addFont: FontManager.#onAddFont,
      removeFont: FontManager.#onRemoveFont
    }
  };

  static PARTS = {
    body: { template: `modules/${MODULE_ID}/templates/font-manager.hbs`, scrollable: [""] },
    footer: { template: "templates/generic/form-footer.hbs" }
  };

  /** @override */
  async _prepareContext(options) {
    const get = key => game.settings.get(MODULE_ID, key);
    for ( const family of this.#families ) ensurePreview(family);
    const choices = Object.fromEntries(this.#families.map(f => [f, f]));
    const role = (key, label, hint) => ({ key, label, hint, value: get(key), choices });
    return {
      families: this.#families,
      roles: [
        role(SETTINGS.UI_FONT, "GLGF.Roles.Ui", "GLGF.Roles.UiHint"),
        role(SETTINGS.HEADING_FONT, "GLGF.Roles.Heading", "GLGF.Roles.HeadingHint"),
        role(SETTINGS.CANVAS_FONT, "GLGF.Roles.Canvas", "GLGF.Roles.CanvasHint"),
        role(SETTINGS.DICE_FONT, "GLGF.Roles.Dice", "GLGF.Roles.DiceHint")
      ],
      forceAll: get(SETTINGS.FORCE_ALL),
      subsets: get(SETTINGS.SUBSETS),
      diceSoNice: game.modules.get("dice-so-nice")?.active ?? false,
      buttons: [{ type: "submit", icon: "fa-solid fa-floppy-disk", label: "GLGF.Manager.Save" }]
    };
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    const input = this.element.querySelector("input[name='newFamily']");
    input?.addEventListener("keydown", event => {
      if ( event.key !== "Enter" ) return;
      event.preventDefault();
      FontManager.#onAddFont.call(this, event, input);
    });
  }

  static async #onAddFont(event, target) {
    const input = this.element.querySelector("input[name='newFamily']");
    const family = normalizeFamily(input.value);
    if ( !family ) return;
    if ( this.#families.some(f => f.toLowerCase() === family.toLowerCase()) ) {
      ui.notifications.warn(game.i18n.format("GLGF.Notify.Duplicate", { family }));
      return;
    }
    input.disabled = true;
    try {
      await fetchFontCss(family);
    }
    catch(err) {
      ui.notifications.error(game.i18n.format("GLGF.Notify.NotFound", { family }));
      input.disabled = false;
      input.focus();
      return;
    }
    this.#families.push(family);
    await this.render();
    this.element.querySelector("input[name='newFamily']")?.focus();
  }

  static async #onRemoveFont(event, target) {
    const family = target.closest("[data-family]")?.dataset.family;
    this.#families = this.#families.filter(f => f !== family);
    await this.render();
  }

  static async #onSubmit(event, form, formData) {
    const data = formData.object;
    const families = this.#families;
    const pick = value => (families.includes(value) ? value : "");
    const updates = {
      [SETTINGS.FAMILIES]: families,
      [SETTINGS.UI_FONT]: pick(data[SETTINGS.UI_FONT]),
      [SETTINGS.HEADING_FONT]: pick(data[SETTINGS.HEADING_FONT]),
      [SETTINGS.CANVAS_FONT]: pick(data[SETTINGS.CANVAS_FONT]),
      [SETTINGS.DICE_FONT]: pick(data[SETTINGS.DICE_FONT]),
      [SETTINGS.FORCE_ALL]: !!data[SETTINGS.FORCE_ALL],
      [SETTINGS.SUBSETS]: String(data[SETTINGS.SUBSETS] ?? "").trim() || "latin"
    };
    let changed = false;
    for ( const [key, value] of Object.entries(updates) ) {
      const current = game.settings.get(MODULE_ID, key);
      if ( foundry.utils.objectsEqual({ v: current }, { v: value }) ) continue;
      await game.settings.set(MODULE_ID, key, value);
      changed = true;
    }
    if ( changed ) foundry.applications.settings.SettingsConfig.reloadConfirm({ world: true });
  }
}
