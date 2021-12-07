// Plot, 2021.12.05.13.27
// A tool for drawing pixel-perfect vector art with utilities for saving,
// loading and editing.

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
  wipe(10, 50, 25);

  // TODO: Make clickable grid.

  // Draw and outline the grid.
  ink(255, 0, 0).grid(g).ink(64, 128).box(g.scaled, "outline");

  const s = g.squareUnder(pen); // Get the square under the pen
  if (!s) return false; // or stop painting

  ink(255, 128).box(s, "inline"); // Lightly shade grid square

  // TODO: Turn this into a generic drawing function? 2021.12.06.21.27
  // - Call function dot() which draws a circle of a given size at the center
  //   of the box?

  const offset = g.squareCenter; // Draw center point of grid square
  if (offset > 0) ink(0, 255, 0).plot(s.x + offset, s.y + offset);
}

// ✒ Act (Runs once per user interaction)
function act({ event }) {
  // console.log(event);
}

// 📚 Library (Useful functions used throughout the program)
// ...

export { boot, paint, act };
