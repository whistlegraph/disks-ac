// 💗 Beat
export function beat($api) {
  // TODO: Play a sound here!
}

// 🧮 Update
export function update($api) {
  // TODO: Move a  ball here!
}

// 🎨 Render
export function render($api) {
  const { color, clear, num } = $api;

  color(num.randInt(255), num.randInt(255), num.randInt(255));
  clear();
}

// 📚 Library
// ...
