import React from 'react';
import { Clef, Difficulty, NoteLang } from '../types';
import { RotateCcw, Play, Settings2 } from 'lucide-react';

interface ControlsProps {
  clef: Clef;
  onChangeClef: (clef: Clef) => void;
  lang: NoteLang;
  onChangeLang: (lang: NoteLang) => void;
  difficulty: Difficulty;
  onChangeDifficulty: (diff: Difficulty) => void;
  onNewBatch: () => void;
  onResetScore: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  clef,
  onChangeClef,
  lang,
  onChangeLang,
  difficulty,
  onChangeDifficulty,
  onNewBatch,
  onResetScore
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-4 shadow-xs mb-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
        {/* Clef Selection */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            {lang === 'fr' ? 'Clé de Musique' : 'Clef'}
          </label>
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200/80 flex text-xs font-bold gap-1">
            <button
              type="button"
              onClick={() => onChangeClef('treble')}
              className={`flex-1 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                clef === 'treble'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="text-base leading-none">𝄞</span>
              <span>{lang === 'fr' ? 'Clé de Sol' : 'Treble'}</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeClef('bass')}
              className={`flex-1 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                clef === 'bass'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="text-base leading-none">𝄢</span>
              <span>{lang === 'fr' ? 'Clé de Fa' : 'Bass'}</span>
            </button>
          </div>
        </div>

        {/* Naming Standard */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            {lang === 'fr' ? 'Notation des notes' : 'Note Names'}
          </label>
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200/80 flex text-xs font-bold gap-1">
            <button
              type="button"
              onClick={() => onChangeLang('fr')}
              className={`flex-1 py-1.5 rounded-md transition-all ${
                lang === 'fr'
                  ? 'bg-white text-slate-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Do Ré Mi Fa Sol
            </button>
            <button
              type="button"
              onClick={() => onChangeLang('en')}
              className={`flex-1 py-1.5 rounded-md transition-all ${
                lang === 'en'
                  ? 'bg-white text-slate-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              C D E F G A B
            </button>
          </div>
        </div>

        {/* Difficulty Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>{lang === 'fr' ? 'Niveau de difficulté' : 'Difficulty'}</span>
            <Settings2 className="w-3 h-3 opacity-50" />
          </label>
          <select
            value={difficulty}
            onChange={(e) => onChangeDifficulty(e.target.value as Difficulty)}
            className="w-full bg-slate-100 border border-slate-200/80 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
          >
            <option value="0">{lang === 'fr' ? 'Facile (Uniquement sur la portée)' : 'Easy (On staff lines)'}</option>
            <option value="1">{lang === 'fr' ? 'Moyen (+ Lignes supplémentaires)' : 'Medium (With ledger lines)'}</option>
            <option value="2">{lang === 'fr' ? 'Difficile (Étendue de 2 octaves)' : 'Hard (2 Full Octaves)'}</option>
            <option value="3">{lang === 'fr' ? 'Focus Basse / Graves' : 'Lower Staff Focus'}</option>
            <option value="4">{lang === 'fr' ? 'Focus Aigus / Haut de portée' : 'Upper Staff Focus'}</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onResetScore}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition-all flex items-center justify-center gap-1.5"
            title="Réinitialiser le score"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'fr' ? 'RAZ' : 'Reset'}</span>
          </button>
          <button
            type="button"
            onClick={onNewBatch}
            className="flex-1 px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{lang === 'fr' ? 'Nouvelle Série (10)' : 'New Series (10)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
