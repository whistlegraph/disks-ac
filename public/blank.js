// Blank, 2021.11.28.03.04

// 🥾 Boot (Runs once before first paint and sim)
function boot($api) {
  // TODO: Runs only once!
}

// 🧮 Simulate (Runs once per logic frame (120fps)).
function sim($api) {
  // TODO: Move a ball here!
}

// 🎨 Paint (Runs once per display refresh rate)
function paint({ wipe, num: { randInt: r } }) {
  wipe(r(255), r(255), r(255));
}

// ✒ Act (Runs once per user interaction)
function act({ event }) {
  // console.log(event);
}

// 💗 Beat (Runs once per bpm)
function beat($api) {
  // TODO: Play a sound here!
}

// 📚 Library (Useful functions used throughout the program)
// ...

export { boot, sim, paint, act, beat };
