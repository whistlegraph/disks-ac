// TODO: Decrease the resolution on iOS devices?

let surfaceBuffer;

// 🥾 Boot
export function boot({ buffer, color, clear, box, noise16, frame, screen }) {
  frame(32, 33);
  // TODO: Encode turns on the bottom.

  surfaceBuffer = buffer(screen.width, screen.height, (w, h) => {
    // 1. Background
    color(32, 64, 32);
    clear();
    // noise16();

    // 2. Colored squares
    const centerX = w / 2;
    const centerY = h / 2;
    const boxW = w / 2;
    const boxH = boxW;
    const left = centerX - boxW / 2;
    const top = centerY - boxH / 2;
    const halfW = boxW / 2;
    const halfH = boxH / 2;

    color(255, 127, 0);
    box(left, top, halfW, halfH); // Top Left

    color(0, 127, 0);
    box(left + halfW, top, halfW, halfH); // Top Right

    color(255, 200, 200);
    box(left, top + halfH, halfW, halfH); // Bottom Left

    color(0, 72, 200);
    box(left + halfW, top + halfH, halfW, halfH); // Bottom Right
  });
}

let state = "rest";
let dragging = false;
let lastPenPos;
let dragStart, dragAmount, dragDelta;
let selection, selectionBuffer;

// 🧮 Simulate
export function sim({ pen, num: { boxNormal } }) {
  // Start drag.

  if (dragging === false && pen.down && pen.changed) {
    dragging = true;
    dragStart = { x: pen.x, y: pen.y };
    lastPenPos = { x: pen.x, y: pen.y };

    if (state === "rest") {
      state = "select";
    }

    console.log("Start drag:", dragStart, state);
    return;
  }

  // Continue drag.
  if (dragging === true && pen.down && pen.changed) {
    dragAmount = { x: pen.x - dragStart.x, y: pen.y - dragStart.y };

    if (state === "select") {
      selection = boxNormal(
        dragStart.x,
        dragStart.y,
        dragAmount.x,
        dragAmount.y
      );
    } else if (state === "move") {
      dragDelta = { x: pen.x - lastPenPos.x, y: pen.y - lastPenPos.y };
      lastPenPos = { x: pen.x, y: pen.y };
      selection.x += dragDelta.x;
      selection.y += dragDelta.y;
    }
  }

  // End drag.
  if (dragging === true && pen.down === false && pen.changed) {
    if (state === "select" && selection) {
      if (selection.w > 0 && selection.h > 0) {
        state = "move";
      } else {
        state = "rest";
      }
    } else if (state === "move") {
      state = "rest";
    }

    dragging = false;

    console.log("Stop drag.", state);
  }
}

// 🎨 Paint
export function paint({
  color,
  copy,
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
  if (!pen.changed && paintCount !== 0) return false; // Render one frame, and then only on pen change.

  // 1. Fill screen with surfaceBuffer.
  paste(surfaceBuffer);

  // 2. Selection box
  if (selection && (state === "select" || (state === "move" && !dragging))) {
    // Box
    // color(0, 255, 0);
    // box(dragStart.x, dragStart.y, dragW, dragH);

    // Border
    color(255, 0, 0, 128);

    if (state === "move") {
      color(200, 0, 0, 128);
    }

    // Top
    line(
      selection.x,
      selection.y - 1,
      selection.x + selection.w,
      selection.y - 1
    );
    // Bottom
    line(
      selection.x,
      selection.y + selection.h,
      selection.x + selection.w - 1,
      selection.y + selection.h
    );
    // Left
    line(
      selection.x - 1,
      selection.y - 1,
      selection.x - 1,
      selection.y + selection.h
    );
    // Right
    line(
      selection.x + selection.w,
      selection.y,
      selection.x + selection.w,
      selection.y + selection.h
    );
  }

  // 3. Create selection buffer if needed.
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
          copy(x, y, selection.x + x, selection.y + y, screen);
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
}

// 💗 Beat
export function beat($api) {
  // TODO: Play a sound here!
}

// 📚 Library
// ...
