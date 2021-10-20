// TODO: Make the 0.5 / floor adjustments.
// TODO: Make a diskserv,
//  so that when disks are saved the system reloads them
//  automatically.

let cam, tri1, tri2;

export function boot({ Camera, Form, TRIANGLE }) {
  cam = new Camera(80);
  tri1 = new Form(TRIANGLE, [-0.5, 0, 4], [-spinA, spinB, spinA]);
  tri2 = new Form(TRIANGLE, [0.5, 0, 4], [-spinB, spinA, spinB]);
}

let spinA = 0,
  spinB = 0,
  sat = 0;

export function sim({ pen, screen }) {
  sat = Math.floor((pen.x / screen.width) * 255);
  spinB += 1;

  //cam.forward(0.0025);
}

export function paint({ color, clear, paintCount }) {
  tri1.angle(0, spinB, 0);
  tri2.angle(0, -spinB, 0);

  color(0, paintCount % 255, 0);
  clear();

  color(255 - sat, 0, 0);
  tri1.graph(cam);

  color(sat, sat, 0);
  //tri2.graph(cam);
}

export function beat({ sound: { bpm, square }, num: { randIntRange } }) {
  bpm(randIntRange(80, 120));

  square({
    tone: spinA % 180,
    beats: 1,
    attack: 0.01,
    decay: 0.9,
    volume: 1,
    pan: 0,
  });

  spinA += 15;
}
