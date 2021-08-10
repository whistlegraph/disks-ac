// 🧮 Update
export function update($api) {
  // TODO: Play a sound here!
}

// 🎨 Render
export function render($api) {
  const { color, clear, num } = $api;

  color(num.randInt(255), num.randInt(255), num.randInt(255));
  clear();
}

// 📚 Library
// ...