// Plot, 2021.12.05.13.27
// A tool for drawing pixel-perfect vector art with utilities for saving,
// loading and editing.

// TODO: Make clickable grid.

// TODO: Draw and store all the glyphs for a printable font.
// -- Use this font as a reference: https://github.com/slavfox/Cozette/blob/master/img/characters.png
// * Add hotkeys / alt etc. for drawing straight lines.

const { min, floor } = Math;
let g;

// 🥾 Boot (Runs once before first paint and sim)
function boot({ resize, cursor, geo: { Grid } }) {
  resize(64, 64);
  cursor("tiny");
  g = new Grid(12, 12, 8, 8, 5);
}

// 🎨 Paint (Runs once per display refresh rate)
function paint({ pen, wipe, ink }) {
  // Clear the background and draw a grid with an outline.
  wipe(10, 50, 25).ink(255, 0, 0).grid(g).ink(64, 128).box(g.scaled, "outline");

  // Grab the grid square under the pen, continuing if it exists.
  const sq = g.under(pen);
  if (!sq) return false;

  // Outline the grid square under the pen, highlighting the center.
  ink(255, 128).box(sq, "inline");
  g.center.forEach((p) => ink(0, 255, 0).plot(sq.x + p.x, sq.y + p.y));
}

// ✒ Act (Runs once per user interaction)
function act({ event }) {
  // console.log(event);
}

// 📚 Library (Useful functions used throughout the program)
// ...

export { boot, paint, act };
