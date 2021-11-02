let surfaceBuffer;

// 🥾 Boot
export function boot({ buffer, color, clear, box, noise16, screen }) {
  surfaceBuffer = buffer(screen.width, screen.height, (w, h) => {
    // 1. Background
    color(0, 0, 0);
    clear();
    // noise16();

    // 2. White square
    color(255, 255, 255);
    const centerX = w / 2;
    const centerY = h / 2;
    const boxW = 64;
    const boxH = boxW;
    box(centerX - boxW / 2, centerY - boxH / 2, boxW, boxH);
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

    console.log("Dragging:", dragAmount, state);
  }

  // End drag.
  if (dragging === true && pen.down === false && pen.changed) {
    if (state === "select") {
      state = "move";
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
  if (
    (state === "select" || state === "move") &&
    selection.w > 0 &&
    selection.h > 0
  ) {
    // Box
    color(0, 255, 0);
    // box(dragStart.x, dragStart.y, dragW, dragH);

    // Border
    color(255, 0, 0);
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
