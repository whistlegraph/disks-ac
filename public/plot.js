// Plot, 2021.12.05.13.27
// A tool for editing pixel-perfect vector art / glyphs, and icons.

// TODO
// -- Add anchor point to be used for the initial pan and also rotation.
// -- Add support for single click dots / points, in addition to straight lines.

// * Add hotkeys / alt etc. for drawing straight lines on one axis, tabbing and
//   clicking buttons, with global hotkeys for quitting and returning to the prompt.

// * Draw and store all the glyphs for a typable font.
//   -- Use this font as a reference: https://github.com/slavfox/Cozette/blob/master/img/characters.png

// *Remarks*
// This software is written in layers of APIs... what's the layer that comes
// out of a disk... could I write a scripting language / DSL layer on top here?
// 2021.12.14.13.08

const { min, floor } = Math;

let g; // Our virtual drawing guide.
let save; // A button to save drawings.
let open; // ..and to open them.
let opening = false; // Disables open button if in the process of uploading.

// For tracking and storing each line as its drawn.
let startMark = false;
let currentLine;
const points = [],
  lines = [];

let needsPaint = false; // Only render after a user interaction.
// TODO: Do I need the equivalent of noLoop and then calling repaint
// or needsPaint() ? 2021.12.11.01.12

// TODO: Can eventually be shifted around somehow with the javascript console or
// a mouse and then reprinted for pasting back in. 2021.12.10.23.02
const colors = {
  background: [0, 20, 0],
  grid: [0, 100, 0],
  gridOutline: [255, 255, 0, 32],
  lines: [0, 220, 220, 50],
  innerLine: [128, 128, 0, 200],
  inlinePreview: [128, 128, 0, 64],
  activeSquareInline: [255, 128],
  activeSquareCenter: [0, 255, 0],
  ghostSquare: [100, 50],
  save: [255, 0, 0, 80],
  open: [0, 0, 255, 80],
};

const plots = {}; // Stored preloaded drawings.

// 🥾 Boot (Runs once before first paint and sim)
function boot({
  resize,
  cursor,
  geo: { Grid },
  ui: { Button },
  net: { host, preload },
}) {
  resize(64, 64);
  cursor("tiny");
  g = new Grid(8, 5, 16, 16, 3);
  save = new Button(41, 64 - 8, 15, 6);
  open = new Button(8, 64 - 8, 15, 6);
  needsPaint = true;
  preload("drawings/default.json").then(decode); // Preload drawing.
  // Preload save button icon.
  preload("drawings/save_open_icon.json").then((r) => {
    plots.icon = r;
    needsPaint = true;
  });

  // TODO: Preload the open icon. 2021.12.12.22.48
}

// 🎨 Paint (Runs once per display refresh rate)
function paint({ pen, pan, unpan, grid, line, pixels, wipe, ink, paintCount }) {
  if (!needsPaint) return false;

  // A. Grid
  // Clear the background and draw a grid with an outline.
  wipe(colors.background)
    .ink(colors.grid)
    .grid(g)
    .ink(colors.gridOutline)
    .box(g.scaled, "outline");

  // Render all added lines by generating a bitmap and projecting it on a grid.
  if (lines.length > 0) {
    grid(
      g,
      pixels(g.box.w, g.box.h, () => {
        ink(colors.lines);
        lines.forEach((l) => line(...l));
      })
    );
  }

  // Outline the active square and highlight its center point.
  const sq = g.under(pen, (sq) => {
    ink(colors.activeSquareInline).box(sq, "inline");
    g.center.forEach((p) =>
      ink(colors.activeSquareCenter).plot(sq.x + p.x, sq.y + p.y)
    );
  });

  // Draw thin line for all previously added lines.
  pan(g.centerOffset);
  lines.forEach((l) => {
    ink(colors.innerLine).line(...g.get(l[0], l[1]), ...g.get(l[2], l[3]));
  });

  if (startMark) {
    // Inline preview between grid squares.
    ink(colors.inlinePreview)
      .line(points[0].x, points[0].y, sq.x, sq.y)
      .unpan();
    // Extended, virtual grid square if we are outside the grid.
    if (!sq.in) ink(colors.ghostSquare).box(sq, "inline");
  } else unpan();

  // B. Open Button
  ink(colors.open).box(open.box, open.down ? "inline" : "outline"); // Border
  ink(colors.open).draw(plots.icon, open.box.x + 13, open.box.y + 6, 3, 180); // Icon

  // C. Save Button
  ink(colors.save).box(save.box, save.down ? "inline" : "outline"); // Border
  ink(colors.save).draw(plots.icon, save.box.x + 1, save.box.y, 3); // Icon

  needsPaint = false;
}

// ✒ Act (Runs once per user interaction)
function act({ event: e, download, upload, num: { timestamp } }) {
  // Add first point if we touch in the grid.
  if (e.is("touch")) {
    g.under(e, (sq) => {
      points.push(sq);
      startMark = true;
    });
  }

  // if (e.is("draw")) {}

  // Add 2nd point to complete the line if we lifted up in a different square.
  if (e.is("lift") && startMark) {
    startMark = false;
    g.under(e, (sq) => {
      if (sq.gx === points[0].gx && sq.gy === points[0].gy) return;
      points.push(sq);

      lines.push([points[0].gx, points[0].gy, points[1].gx, points[1].gy]);
    });
    points.length = 0;
  }

  // Relay event info to the save button.
  save.act(e, () => download(encode(timestamp())));

  if (!opening) {
    open.act(e, () => {
      upload(".json")
        .then((data) => {
          decode(JSON.parse(data));
          opening = false;
        })
        .catch((err) => {
          console.error("JSON load error:", err);
        });
      opening = true;
    });
  }

  needsPaint = true;
}

// 📚 Library (Useful functions used throughout the program)

// Encode all drawing data (lines) into a single file format.
function encode(filename) {
  // Use JSON to build an AST. 2021.12.11.00.02
  filename += ".json";

  // Create a simple JSON format that is indented by 2 characters.
  const data = JSON.stringify(
    {
      resolution: [g.box.w, g.box.h],
      date: new Date().toISOString(),
      commands: lines.map((l, i) => ({
        name: "line",
        args: l,
      })),
    },
    null,
    2
  );

  return { filename, data };

  // *Future Plans*
  // TODO: Use a custom file format instead of JSON? 2021.12.11.19.02

  // What should the syntax or programmability of this format be?
  /* Maybe something like?

  16x16
  C 255 0 0
  L 1 2 11 11
  L 10 2 1 13
  */

  // Or I could use turtle graphics?

  // TODO: Save this somehow on the network? 2021.12.11.17.01
  // - To clipboard? (Get general cliboard access working.)
  // - Directly on-chain?
  // - On my own server via or Pinata / DO Spaces using web3.eth as auth?

  // Fetch example:
  // This would have to be modified to fit both production and development
  // environments. 2021.12.11.19.07
  /*
  (async () => {
    const rawResponse = await fetch("https://aesthetic.computer/post", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ a: 1, b: "Textual content" }),
    });
    const content = await rawResponse.json();

    console.log(content);
  })();
  */
}

// Read preparsed json data to step through the commands and fill in "lines".
function decode(drawing) {
  lines.length = 0; // Reset the drawing's line data.

  // Repopulate it with the loaded drawing.
  drawing.commands.forEach(({ name, args }) => {
    if (name === "line") lines.push(args);
  });
  needsPaint = true;
}

export { boot, paint, act };
