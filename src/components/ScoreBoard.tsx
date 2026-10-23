import React from 'react';
import { NoteLang } from '../types';
import { Flame, Target, Award } from 'lucide-react';

interface ScoreBoardProps {
  lang: NoteLang;
  okCount: number;
  totalCount: number;
  streak: number;
  bestStreak: number;
  currentIndex: number;
  batchSize: number;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  lang,
  okCount,
  totalCount,
  streak,
  bestStreak,
  currentIndex,
  batchSize
}) => {
  const accuracy = totalCount > 0 ? Math.round((okCount / totalCount) * 100) : 100;
  const currentStep = Math.min(currentIndex + 1, batchSize);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3">
      {/* Note Step Counter */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-2.5 flex items-center gap-3 shadow-2xs">
        <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-black text-xs">
          {currentStep}/{batchSize}
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
            {lang === 'fr' ? 'Série Active' : 'Active Batch'}
          </p>
          <p className="text-xs font-extrabold text-slate-800">
            {lang === 'fr' ? `Note ${currentStep} sur ${batchSize}` : `Note ${currentStep} of ${batchSize}`}
          </p>
        </div>
      </div>

      {/* Accuracy */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-2.5 flex items-center gap-3 shadow-2xs">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <Target className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
            {lang === 'fr' ? 'Précision' : 'Accuracy'}
          </p>
          <p className="text-xs font-extrabold text-slate-800">
            {accuracy}% ({okCount}/{totalCount})
          </p>
        </div>
      </div>

      {/* Streak */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-2.5 flex items-center gap-3 shadow-2xs">
        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
          <Flame className="w-4 h-4 fill-current" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
            {lang === 'fr' ? 'Série en cours' : 'Streak'}
          </p>
          <p className="text-xs font-extrabold text-amber-700">
            {streak} {lang === 'fr' ? 'd\'affilée' : 'in a row'}
          </p>
        </div>
      </div>

      {/* Best Streak */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-2.5 flex items-center gap-3 shadow-2xs">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Award className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
            {lang === 'fr' ? 'Record' : 'Record'}
          </p>
          <p className="text-xs font-extrabold text-indigo-800">
            {bestStreak} {lang === 'fr' ? 'notes' : 'notes'}
          </p>
        </div>
      </div>
    </div>
  );
};
