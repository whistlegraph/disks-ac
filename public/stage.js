// TODO: Make number of notes, colors, and tones programmable.
// TODO: Add more sounds.

// Graphics
const blocks = {};
let cam, arrow;

const camZ = 10;

const noteX = {
  A: -6,
  B: -4,
  C: -2,
  D: 0,
  E: 2,
  F: 4,
  G: 6,
};

const blocksY = {
  A: 0,
  B: 0,
  C: 0,
  D: 0,
  E: 0,
  F: 0,
  G: 0,
};

const blocksColors = {
  A: [255, 0, 0],
  B: [255, 127, 0],
  C: [255, 255, 0],
  D: [0, 200, 0],
  E: [0, 0, 255],
  F: [155, 0, 255],
  G: [255, 0, 127],
};

let arrowTrack;
let arrowSpin = 0;

let needsFlash = false;
let flashColor;
let flashFrames = 0;
let flashDuration = 3;

let indicatorBlink = 0;
let indicatorBlinkRate = 16;

// let freezeFrame = false;

// Music
let BPM = 80;

let loopSong = false;

let countDownLength = 4;

let melody = `
GECFDBECAB_C
EEEEDCDCBBAC
EEAEEAG_FE_E
FDBECAGDBC__
GGCGGCBCBA_C
EEEEDCD_FGGC
GGCG_FE_EFCA
DCBC_C___A_C
B_AD_CB_CEEE
EDCDCBBACEEA
EEAG_FE_EFDB
ECABCBA_____
`.replace(/\s/g, "");

const scale = {
  A: "a2",
  B: "b2",
  C: "c3",
  D: "d3",
  E: "e3",
  F: "f3",
  G: "g3",
};

let notes;
let melodyBeatsTotal;
let melodyBeatsPlayed = 0;

let noteIndex = -countDownLength;
let instrument;
let instrumentProgress;
let playingLetter;

export function boot({
  query,
  Camera,
  Form,
  buffer,
  SQUARE,
  TRIANGLE,
  clear,
  color,
  screen,
  help: { each },
}) {
  // Load some initial parameters.

  // Change from default BPM
  let params = new URLSearchParams(query);
  BPM = params.get("bpm") || BPM;

  // Change from default melody
  melody = params.get("melody") || melody;
  melody = melody.replace(/\s/g, "");
  notes = parseMelody(melody);
  melodyBeatsTotal = melody.length;

  // Change whether we loop or not.
  if (params.get("loop") === "true") {
    loopSong = true;
  }

  cam = new Camera(80);

  const aspectRatio = screen.width / screen.height;

  if (aspectRatio < 1.1) {
    cam.z = 14 / aspectRatio;
  } else if (aspectRatio < 1.5) {
    cam.z = 12;
  } else {
    cam.z = camZ; // TODO: Currently hardcoded to 16x9 aspect ratio.
  }

  for (const l of "ABCDEFG") // Add each colored block.
    blocks[l] = new Form(
      SQUARE,
      {
        texture: buffer(32, 32, () => {
          color(...blocksColors[l]);
          clear();
        }),
      },
      [noteX[l], 0, 4]
    );

  // Zero alpha for every block.
  each(blocks, (b) => (b.alpha = 0));

  // Add indicator arrow.
  arrow = new Form(
    TRIANGLE,
    {
      texture: buffer(32, 32, () => {
        color(127, 127, 127);
        clear();
      }),
    },
    [noteX[notes[0].letter], 3, 4],
    [0, 0, 180],
    [0.75, 0.75, 1]
  );
}

export function sim({
  pen,
  screen,
  num: { lerp },
  sound: { time },
  help: { each },
}) {
  //arrowSpin += 3;
  //arrow.rotation[1] = arrowSpin;

  if (!instrument) return; // Make sure our main instrument is playing.

  const p = instrument.progress(time); // Progress of current note.
  instrumentProgress = p;

  // Animate all blocks back to resting position based on p.
  each(blocks, (block, letter) => {
    block.position[1] = lerp(blocksY[letter], 0, p);
  });

  // Animate arrow to next position, if one exists.
  arrowTrack?.step(p * 3);
}

export function paint({
  color,
  clear,
  screen: { width, height },
  num: { lerp },
  help: { each },
  line,
  box,
}) {
  // if (freezeFrame === true) return false;
  const songFinished =
    melodyBeatsPlayed === melodyBeatsTotal && instrumentProgress === 1;

  // 1. Background
  if (needsFlash) {
    const r = lerp(flashColor[0], 72, 0.85);
    const g = lerp(flashColor[1], 72, 0.85);
    const b = lerp(flashColor[2], 72, 0.85);
    color(r, g, b);

    flashFrames = (flashFrames + 1) % flashDuration;
    if (flashFrames === 0) {
      needsFlash = false;
    }
  } else {
    if (songFinished && noteIndex > notes.length) {
      color(32, 32, 32); // Dark backdrop once the song ends.
    } else {
      color(64, 64, 64); // Grey backdrop as usual.
    }
  }
  clear(); // Paint background.

  // 2. Blocks & Arrow
  each(blocks, (block) => block.graph(cam)); // Paint every block.

  if (noteIndex >= 0 && songFinished === false) arrow.graph(cam); // Paint arrow.

  // 3. Timeline
  const playHeight = Math.max(3, height * 0.02);
  const playY = height - playHeight;
  const notesHeight = Math.max(3, height * 0.06);
  const notesY = playY - notesHeight;
  const indicatorHeight = Math.max(1, height * 0.005);

  // Draw black line in the background.
  color(0, 0, 0);
  box(0, playY, width, playHeight);

  // 4. Draw play progress.
  if (instrumentProgress >= 0 && songFinished === false) {
    const filteredProgress = Math.min(1, instrumentProgress * 1.0);
    const boxWidth = filteredProgress * width;

    // Draw progress line.
    //color(...blocksColors[playingLetter]);
    color(127, 127, 127);
    box(0, playY, boxWidth, playHeight);
  }

  // Draw a line with every color of every block.
  const beatUnit = width / melodyBeatsTotal;
  let startX = 0;

  notes.forEach((note, index) => {
    const plays = note.plays;

    let playCount = 1;

    plays.forEach((play) => {
      let currentDuration = 0;

      while (currentDuration < play.duration) {
        // Draw full colored blocks adjusting for each duration.
        const shift = blocksColors[note.letter].map((n) =>
          lerp(64, n, 1 - currentDuration / play.duration)
        );

        // color(...shift);
        // TODO: Re-enable this once the bugs are fixed.
        color(...blocksColors[note.letter]);
        box(startX + beatUnit * currentDuration, notesY, beatUnit, notesHeight);

        currentDuration += 1;
      }

      const w = beatUnit * play.duration;

      // Draw darker boxes.
      if (plays.length > 1) {
        const dark = blocksColors[note.letter].map((n) => lerp(0, n, 0.5));
        color(...dark);
        const playProgress = playCount / plays.length;
        box(startX, notesY, w, (1 - playProgress) * notesHeight);
      }

      playCount += 1;

      startX += w;
    });
  });

  let songProgress = (melodyBeatsPlayed - 1) * beatUnit;

  // Draw song progress, offset by 1 to match the play progress.
  if (noteIndex >= 0 && songFinished === false) {
    // Light indicator.
    if (indicatorBlink < indicatorBlinkRate / 2) {
      color(0, 0, 0);
    } else {
      color(255, 255, 255);
    }

    indicatorBlink = (indicatorBlink + 1) % indicatorBlinkRate;
    box(songProgress, notesY, beatUnit - 1, Math.ceil(indicatorHeight));

    // Dark covering box.
    // color(32, 32, 32);
    // box(songProgress + 1, notesY, width - (songProgress + 1), notesHeight);
  }

  // freezeFrame = true;
}

let playIndex = 0;
let playDurationProgress = 0;

// 2. Music
export function beat({
  help: { every, each },
  sound: { bpm, square },
  num: { lerp, randIntRange, Track },
  graph: { buffer, color, clear, line },
}) {
  bpm(BPM);

  // A. Introductory Countdown
  // TODO: I can use a negative noteIndex for this... and ditch countDown.

  if (noteIndex < 0) {
    square({
      tone: 10,
      beats: 0.05,
      attack: 0.1,
      decay: 0.1,
      volume: 2.0,
      pan: 0,
    });
    cam.forward(2);

    noteIndex += 1;

    // Lerp alpha for every block.
    each(
      blocks,
      (b) => (b.alpha = lerp(0, 1, 1 - Math.abs(noteIndex) / countDownLength))
    );

    return;
  }

  // B. Melody
  if (noteIndex < notes.length) {
    // Within the current note.
    const letter = notes[noteIndex].letter;
    const plays = notes[noteIndex].plays;
    const play = plays[playIndex];
    playingLetter = letter;

    // If we are looping, then reset melodyBeatsPlayed.
    if (noteIndex === 0 && playIndex === 0 && playDurationProgress === 0) {
      melodyBeatsPlayed = 0;
    }

    // Within the current play.
    if (playIndex < plays.length) {
      if (playDurationProgress === 0) {
        // Play a note.
        instrument = square({
          tone: scale[letter],
          beats: play.duration,
          attack: 0.01,
          decay: 0.9,
          volume: 1,
          pan: 0,
        });
        // console.log("Playing:", letter, "Duration:", plays[playIndex]);

        // Reset all blocks.
        every(blocksY, 0);

        // Jump the playing block.
        blocksY[letter] = 1;
        needsFlash = true;

        // Trigger a screen flash.
        flashColor = blocks[letter].texture.pixels.slice(0, 2);

        // Fill block up with colored lines if it is repeating.
        if (plays.length > 1) {
          blocks[letter].texture = buffer(32, 32, (w, h) => {
            const dark = blocksColors[letter].map((n) => lerp(0, n, 0.5));
            color(...dark);
            clear();
            color(...blocksColors[letter]);
            const height = Math.floor(
              lerp(0, 32, (playIndex + 1) / plays.length)
            );

            for (let y = 0; y < height; y += 1) {
              line(0, y, w, y);
            }
          });
        }

        const finalPlay = playIndex === plays.length - 1;

        if (finalPlay) {
          // Start moving the arrow to the next note if this is the final play
          // of a note.
          const nextNote = notes[noteIndex + 1];
          const nextLetter = nextNote?.letter;
          const nextPlays = nextNote?.plays;
          if (nextLetter) {
            arrowTrack = new Track(
              arrow.position[0],
              blocks[nextLetter].position[0],
              (x) => (arrow.position[0] = x)
            );

            // Fill block up with a darkened version of its color.
            if (nextPlays.length > 1) {
              blocks[nextLetter].texture = buffer(32, 32, () => {
                const dark = blocksColors[nextLetter].map((n) =>
                  lerp(0, n, 0.5)
                );
                color(...dark);
                clear();
              });
            }
          } else {
            // Stop moving arrow if the last note in the melody.
            arrowTrack = undefined;
          }
        } else {
          // Stop moving arrow if we are playing the same note
          // more than once.
          arrowTrack = undefined;
        }
      }

      if (playDurationProgress < play.duration) {
        playDurationProgress += 1;
      }

      if (playDurationProgress === play.duration) {
        playDurationProgress = 0;
        playIndex += 1;
      }
    }

    // Advance to the next note.
    if (playIndex === plays.length) {
      playIndex = 0;
      noteIndex += 1;
    }

    melodyBeatsPlayed += 1;
  }

  // C: Metronome clicks up till the end of the last note.
  if (noteIndex < notes.length + 1) {
    square({
      tone: 10,
      beats: 0.05,
      attack: 0.1,
      decay: 0.1,
      volume: 2.0,
      pan: 0,
    });
  }

  if (noteIndex === notes.length && loopSong) {
    noteIndex = 0;

    each(blocks, (b) => (b.alpha = 1));

    arrowTrack = new Track(
      arrow.position[0],
      noteX[notes[0].letter],
      (x) => (arrow.position[0] = x)
    );

    return;
  }

  // D: Ending
  if (noteIndex === notes.length) {
    noteIndex += 1;
    return;
  }

  // E: Final Sound
  if (noteIndex === notes.length + 1) {
    square({
      tone: 20,
      beats: 0.1,
      attack: 0.01,
      decay: 0.01,
      volume: 1.5,
      pan: 0,
    });
    each(blocks, (b) => (b.alpha = 0));
    noteIndex += 1;

    return;
  }
}

// ⚙️ Utilities
// Parses and builds an array of character sequences with underscores
// marking duration. Leading underscores are ignored!
function parseMelody(notes) {
  const parsedSequence = [];

  let i = 0;
  let play = { duration: 1 };
  let plays = [play];
  let lastLetter;

  while (i < notes.length) {
    const char = notes[i];
    const letter = char !== "_" ? char : undefined;

    if (letter === undefined) {
      play.duration += 1;
    } else if (letter === lastLetter) {
      // If a note repeats then add another play.
      play = { duration: 1 };
      plays.push(play);
    } else {
      if (lastLetter) {
        // Build the note data for the previous letter.
        parsedSequence.push({ letter: lastLetter, plays });
      }

      play = { duration: 1 };
      plays = [play];

      lastLetter = letter;
    }

    i += 1;
  }

  // Build the note data for the last letter of the sequence.
  parsedSequence.push({ letter: lastLetter, plays });

  return parsedSequence;
}
