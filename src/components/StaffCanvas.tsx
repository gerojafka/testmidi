import React from 'react';
import { Clef, NoteInfo, NoteLang } from '../types';
import { formatOctaveAnchor, KEYBOARD_START_OCTAVE, BASE_OCTAVE, BASE_POS } from '../utils/musicTheory';
import { Volume2 } from 'lucide-react';

interface StaffCanvasProps {
  clef: Clef;
  lang: NoteLang;
  notes: NoteInfo[];
  currentIndex: number;
  isLocked: boolean;
  onReplayNote: (note: NoteInfo) => void;
}

export const StaffCanvas: React.FC<StaffCanvasProps> = ({
  clef,
  lang,
  notes,
  currentIndex,
  isLocked,
  onReplayNote
}) => {
  const SVG_W = 1000;
  const SVG_H = 220;
  const LINE_GAP = 16;
  const STEP = LINE_GAP / 2;
  const BOTTOM_Y = 148;
  const LINE_X0 = 85;
  const LINE_X1 = 945;
  const NOTE_X0 = 220;
  const NOTE_GAP = 68;
  const NOTE_RX = 10.5;
  const NOTE_RY = 7.5;

  const clefSymbol = clef === 'treble' ? '𝄞' : '𝄢';
  const clefY = clef === 'treble' ? BOTTOM_Y - 2 * STEP + 32 : BOTTOM_Y - 6 * STEP + 22;
  const clefFontSize = clef === 'treble' ? 106 : 94;

  // Render ledger lines above or below staff
  const renderLedgers = (pos: number, x: number, color: string) => {
    const lines = [];
    if (pos < 0) {
      for (let p = -2; p >= pos; p -= 2) {
        const y = BOTTOM_Y - p * STEP;
        lines.push(
          <line
            key={`ledger-${p}`}
            x1={x - 22}
            y1={y}
            x2={x + 22}
            y2={y}
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        );
      }
    } else if (pos > 8) {
      for (let p = 10; p <= pos; p += 2) {
        const y = BOTTOM_Y - p * STEP;
        lines.push(
          <line
            key={`ledger-${p}`}
            x1={x - 22}
            y1={y}
            x2={x + 22}
            y2={y}
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        );
      }
    }
    return lines;
  };

  // Octave reference marks on the left side
  const startOctave = KEYBOARD_START_OCTAVE[clef];
  const octaveAnchors = [startOctave, startOctave + 1, startOctave + 2].map((octave) => {
    const pos = (octave - BASE_OCTAVE[clef]) * 7 - BASE_POS[clef];
    const y = BOTTOM_Y - pos * STEP;
    const label = formatOctaveAnchor(octave, lang);
    return { octave, pos, y, label };
  });

  return (
    <div className="bg-slate-50/80 rounded-2xl border border-slate-200/90 p-2 sm:p-4 shadow-inner relative overflow-hidden">
      <div className="w-full relative">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full h-auto block select-none"
          role="img"
          aria-label="Portée musicale"
        >
          {/* Background */}
          <rect x={0} y={0} width={SVG_W} height={SVG_H} fill="#f8fafc" rx={12} />

          {/* 5 Main Staff Lines */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = BOTTOM_Y - i * LINE_GAP;
            return (
              <line
                key={`line-${i}`}
                x1={LINE_X0}
                y1={y}
                x2={LINE_X1}
                y2={y}
                stroke="#1e293b"
                strokeWidth={1.8}
                strokeLinecap="round"
              />
            );
          })}

          {/* End Bar Line */}
          <line
            x1={LINE_X1}
            y1={BOTTOM_Y}
            x2={LINE_X1}
            y2={BOTTOM_Y - 4 * LINE_GAP}
            stroke="#1e293b"
            strokeWidth={2}
          />

          {/* Clef Symbol */}
          <text
            x={100}
            y={clefY}
            fontFamily="'Bravura', 'Noto Music', 'Segoe UI Symbol', 'Apple Symbols', serif"
            fontSize={clefFontSize}
            fill="#0f172a"
          >
            {clefSymbol}
          </text>

          {/* Octave Anchors on Left */}
          {octaveAnchors.map((anchor) => (
            <g key={`anchor-${anchor.octave}`}>
              <line
                x1={50}
                y1={anchor.y}
                x2={LINE_X0 - 10}
                y2={anchor.y}
                stroke="#0284c7"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                opacity={0.65}
              />
              <text
                x={42}
                y={anchor.y + 4}
                textAnchor="end"
                fontSize={13}
                fontWeight="800"
                fill="#0369a1"
                fontFamily="system-ui, sans-serif"
              >
                {anchor.label}
              </text>
            </g>
          ))}

          {/* Notes */}
          {notes.map((note, index) => {
            const x = NOTE_X0 + index * NOTE_GAP;
            const y = BOTTOM_Y - note.pos * STEP;
            const isCurrent = index === currentIndex && !isLocked && currentIndex < notes.length;
            const isFuture = index > currentIndex && !note.result;

            let color = isFuture ? '#94a3b8' : '#0f172a';
            if (note.result === 'good') color = '#16a34a';
            if (note.result === 'bad') color = '#dc2626';
            if (isCurrent) color = '#0284c7';

            const stemUp = note.pos < 4;

            return (
              <g key={note.id} className="transition-all duration-200">
                {/* Ledgers */}
                {renderLedgers(note.pos, x, color)}

                {/* Active note halo glow */}
                {isCurrent && (
                  <ellipse
                    cx={x}
                    cy={y}
                    rx={26}
                    ry={22}
                    fill="rgba(14, 165, 233, 0.15)"
                    stroke="#0284c7"
                    strokeWidth={2}
                    className="animate-pulse"
                  />
                )}

                {/* Note Stem */}
                <line
                  x1={stemUp ? x + NOTE_RX : x - NOTE_RX}
                  y1={stemUp ? y - 1 : y + 1}
                  x2={stemUp ? x + NOTE_RX : x - NOTE_RX}
                  y2={stemUp ? y - 42 : y + 42}
                  stroke={color}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                />

                {/* Note Head */}
                <ellipse
                  cx={x}
                  cy={y}
                  rx={NOTE_RX}
                  ry={NOTE_RY}
                  fill={color}
                  stroke={color}
                  strokeWidth={1}
                  transform={`rotate(-18 ${x} ${y})`}
                  className={isCurrent ? 'cursor-pointer hover:opacity-80' : ''}
                  onClick={() => onReplayNote(note)}
                />

                {/* Number index indicator below note */}
                <text
                  x={x}
                  y={BOTTOM_Y + 36}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={index === currentIndex ? '800' : '500'}
                  fill={index === currentIndex ? '#0284c7' : '#64748b'}
                >
                  {index + 1}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Quick Replay Hint */}
        {currentIndex < notes.length && (
          <button
            onClick={() => onReplayNote(notes[currentIndex])}
            type="button"
            className="absolute top-2 right-2 px-2.5 py-1 bg-white/90 hover:bg-white text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
            title="Écouter la note active"
          >
            <Volume2 className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">Écouter</span>
          </button>
        )}
      </div>
    </div>
  );
};
