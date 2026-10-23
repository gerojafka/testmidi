import { Clef, Difficulty, NoteInfo, NoteLang } from '../types';

export const SEMITONES = [0, 2, 4, 5, 7, 9, 11];

export const NOTE_NAMES: Record<NoteLang, string[]> = {
  fr: ["Do", "Ré", "Mi", "Fa", "Sol", "La", "Si"],
  en: ["C", "D", "E", "F", "G", "A", "B"]
};

export const CHROMATIC_NAMES: Record<NoteLang, string[]> = {
  fr: ["Do", "Do#", "Ré", "Ré#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"],
  en: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
};

export const BASE_POS: Record<Clef, number> = { treble: 2, bass: 4 };
export const BASE_OCTAVE: Record<Clef, number> = { treble: 4, bass: 2 };
export const KEYBOARD_START_OCTAVE: Record<Clef, number> = { treble: 4, bass: 2 };

export const DIFFICULTY_RANGES: Record<Clef, Record<Difficulty, [number, number]>> = {
  treble: {
    '0': [0, 8],     // Sur la portée (Mi3 -> Fa4)
    '1': [-2, 10],   // Lignes supplémentaires
    '2': [-2, 12],   // 2 Octaves
    '3': [0, 4],     // Partie inférieure
    '4': [4, 8]      // Partie supérieure
  },
  bass: {
    '0': [0, 8],     // Sur la portée
    '1': [-2, 10],   // Lignes supplémentaires
    '2': [-4, 10],   // 2 Octaves
    '3': [0, 4],     // Partie inférieure
    '4': [4, 8]      // Partie supérieure
  }
};

export function mod(n: number, size: number): number {
  return ((n % size) + size) % size;
}

export function getMidiForNote(nameIndex: number, octave: number): number {
  return 12 * (octave + 1) + SEMITONES[nameIndex];
}

export function getNoteInfoForPos(clef: Clef, pos: number): NoteInfo {
  const absolute = BASE_POS[clef] + pos;
  const nameIndex = mod(absolute, 7);
  const octave = BASE_OCTAVE[clef] + Math.floor(absolute / 7);
  const midi = getMidiForNote(nameIndex, octave);

  return {
    id: `${clef}-${pos}-${Math.random().toString(36).substring(2, 7)}`,
    pos,
    nameIndex,
    octave,
    midi,
    result: null
  };
}

export function pitchFromMidi(midi: number) {
  return {
    midi,
    pitchClass: mod(midi, 12),
    octave: Math.floor(midi / 12) - 1
  };
}

export function formatMidiName(midi: number, lang: NoteLang): string {
  const pitch = pitchFromMidi(midi);
  return `${CHROMATIC_NAMES[lang][pitch.pitchClass]}${pitch.octave}`;
}

export function formatOctaveAnchor(octave: number, lang: NoteLang): string {
  return `${lang === 'fr' ? 'Do' : 'C'}${octave}`;
}

export interface WhiteKeyInfo {
  nameIndex: number;
  octave: number;
  midi: number;
  label: string;
}

export interface BlackKeyInfo {
  midi: number;
  label: string;
  leftPercent: number;
}

export function getKeyboardLayout(clef: Clef, lang: NoteLang) {
  const startOctave = KEYBOARD_START_OCTAVE[clef];
  const whiteKeys: WhiteKeyInfo[] = [];

  // 15 white keys (approx 2 octaves + 1 note)
  for (let i = 0; i < 15; i++) {
    const nameIndex = i % 7;
    const octave = startOctave + Math.floor(i / 7);
    const midi = getMidiForNote(nameIndex, octave);
    whiteKeys.push({
      nameIndex,
      octave,
      midi,
      label: `${NOTE_NAMES[lang][nameIndex]}${octave}`
    });
  }

  const blackKeys: BlackKeyInfo[] = [];
  for (let i = 0; i < whiteKeys.length - 1; i++) {
    const current = whiteKeys[i];
    const next = whiteKeys[i + 1];
    if (next.midi - current.midi === 2) {
      const midi = current.midi + 1;
      const leftPercent = ((i + 1) / whiteKeys.length) * 100;
      blackKeys.push({
        midi,
        label: CHROMATIC_NAMES[lang][mod(midi, 12)],
        leftPercent
      });
    }
  }

  return { whiteKeys, blackKeys };
}
