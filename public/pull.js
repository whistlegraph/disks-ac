// TODO: Refactor current code.
// TODO: Fix Firefox: https://bugzilla.mozilla.org/show_bug.cgi?id=1247687
// TODO: Encode turns on the bottom.
// TODO: Store and play back turns / run backwards and forwards through them?
// TODO: Add modes for playback / preload.

let surfaceBuffer;
let turnBuffer;
let state = "rest";
let dragging = false;
let lastPenPos;
let dragStart;
let selection, selectionBuffer;
let boxBlink = true;
let turn,
  turns = [];
let plottedTurns = 0;

// 🥾 Boot
export function boot({
  buffer,
  color,
  clear,
  box,
  noise16,
  frame,
  screen,
  pen,
  cursor,
}) {
  cursor("tiny"); // Set the mouse cursor drawing.
  frame(64, 65);

  surfaceBuffer = buffer(screen.width, screen.height - 1, (w, h) => {
    // 1. Background
    color(40, 40, 40);
    clear();

    // 2. Colored squares
    const centerX = Math.ceil(w / 2);
    const centerY = Math.ceil(h / 2);
    const boxW = Math.ceil(w / 2);
    const boxH = boxW;
    const left = centerX - boxW / 2;
    const top = centerY - boxH / 2;

    color(190, 190, 190);
    box(left, top, boxW, boxH);
  });

  turnBuffer = buffer(screen.width, 1, () => {
    color(0, 0, 0);
    clear();
  });
}

// 🧮 Simulate
export function sim({
  pen,
  screen: { width, height },
  num: { boxNormal, clamp },
  cursor,
}) {
  // Start drag.
  if (dragging === false && pen.down && pen.changed) {
    dragging = true;
    dragStart = { x: pen.x, y: pen.y };
    lastPenPos = { x: pen.x, y: pen.y };

    if (state === "rest") {
      state = "select";
    }

    // console.log("Start drag:", dragStart, state);
  }

  // Continue drag.
  if (dragging === true && pen.down && pen.changed) {
    const dragAmount = { x: pen.x - dragStart.x, y: pen.y - dragStart.y };
    const dragDelta = { x: pen.x - lastPenPos.x, y: pen.y - lastPenPos.y };

    if (state === "select") {
      selection = boxNormal(
        dragStart.x,
        dragStart.y,
        dragAmount.x,
        dragAmount.y
      );

      const w = surfaceBuffer.width;
      const h = surfaceBuffer.height;

      // Crop left side.
      if (selection.x < 0) {
        selection.w += selection.x;
        selection.x = 0;
      }

      // Crop right side.
      if (selection.x + selection.w > w) {
        selection.w = w - selection.x;
      }

      // Crop top side.
      if (selection.y < 0) {
        selection.h += selection.y;
        selection.y = 0;
      }

      // Crop bottom side.
      if (selection.y + selection.h > h) {
        selection.h = h - selection.y;
      }

      turn = [selection.x, selection.y, selection.w, selection.h];

      cursor("none");
    } else if (state === "move") {
      lastPenPos = { x: pen.x, y: pen.y };
      selection.x += dragDelta.x;
      selection.y += dragDelta.y;
      cursor("none");
    }
  }

  // End drag.
  if (dragging === true && pen.down === false && pen.changed) {
    if (state === "select" && selection) {
      if (selection.w > 0 && selection.h > 0) {
        // TODO: Make selection box.

        state = "move";
      } else {
        state = "rest";
      }
    } else if (state === "move") {
      // Get finished turn data.
      turn.push(selection.x, selection.y);

      // Only add turn if we actually moved.
      if (turn[0] !== turn[4] || turn[1] !== turn[5]) {
        // And the destination is inside of the screen.
        const dx = turn[4];
        const dy = turn[5];
        const dw = turn[2];
        const dh = turn[3];

        const sx = 0;
        const sy = 0;
        const sw = width;
        const sh = height - 1;

        if ((dx + dw <= 0 || dx >= sw || dy + dh <= 0 || dy >= sh) === false) {
          // And we have enough pixels.
          if (turns.length < turnBuffer.width / 2) {
            turns.push(turn); // x, y, w, h, endx, endy
          } else {
            console.log("Turn buffer is full!");
          }
        }
      }

      state = "rest";
    }

    dragging = false;
    cursor("tiny");

    // console.log("Stop drag.", state);
  }
}

// 🎨 Paint
export function paint({
  color,
  copy,
  plot,
  paste,
  clear,
  line,
  box,
  buffer,
  screen,
  setBuffer,
  pen,
  paintCount,
}) {
  // 1. Caching
  // Always render the first frame, and then only on pen change,
  // or if actively dragging a selection.
  const boxIsBlinking = state === "move" && dragging;
  if (paintCount !== 0 && pen.changed === false && boxIsBlinking === false) {
    return false;
  }

  // 2. Background (surfaceBuffer)
  paste(surfaceBuffer);

  // 2. Selection box
  if (selection && (state === "select" || state === "move")) {
    if (state === "select") color(255, 0, 0, 128);
    else if (state === "move") color(200, 0, 0, 128);

    if (state === "move" && dragging) {
      if (paintCount % 60 === 0) boxBlink = !boxBlink;
      color(200, 0, 0, boxBlink ? 64 : 0);
    }

    box(selection.x, selection.y, selection.w, selection.h, "outline");
  }

  // 3. Create selection buffer if needed.
  // TODO: This should move to another function or be created in sim.
  if (
    state === "move" &&
    !selectionBuffer &&
    selection.w > 0 &&
    selection.h > 0
  ) {
    selectionBuffer = buffer(selection.w, selection.h, (w, h) => {
      // Copy the screen rectangle into our selection buffer.
      for (let x = 0; x < w; x += 1) {
        for (let y = 0; y < h; y += 1) {
          copy(x, y, selection.x + x, selection.y + y, surfaceBuffer);
        }
      }
    });
    console.log("Captured selection:", selectionBuffer);
  }

  // 4. Move selection buffer.
  if (state === "move" && selectionBuffer) {
    // Fill rectangular bitmap of selection.
    paste(selectionBuffer, selection.x, selection.y);
  }

  // 5. Paste selection buffer.
  if (state === "rest" && selectionBuffer) {
    // Switch to surfaceBuffer.
    setBuffer(surfaceBuffer);
    paste(selectionBuffer, selection.x, selection.y);
    // Copy selectionBuffer to surfaceBuffer.
    selectionBuffer = undefined;
    selection = undefined;

    // Switch back to screen buffer.
    setBuffer(screen);

    // Repaint screen with surfaceBuffer.
    paste(surfaceBuffer);
  }

  // 6. Draw every turn, and plot the last if needed.
  if (plottedTurns < turns.length) {
    setBuffer(turnBuffer);
    const turnToPlot = turns[plottedTurns];

    color(turnToPlot[0], turnToPlot[1], turnToPlot[2]);
    plot(plottedTurns * 2, 0);

    // 4 and 5 are ending coordinates and can be signed, so we will add 127 to them
    // and when reading back, treat 127 as 0. This should work for a resolution
    // of up to 128?
    color(turnToPlot[3], turnToPlot[4] + 127, turnToPlot[5] + 127);
    plot(plottedTurns * 2 + 1, 0);

    setBuffer(screen);

    plottedTurns += 1;
  }

  paste(turnBuffer, 0, screen.height - 1);
}

// 💗 Beat
export function beat($api) {
  // TODO: Play a sound here!
}

// 📚 Library
// ...
