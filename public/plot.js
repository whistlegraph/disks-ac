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
  wipe(5, 20, 5).ink(255).grid(g).ink(255, 255, 0, 32).box(g.scaled, "outline");

  // Grab the real or imaginary grid square related to the pen.
  const sq = g.under(pen);
  if (sq.in) {
    // Outline the grid square under the pen, highlighting the center.
    ink(255, 128).box(sq, "inline");
    g.center.forEach((p) => ink(0, 255, 0).plot(sq.x + p.x, sq.y + p.y));
  }

  if (startMark) {
    // TODO: Fill in grid squares using a texture / buffer that matches the grid
    // and then render the grid using the buffer with `grid(g, image)`.

    // Draw thin line between grid squares.
    const o = g.centerOffset;
    ink(255).line(points[0].x + o, points[0].y + o, sq.x + o, sq.y + o);

    // TODO: Implement pan and unpan in graph.js 2021.12.09.21.09
    //ink(255).pan(g.centerOffset).line(points[0].x, points[0].y, sq.x, sq.y).unpan();
  }
}

const points = [];
const lines = [];
let currentLine;
let startMark = false;

// ✒ Act (Runs once per user interaction)
function act({ event: e }) {
  // TODO: Detect a click.
  // console.log(event);

  // TODO: Add points to a set.
  // -- Save them?

  // Add first point if we touch in the grid.
  if (e.is("touch")) {
    const sq = g.under(e);
    if (sq.in) {
      points.push(sq);
      startMark = true;
    }
  }

  if (e.is("draw")) {
  }

  // Add second point if we lift in the grid.
  if (e.is("lift")) {
    if (startMark) {
      startMark = false;

      const sq = g.under(e);
      if (sq.in) {
        points.push(sq);

        // Only add a line if we are not in the starting point?
        lines.push(points);
      }

      points.length = 0;
    }
    console.log(lines);
  }
}

// 📚 Library (Useful functions used throughout the program)
// ...
export { boot, paint, act };
