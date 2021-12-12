// Plot, 2021.12.05.13.27
// A tool for editing pixel-perfect vector art.

// TODO
// * Draw and store all the glyphs for a printable font.

// *Current* Add a clickable save "checkmark" button and move the grid up.

// -- Wire up checkmark button to save the JSON to a server or copy it to clipboard.

// -- Add support for dots in addition to lines.

// Make the necessary symbols for encoding works in the Animated Notation piece.

// -- Use this font as a reference: https://github.com/slavfox/Cozette/blob/master/img/characters.png

// * Add hotkeys / alt etc. for drawing straight lines.

// NOTES
// This software is written in layers of APIs... what's the layer that comes
// out of a disk... could I write a scripting language / DSL layer on top here?

const { min, floor } = Math;

let g; // Our virtual drawing guide.
let save; // A button to save our drawing.

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
  background: [0, 10, 0],
  grid: [0, 100, 0],
  gridOutline: [255, 255, 0, 32],
  lines: [0, 220, 220, 50],
  innerLine: [128, 128, 0, 200],
  inlinePreview: [128, 128, 0, 64],
  activeSquareInline: [255, 128],
  activeSquareCenter: [0, 255, 0],
  ghostSquare: [100, 50],
};

// 🥾 Boot (Runs once before first paint and sim)
function boot({ resize, cursor, geo: { Grid }, ui: { Button } }) {
  resize(64, 64);
  cursor("tiny");
  g = new Grid(8, 5, 16, 16, 3);
  save = new Button(41, 64 - 8, 16, 6);
  needsPaint = true;
}

// 🎨 Paint (Runs once per display refresh rate)
function paint({ pen, pan, unpan, grid, line, pixels, wipe, ink }) {
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
        lines.forEach((l) => line(l[0].gx, l[0].gy, l[1].gx, l[1].gy));
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
  lines.forEach((l) =>
    ink(colors.innerLine).line(l[0].x, l[0].y, l[1].x, l[1].y)
  );

  if (startMark) {
    // Inline preview between grid squares.
    ink(colors.inlinePreview)
      .line(points[0].x, points[0].y, sq.x, sq.y)
      .unpan();
    // Extended, virtual grid square if we are outside the grid.
    if (!sq.in) ink(colors.ghostSquare).box(sq, "inline");
  } else unpan();

  // B. Save Button
  if (save.down) {
    ink(255, 0, 0, 20).box(save.box, "inline");
  } else {
    ink(255, 0, 0, 20).box(save.box, "outline");
  }

  needsPaint = false;
}

// ✒ Act (Runs once per user interaction)
function act({ event: e, download }) {
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
      lines.push(points.slice());
    });
    points.length = 0;
  }

  // Relay event info to the save button.
  save.act(e, () => {
    download(encodeDrawing());
  });

  needsPaint = true;
}

// 📚 Library (Useful functions used throughout the program)

function encodeDrawing() {
  // Sanitize lines for exporting into a file format.
  // What should the syntax or programmability of this format be?

  /* Maybe something like?
  16x16
  C 255 0 0
  L 1 2 11 11
  L 10 2 1 13
  */

  // Or I could use turtle graphics?

  // For now I'll just use JSON to build an AST. 2021.12.11.00.02
  const out = {
    resolution: [g.box.w, g.box.h],
    commands: [],
  };

  lines.forEach((l, i) => {
    out.commands.push({
      name: "line",
      args: [l[0].gx, l[0].gy, l[1].gx, l[1].gy],
    });
  });

  // TODO: Add date/timecode to drawing.json or generate a unique code?

  return { filename: "drawing.json", data: JSON.stringify(out) };

  // TODO: Save this somehow on the network (use web3 auth)? 2021.12.11.17.01
  // - To clipboard?
  // - To blockchain?

  /*
  (async () => {
    const rawResponse = await fetch("https://httpbin.org/post", {
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

export { boot, paint, act };
