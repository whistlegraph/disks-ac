// 🥾 Boot
export function boot($api) {
  // TODO: Runs only once!
}

// 🧮 Simulate
export function sim($api) {
  // TODO: Move a ball here!
}

// 🎨 Paint
export function paint($api) {
  const { color, clear, num } = $api;

  color(num.randInt(255), num.randInt(255), num.randInt(255));
  clear();
}

// 💗 Beat
export function beat($api) {
  // TODO: Play a sound here!
}

// 📚 Library
// ...
