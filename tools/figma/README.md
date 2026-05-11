# Figma Token Kit Script

`populate-design-token-kit.js` is a one-run Figma plugin script for the file:

<https://www.figma.com/design/tjyvpTenQbgimBJ5sr8oly/compodocx-Design-Token-Kit>

It populates the existing `Cover`, `Tokens`, and `Components` pages with a practical compodocx design-token kit.

## Run It

1. Open the Figma file.
2. In Figma desktop or browser, open `Plugins -> Development -> New Plugin...`.
3. Choose `Figma design` and `Run once` / `With UI & browser APIs` is not needed.
4. Create or select a local plugin folder outside the repo if Figma asks.
5. Replace the generated plugin `code.js` contents with `tools/figma/populate-design-token-kit.js`.
6. Run the plugin.

The script clears the three target pages before repopulating them.

## After Running

Use MCP to inspect the file again. The expected result is:

- `Cover / 1440` frame on `Cover`.
- `Tokens / compodocx variables` frame on `Tokens`.
- `Components / theme examples` frame on `Components`.

If Figma reports a missing font, install or enable Inter, or change the `textNode()` helper in the script to another available font.
