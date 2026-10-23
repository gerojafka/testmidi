import React from 'react';
import { Music2, Sliders, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { NoteLang, MidiState } from '../types';

interface HeaderProps {
  lang: NoteLang;
  onToggleLang: (lang: NoteLang) => void;
  midiState: MidiState;
  onOpenMidiModal: () => void;
  onReconnectMidi: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onToggleLang,
  midiState,
  onOpenMidiModal,
  onReconnectMidi
}) => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-20 px-4 py-3 shadow-xs">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
            <Music2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {lang === 'fr' ? 'Solfège & Note Reading' : 'Music Note Reader'}
            </h1>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              {lang === 'fr'
                ? 'Apprenez à lire la musique avec votre clavier virtuel ou piano USB / MIDI'
                : 'Learn staff reading with virtual keyboard or USB / MIDI piano'}
            </p>
          </div>
        </div>

        {/* Actions & MIDI Status */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {/* MIDI Status Button */}
          <button
            onClick={onOpenMidiModal}
            id="midi-status-badge"
            type="button"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all ${
              midiState.isConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : midiState.isConnecting
                ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
            title="Ouvrir les paramètres et le diagnostic MIDI / MIDIWeb"
          >
            {midiState.isConnected ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="truncate max-w-[140px] sm:max-w-[180px]">
                  MIDI: {midiState.inputs.find(i => i.id === midiState.selectedInputId)?.name || 'Connecté'}
                </span>
              </>
            ) : midiState.isConnecting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span>Détection MIDI...</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
                <span>MIDI Non Connecté</span>
              </>
            )}
            <Sliders className="w-3 h-3 opacity-60 ml-0.5" />
          </button>

          {/* Manual Connect Button with User Gesture Trigger if not connected */}
          {!midiState.isConnected && (
            <button
              onClick={onReconnectMidi}
              id="midi-quick-rescan"
              type="button"
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm border border-purple-400 text-xs font-bold flex items-center gap-1.5 transition-all animate-bounce"
              title="Cliquer ici pour valider l'autorisation Web MIDI et scanner le Casio USB"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>🔌 Connecter Piano MIDI</span>
            </button>
          )}

          {/* Language Toggle */}
          <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 flex text-xs font-bold">
            <button
              type="button"
              onClick={() => onToggleLang('fr')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                lang === 'fr'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Do Ré Mi
            </button>
            <button
              type="button"
              onClick={() => onToggleLang('en')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                lang === 'en'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              C D E
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
