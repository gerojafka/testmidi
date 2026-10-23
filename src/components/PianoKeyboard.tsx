import React, { useState } from 'react';
import { Clef, NoteLang } from '../types';
import { getKeyboardLayout } from '../utils/musicTheory';

interface PianoKeyboardProps {
  clef: Clef;
  lang: NoteLang;
  onKeyPress: (midi: number) => void;
  activeMidiNote: number | null; // Currently evaluated answer note
  midiPressedNotes: Set<number>; // Real-time MIDI keys currently held down physically
  answerStatus: { midi: number; isGood: boolean } | null;
}

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  clef,
  lang,
  onKeyPress,
  midiPressedNotes,
  answerStatus
}) => {
  const { whiteKeys, blackKeys } = getKeyboardLayout(clef, lang);
  const [pressedMidi, setPressedMidi] = useState<number | null>(null);

  const handlePointerDown = (midi: number) => {
    setPressedMidi(midi);
    onKeyPress(midi);
  };

  const handlePointerUp = () => {
    setPressedMidi(null);
  };

  return (
    <div className="w-full select-none my-2">
      <div
        className="relative w-full h-[180px] sm:h-[220px] md:h-[260px] bg-slate-900 rounded-xl p-1 shadow-xl border border-slate-700/80 overflow-hidden"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${whiteKeys.length}, minmax(0, 1fr))`
        }}
      >
        {/* White Keys */}
        {whiteKeys.map((key) => {
          const isMidiHeld = midiPressedNotes.has(key.midi);
          const isClickPressed = pressedMidi === key.midi;
          const isGoodAnswer = answerStatus && answerStatus.midi === key.midi && answerStatus.isGood;
          const isBadAnswer = answerStatus && answerStatus.midi === key.midi && !answerStatus.isGood;

          let bgClass = 'bg-gradient-to-b from-white via-slate-50 to-slate-200 text-slate-800 hover:from-slate-50 hover:to-slate-300';
          if (isGoodAnswer) {
            bgClass = 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50';
          } else if (isBadAnswer) {
            bgClass = 'bg-red-500 text-white shadow-lg shadow-red-500/50';
          } else if (isMidiHeld) {
            bgClass = 'bg-purple-600 text-white shadow-lg shadow-purple-500/50 scale-[0.99]';
          } else if (isClickPressed) {
            bgClass = 'bg-sky-500 text-white scale-[0.99]';
          }

          return (
            <button
              key={`white-${key.midi}`}
              type="button"
              onPointerDown={() => handlePointerDown(key.midi)}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className={`relative z-10 h-full border-r border-slate-300 last:border-r-0 rounded-b-md transition-all duration-75 flex flex-col justify-end items-center pb-2.5 font-extrabold text-xs sm:text-sm active:translate-y-0.5 ${bgClass}`}
            >
              <span className="truncate max-w-full px-0.5 pointer-events-none">
                {key.label}
              </span>
            </button>
          );
        })}

        {/* Black Keys */}
        {blackKeys.map((key) => {
          const isMidiHeld = midiPressedNotes.has(key.midi);
          const isClickPressed = pressedMidi === key.midi;
          const isGoodAnswer = answerStatus && answerStatus.midi === key.midi && answerStatus.isGood;
          const isBadAnswer = answerStatus && answerStatus.midi === key.midi && !answerStatus.isGood;

          let bgClass = 'bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 text-slate-200 hover:from-slate-600 hover:to-slate-900 border-slate-900';
          if (isGoodAnswer) {
            bgClass = 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/50 border-emerald-700';
          } else if (isBadAnswer) {
            bgClass = 'bg-red-600 text-white shadow-lg shadow-red-500/50 border-red-700';
          } else if (isMidiHeld) {
            bgClass = 'bg-purple-600 text-white shadow-lg shadow-purple-500/50 border-purple-700 scale-[0.98]';
          } else if (isClickPressed) {
            bgClass = 'bg-sky-600 text-white border-sky-700 scale-[0.98]';
          }

          const widthPercent = (1 / whiteKeys.length) * 62;

          return (
            <button
              key={`black-${key.midi}`}
              type="button"
              onPointerDown={() => handlePointerDown(key.midi)}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              style={{
                left: `${key.leftPercent}%`,
                width: `${widthPercent}%`
              }}
              className={`absolute top-0 z-20 h-[58%] -translate-x-1/2 border rounded-b-md shadow-md transition-all duration-75 flex flex-col justify-end items-center pb-1.5 font-bold text-[10px] sm:text-xs active:translate-y-0.5 ${bgClass}`}
            >
              <span className="truncate max-w-full px-0.5 pointer-events-none">
                {key.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
