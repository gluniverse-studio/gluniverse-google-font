# GLUniverse — Google Fonts

![Foundry v14](https://img.shields.io/badge/Foundry-v14-informational)
![Latest release](https://img.shields.io/github/v/release/gluniverse-studio/gluniverse-google-font)
![Downloads](https://img.shields.io/github/downloads/gluniverse-studio/gluniverse-google-font/total)

Use any [Google Font](https://fonts.google.com) in Foundry VTT v14: in the interface, headings, canvas text, the text editor, drawings, and **Dice So Nice** dice.

## Installation

In Foundry, go to **Add-on Modules → Install Module**, paste this manifest URL into the **Manifest URL** field, and click **Install**:

```
https://github.com/gluniverse-studio/gluniverse-google-font/releases/latest/download/module.json
```

Foundry uses the same link to check for updates.

## Features

- **Interface font**: sidebar, windows, sheets, chat, and journals.
- **Heading font**: journal and sheet headings.
- **Canvas font**: token nameplates, scrolling text, and the default for new drawings.
- **Text editor and drawings**: every added font shows up in the text editor's font menu and in the drawing text font list.
- **Dice So Nice**: every added font shows up in Dice So Nice's font dropdown. You can also set a default dice font, used by any player whose dice font is set to *Auto*.
- **Force everywhere**: overrides fonts set by game systems and other modules too. Icons and code are left alone.
- **Preloaded character sets**: choose which Google subsets (for example `thai`) load up front, so canvas and dice text render correctly.
- **Per-device opt-out**: a player can keep Foundry's default interface fonts on their own device.

## Usage

1. Enable the module in your world.
2. Go to **Game Settings → Configure Settings → GLUniverse — Google Fonts → Manage Google Fonts** (GM only).
3. Type a family name exactly as it appears on fonts.google.com, for example `Cinzel`, or paste the font's page URL. Click **Add**.
4. Choose where each font is used, then click **Save and reload**.

To use a font on dice, either set **Dice So Nice font** in the manager, or have each player pick it in **Dice So Nice → Dice Presentation → Font**.

> Fonts are loaded from Google's servers, so every client needs internet access.

## Releasing (maintainers)

Releases are created by the **Release** GitHub Action:

1. Open **Actions → Release → Run workflow**.
2. Choose the version bump: `patch` (1.0.0 → 1.0.1), `minor` (1.0.0 → 1.1.0), or `major` (1.0.0 → 2.0.0). You can also add release notes.
3. The workflow:
   - updates `version`, `manifest`, and `download` in `module.json`
   - commits the change to `main` and tags it `vX.Y.Z`
   - publishes a GitHub release with `module.json` and `module.zip` attached

Or from the command line:

```bash
gh workflow run release.yml -f bump=patch
```

## License

MIT
