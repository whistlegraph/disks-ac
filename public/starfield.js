const numStars = 64;
const spread = 4;
const speed = 4;

let width, height;
let frameCount = 0;

const stars = {
  x: Array(numStars),
  y: Array(numStars),
  z: Array(numStars),
};

for (let i = 0; i < numStars; i += 1) {
  reset(i);
}

// 💗 Beat
export function beat($api) {
  const { num, help, sound } = $api;
}

// 🧮 Update
export function update($api) {
  const { screen, load } = $api;
  ({ width, height } = screen);

  frameCount += 1;
  if (frameCount === 300) {
    load("doodle"); // TODO: How to implement loading screens?
  }

  for (let i = 0; i < numStars; i += 1) {
    stars.z[i] -= 0.01 * speed;

    if (stars.z[i] <= 0) {
      reset(i);
    }

    const p = projection(i);
    const x = p[0];
    const y = p[1];

    if (x < 0 || x >= width || y < 0 || y >= height) {
      reset(i);
    }
  }
}

// 🎨 Render
export function render($api) {
  const { color, clear, num, plot } = $api;

  color(0, 0, 0);
  clear();

  for (let i = 0; i < numStars; i += 1) {
    color(num.randInt(255), num.randInt(255), num.randInt(255));
    plot(...projection(i));
  }
}

// 📚 Library

function reset(i) {
  stars.x[i] = 2 * (Math.random() - 0.5) * spread;
  stars.y[i] = 2 * (Math.random() - 0.5) * spread;
  stars.z[i] = (Math.random() + 0.00001) * spread;
}

function projection(i) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  return [
    Math.floor((stars.x[i] / stars.z[i]) * halfWidth + halfWidth),
    Math.floor((stars.y[i] / stars.z[i]) * halfHeight + halfHeight),
  ];
}
