import { readFileSync } from 'node:fs'

function analyze({comb, mm_per_beat: speed, min_repeat_mm: gap, melody}) {
  if (!Array.isArray(comb) || !comb.length || !comb.every(n => typeof n === 'string' && n.trim()) ||
      new Set(comb).size !== comb.length || !Number.isFinite(speed) || speed <= 0 ||
      !Number.isFinite(gap) || gap <= 0 || !Array.isArray(melody))
    throw Error('Check the comb tracks, feed speed, repeat spacing and melody');
  const tracks = new Map(comb.map((note, i) => [note, i + 1]));
  const previous = new Map(), punches = [], skipped = [];
  let lastBeat = 0;
  for (const event of melody) {
    if (!Array.isArray(event) || event.length !== 2) throw Error('Expected a beat and pitch');
    const [beat, pitch] = event;
    const x = beat * speed;
    if (!Number.isFinite(beat) || !Number.isFinite(x) || beat < lastBeat || typeof pitch !== 'string' || !pitch.trim())
      throw Error('Supply valid events in chronological order');
    lastBeat = beat;
    if (!tracks.has(pitch)) skipped.push([beat, pitch, 'pitch unavailable']);
    else if (previous.has(pitch) && x - previous.get(pitch) < gap) skipped.push([beat, pitch, 'repeat too close']);
    else { punches.push([x, tracks.get(pitch), pitch]); previous.set(pitch, x); }
  }
  return {punches, skipped};
}

try {
  if (process.argv.length !== 3) throw new Error('Usage: node app.mjs input.json')
  console.log(JSON.stringify(analyze(JSON.parse(readFileSync(process.argv[2], 'utf8')))))
} catch (error) {
  console.error(error.message)
  process.exitCode = 2
}
