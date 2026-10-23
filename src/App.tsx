/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clef, Difficulty, NoteInfo, NoteLang, MidiState } from './types';
import {
  getNoteInfoForPos,
  DIFFICULTY_RANGES,
  formatMidiName,
  NOTE_NAMES,
  mod
} from './utils/musicTheory';
import { pianoSynth } from './utils/audioSynth';
import { midiManager } from './utils/midiHelper';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { StaffCanvas } from './components/StaffCanvas';
import { PianoKeyboard } from './components/PianoKeyboard';
import { ScoreBoard } from './components/ScoreBoard';
import { MidiTroubleshooter } from './components/MidiTroubleshooter';
import { AlertCircle, CheckCircle2, RefreshCw, Volume2, Usb } from 'lucide-react';

const BATCH_SIZE = 10;

export default function App() {
  const [clef, setClef] = useState<Clef>('treble');
  const [lang, setLang] = useState<NoteLang>('fr');
  const [difficulty, setDifficulty] = useState<Difficulty>('1');

  const [batch, setBatch] = useState<NoteInfo[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  const [okCount, setOkCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);

  const [feedback, setFeedback] = useState<{ type: 'good' | 'bad' | 'info' | null; text: string }>({
    type: null,
    text: ''
  });

  const [answerStatus, setAnswerStatus] = useState<{ midi: number; isGood: boolean } | null>(null);

  // MIDI state & Modal
  const [midiState, setMidiState] = useState<MidiState>(midiManager.getState());
  const [isMidiModalOpen, setIsMidiModalOpen] = useState<boolean>(false);
  const [midiPressedNotes, setMidiPressedNotes] = useState<Set<number>>(new Set());

  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Generate a new batch of 10 random notes within selected difficulty range
  const generateNewBatch = useCallback(
    (targetClef: Clef = clef, targetDiff: Difficulty = difficulty) => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }

      const range = DIFFICULTY_RANGES[targetClef][targetDiff] || [0, 8];
      const [lo, hi] = range;
      const newNotes: NoteInfo[] = [];
      let previousPos: number | null = null;

      for (let i = 0; i < BATCH_SIZE; i++) {
        let pos = lo + Math.floor(Math.random() * (hi - lo + 1));
        let attempts = 0;
        // Avoid repeating identical consecutive note positions
        while (pos === previousPos && attempts < 8) {
          pos = lo + Math.floor(Math.random() * (hi - lo + 1));
          attempts++;
        }
        previousPos = pos;
        newNotes.push(getNoteInfoForPos(targetClef, pos));
      }

      setBatch(newNotes);
      setCurrentIndex(0);
      setIsLocked(false);
      setAnswerStatus(null);
      setFeedback({ type: null, text: '' });
    },
    [clef, difficulty]
  );

  // Initialize on mount
  useEffect(() => {
    generateNewBatch();

    // Subscribe to MIDI Manager state & note events
    const unsubscribeState = midiManager.subscribeState((newState) => {
      setMidiState(newState);
    });

    // Auto connect MIDI with SysEx=true (MIDIWeb default)
    midiManager.connect(true);

    return () => {
      unsubscribeState();
    };
  }, [generateNewBatch]);

  // Handle note press (from virtual keyboard or Casio USB MIDI)
  const submitAnswer = useCallback(
    (pickedMidi: number) => {
      if (isLocked || currentIndex >= batch.length) return;

      const currentNote = batch[currentIndex];
      if (!currentNote) return;

      setIsLocked(true);
      pianoSynth.playMidi(pickedMidi);

      const isGood = pickedMidi === currentNote.midi;
      setAnswerStatus({ midi: pickedMidi, isGood });

      // Update current note in batch
      setBatch((prev) =>
        prev.map((n, idx) =>
          idx === currentIndex
            ? { ...n, result: isGood ? 'good' : 'bad', pickedMidi }
            : n
        )
      );

      setTotalCount((t) => t + 1);

      if (isGood) {
        setOkCount((k) => k + 1);
        setStreak((s) => {
          const nextS = s + 1;
          setBestStreak((b) => Math.max(b, nextS));
          return nextS;
        });

        const correctName = formatMidiName(currentNote.midi, lang);
        setFeedback({
          type: 'good',
          text: lang === 'fr' ? `Bravo ! C'est bien un ${correctName}` : `Correct! It is ${correctName}`
        });
      } else {
        setStreak(0);
        const expectedName = formatMidiName(currentNote.midi, lang);
        const playedName = formatMidiName(pickedMidi, lang);
        setFeedback({
          type: 'bad',
          text:
            lang === 'fr'
              ? `Erreur ! C'était ${expectedName} (vous avez joué ${playedName})`
              : `Incorrect! Expected ${expectedName}, played ${playedName}`
        });
      }

      // Schedule next note advancement
      const delay = isGood ? 500 : 1200;
      advanceTimerRef.current = setTimeout(() => {
        setAnswerStatus(null);
        setIsLocked(false);
        setCurrentIndex((i) => {
          const nextI = i + 1;
          if (nextI >= BATCH_SIZE) {
            setFeedback({
              type: 'info',
              text:
                lang === 'fr'
                  ? 'Série terminée ! Cliquez sur "Nouvelle Série" pour continuer.'
                  : 'Batch completed! Click "New Series" to continue.'
            });
          } else {
            setFeedback({ type: null, text: '' });
          }
          return nextI;
        });
      }, delay);
    },
    [isLocked, currentIndex, batch, lang]
  );

  // Subscribe to physical MIDI note presses (Casio USB / CoreMIDI / Web MIDI)
  useEffect(() => {
    const unsubscribeNotes = midiManager.subscribeNote((note, _velocity, isNoteOn) => {
      setMidiPressedNotes((prev) => {
        const next = new Set(prev);
        if (isNoteOn) {
          next.add(note);
        } else {
          next.delete(note);
        }
        return next;
      });

      if (isNoteOn) {
        submitAnswer(note);
      }
    });

    return () => {
      unsubscribeNotes();
    };
  }, [submitAnswer]);

  // Handle physical computer keyboard shortcuts (QWERTY / AZERTY or C-D-E-F-G-A-B)
  useEffect(() => {
    const KEY_TO_OFFSET: Record<string, number> = {
      // QWERTY / AZERTY line
      a: 0, // C (Do)
      w: 1, // C#
      s: 2, // D (Ré)
      e: 3, // D#
      d: 4, // E (Mi)
      f: 5, // F (Fa)
      t: 6, // F#
      g: 7, // G (Sol)
      y: 8, // G#
      h: 9, // A (La)
      u: 10, // A#
      j: 11, // B (Si)
      k: 12, // C (Do +1)
      
      // Direct note names
      c: 0,
      r: 2,
      m: 4,
      b: 11
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore typing in input elements or with Ctrl/Cmd
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key in KEY_TO_OFFSET) {
        const offset = KEY_TO_OFFSET[key];
        const baseMidi = clef === 'treble' ? 60 : 48; // Middle C for Treble, C3 for Bass
        const targetMidi = baseMidi + offset;
        submitAnswer(targetMidi);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clef, submitAnswer]);

  // Option Handlers
  const handleClefChange = (newClef: Clef) => {
    setClef(newClef);
    generateNewBatch(newClef, difficulty);
  };

  const handleDifficultyChange = (newDiff: Difficulty) => {
    setDifficulty(newDiff);
    generateNewBatch(clef, newDiff);
  };

  const handleResetScore = () => {
    setOkCount(0);
    setTotalCount(0);
    setStreak(0);
    setBestStreak(0);
    generateNewBatch();
  };

  const handleReplayActiveNote = (note: NoteInfo) => {
    pianoSynth.playMidi(note.midi);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col pb-10">
      {/* Header Bar */}
      <Header
        lang={lang}
        onToggleLang={setLang}
        midiState={midiState}
        onOpenMidiModal={() => setIsMidiModalOpen(true)}
        onReconnectMidi={() => midiManager.connect(true)}
      />

      {/* Main Container */}
      <main className="max-w-5xl w-full mx-auto px-3 sm:px-6 pt-4 flex-1 flex flex-col">
        {/* Notice Banner if MIDIWeb / MIDI not connected */}
        {!midiState.isConnected && (
          <div className="mb-3 bg-purple-50/90 border border-purple-200/90 rounded-xl p-3 text-purple-900 text-xs flex items-center justify-between flex-wrap gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <Usb className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                <b>MIDIWeb / Casio USB :</b> Si votre clavier apparaît dans les paramètres MIDIWeb mais pas sur la page, cliquez ici pour forcer la détection :
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => midiManager.connect(true)}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-2xs"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Détecter MIDI</span>
              </button>
              <button
                type="button"
                onClick={() => setIsMidiModalOpen(true)}
                className="px-2.5 py-1 bg-white text-purple-800 border border-purple-300 rounded-lg font-bold text-xs hover:bg-purple-100"
              >
                Aide
              </button>
            </div>
          </div>
        )}

        {/* Controls Panel */}
        <Controls
          clef={clef}
          onChangeClef={handleClefChange}
          lang={lang}
          onChangeLang={setLang}
          difficulty={difficulty}
          onChangeDifficulty={handleDifficultyChange}
          onNewBatch={() => generateNewBatch()}
          onResetScore={handleResetScore}
        />

        {/* Staff Stage */}
        <StaffCanvas
          clef={clef}
          lang={lang}
          notes={batch}
          currentIndex={currentIndex}
          isLocked={isLocked}
          onReplayNote={handleReplayActiveNote}
        />

        {/* Score & Progress Stats */}
        <ScoreBoard
          lang={lang}
          okCount={okCount}
          totalCount={totalCount}
          streak={streak}
          bestStreak={bestStreak}
          currentIndex={currentIndex}
          batchSize={BATCH_SIZE}
        />

        {/* Interactive Feedback Message */}
        <div className="min-h-[38px] flex items-center justify-center my-1 px-3">
          {feedback.text ? (
            <div
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-xs transition-all ${
                feedback.type === 'good'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : feedback.type === 'bad'
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : 'bg-sky-100 text-sky-800 border border-sky-300'
              }`}
            >
              {feedback.type === 'good' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              {feedback.type === 'bad' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
              <span>{feedback.text}</span>
            </div>
          ) : (
            <p className="text-xs text-slate-500 font-medium text-center">
              {lang === 'fr'
                ? 'Jouez la note mise en surbrillance bleue sur le clavier ci-dessous ou votre clavier Casio USB.'
                : 'Play the note highlighted in blue on the keyboard below or your Casio USB keyboard.'}
            </p>
          )}
        </div>

        {/* Interactive Piano Keyboard */}
        <PianoKeyboard
          clef={clef}
          lang={lang}
          onKeyPress={submitAnswer}
          activeMidiNote={batch[currentIndex]?.midi || null}
          midiPressedNotes={midiPressedNotes}
          answerStatus={answerStatus}
        />
      </main>

      {/* MIDI & MIDIWeb Diagnostic Modal */}
      <MidiTroubleshooter
        isOpen={isMidiModalOpen}
        onClose={() => setIsMidiModalOpen(false)}
        midiState={midiState}
        onReconnect={(sysex) => midiManager.connect(sysex)}
        onSelectDevice={(id) => midiManager.selectDevice(id)}
      />
    </div>
  );
}
