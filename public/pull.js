// TODO: Decrease the resolution on iOS devices?
// TODO: Prevent multiple touch from registering.

let surfaceBuffer;

// 🥾 Boot
export function boot({ buffer, color, clear, box, noise16, screen }) {
  surfaceBuffer = buffer(screen.width, screen.height, (w, h) => {
    // 1. Background
    color(0, 0, 0);
    clear();
    // noise16();

    // 2. White square
    color(255, 200, 200);
    const centerX = w / 2;
    const centerY = h / 2;
    const boxW = 72;
    const boxH = boxW;
    const left = centerX - boxW / 2;
    const top = centerY - boxH / 2;
    const halfW = boxW / 2;
    const halfH = boxH / 2;

    box(left, top, boxW, boxH);

    // Yellow on top left.
    color(255, 127, 0);
    box(left, top, halfW, halfH);

    // Green on top right.
    color(0, 127, 0);
    box(left + halfW, top, halfW, halfH);

    // Blue on bottom right.
    color(0, 72, 200);
    box(left + halfW, top + halfH, halfW, halfH);
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
    if (state === "select") {
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
  clear,
  line,
  box,
  buffer,
  screen,
  setBuffer,
}) {
  // 1. Fill screen with surfaceBuffer.
  for (let x = 0; x < surfaceBuffer.width; x += 1) {
    for (let y = 0; y < surfaceBuffer.height; y += 1) {
      copy(x, y, x, y, surfaceBuffer);
    }
  }

  // 2. Selection box
  if (state === "select" || state === "move") {
    // Box
    // color(0, 255, 0);
    // box(dragStart.x, dragStart.y, dragW, dragH);

    // Border
    color(200, 0, 0);

    if (state === "move") {
      color(255, 0, 0);
    }

    // Top
    line(
      selection.x - 1,
      selection.y - 1,
      selection.x + selection.w,
      selection.y - 1
    );
    // Bottom
    line(
      selection.x,
      selection.y + selection.h,
      selection.x + selection.w,
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
    for (let x = 0; x < selectionBuffer.width; x += 1) {
      for (let y = 0; y < selectionBuffer.height; y += 1) {
        copy(selection.x + x, selection.y + y, x, y, selectionBuffer);
      }
    }
  }

  // 5. Paste selection buffer.
  if (state === "rest" && selectionBuffer) {
    // Switch to surfaceBuffer.
    setBuffer(surfaceBuffer);

    // Copy selectionBuffer to surfaceBuffer.
    for (let x = 0; x < selectionBuffer.width; x += 1) {
      for (let y = 0; y < selectionBuffer.height; y += 1) {
        copy(selection.x + x, selection.y + y, x, y, selectionBuffer);
      }
    }
    selectionBuffer = undefined;

    // Switch back to screen buffer.
    setBuffer(screen);

    // Repaint screen with surfaceBuffer.
    for (let x = 0; x < surfaceBuffer.width; x += 1) {
      for (let y = 0; y < surfaceBuffer.height; y += 1) {
        copy(x, y, x, y, surfaceBuffer);
      }
    }
  }
}

// 💗 Beat
export function beat($api) {
  // TODO: Play a sound here!
}

// 📚 Library
// ...
