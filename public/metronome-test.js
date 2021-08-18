let flash = false;
let flashFrames = 0;
const flashColor = [255, 0, 0];
const flashDuration = 2;

// TODO: Add and import "note" helper to Square.
// TODO: Add "attack" and "velocity" and "pan" to Square.
// TODO: Add volume to trigger from this file.
// TODO: Add a sampler so that arbitrary sounds can be loaded and played back with sound.play("name", pitch).for(3, sound.beats)
// TODO: Clean up audio code & api.
// See also: https://www.notion.so/whistlegraph/Get-a-basic-sound-working-and-playing-notes-in-a-sequence-fb0020def4b84c69805b497b31981b9c
// TODO: Move on to graphics.
// TODO: Make an "index" disk that gets booted before any remote disks. (Can just be a timed intro for now.)

const notes = {
  // C-Major scale
  c4: 261.63,
  d4: 293.66,
  e4: 329.63,
  f4: 349.23,
  g4: 392.0,
  a4: 440.0,
  b4: 493.88,
  c5: 523.25,
};

const melody = "cccdecdefg";
let melodyIndex = 0;

// 💗 Beat
export function beat($api) {
  const { num, help, sound } = $api;

  console.log("🎼 BPM:", sound.bpm[0], "Seconds passed:", sound.time);

  if (help.choose(true, false)) {
    sound.bpm[0] = help.choose(90, 120, 180, 240, 400); // TODO: Why can't the BPM be changed?
  }

  sound.square(
    //notes[melody[melodyIndex] + "4"],
    notes[help.choose("c4", "d4", "e4", "f4", "g4", "a4", "b4", "c5")],
    help.choose(1, 1 / 2, 1 / 4, 1 / 8)
  );

  melodyIndex = (melodyIndex + 1) % melody.length;

  // TODO: Should this state be calculated in update?
  flash = true;
  flashColor[0] = num.randInt(255);
  flashColor[1] = num.randInt(255);
  flashColor[2] = num.randInt(255);
}

// 🧮 Crunch
export function update($api) {
  // TODO: Play a sound here!
  //console.log($api)
}

// 🎨 Paint
export function render($api) {
  const { color, clear, num } = $api;

  if (flash) {
    color(...flashColor);

    flashFrames += 1;
    if (flashFrames > flashDuration) {
      flash = false;
      flashFrames = 0;
    }
  } else {
    color(0, 0, 255);
  }

  clear();
}

// 📚 Library
// ...
