import React from 'react';
import { MidiState } from '../types';
import {
  X,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Activity,
  Sliders,
  HelpCircle,
  Terminal,
  Usb,
  ShieldCheck
} from 'lucide-react';

interface MidiTroubleshooterProps {
  isOpen: boolean;
  onClose: () => void;
  midiState: MidiState;
  onReconnect: (sysex: boolean) => void;
  onSelectDevice: (id: string) => void;
}

export const MidiTroubleshooter: React.FC<MidiTroubleshooterProps> = ({
  isOpen,
  onClose,
  midiState,
  onReconnect,
  onSelectDevice
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Usb className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Diagnostic & Configuration MIDI / MIDIWeb
              </h2>
              <p className="text-xs text-slate-500">
                Aide spécifique pour Casio Privia, iOS, MIDIWeb et claviers USB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Explanation Alert */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs leading-relaxed space-y-1">
            <p className="font-extrabold flex items-center gap-1.5 text-amber-900">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Pourquoi MIDIWeb détecte le Casio Privia mais pas la page web ?</span>
            </p>
            <p>
              Dans l&apos;application <b>MIDIWeb</b> sur iOS, les réglages natifs voient le Casio Privia via CoreMIDI. Cependant, l&apos;injection du pont JavaScript Web MIDI dans la page WebView nécessite parfois :
            </p>
            <ul className="list-disc list-inside space-y-0.5 ml-1 text-amber-800">
              <li>Que la demande d&apos;accès demande expressément le mode <b>SysEx</b> ({`sysex: true`}).</li>
              <li>Un re-scan manuel après l&apos;initialisation du pont CoreMIDI d&apos;iOS.</li>
              <li>Un geste utilisateur (clic) pour valider l&apos;autorisation Web MIDI.</li>
            </ul>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wider block">
                  Actions de Reconnexion
                </span>
                <span className="text-xs text-slate-500">
                  Relancez la détection Web MIDI immédiatement
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onReconnect(true)}
                  disabled={midiState.isConnecting}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${midiState.isConnecting ? 'animate-spin' : ''}`} />
                  <span>Re-scanner (SysEx Oui)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onReconnect(false)}
                  disabled={midiState.isConnecting}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <span>Sans SysEx</span>
                </button>
              </div>
            </div>

            {/* Current Access Mode Badge */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 text-xs">
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              <span>
                Mode SysEx configuré :{' '}
                <b className={midiState.sysexEnabled ? 'text-purple-700' : 'text-slate-700'}>
                  {midiState.sysexEnabled ? 'ACTIVÉ (Recommandé pour MIDIWeb)' : 'DÉSACTIVÉ'}
                </b>
              </span>
            </div>
          </div>

          {/* Detected Input Devices Section */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-600" />
              <span>Périphériques MIDI Détectés ({midiState.inputs.length})</span>
            </h3>

            {midiState.inputs.length === 0 ? (
              <div className="p-4 bg-slate-100/80 rounded-xl border border-dashed border-slate-300 text-center text-slate-500 text-xs">
                Aucun périphérique MIDI trouvé pour le moment.{' '}
                <button
                  type="button"
                  onClick={() => onReconnect(true)}
                  className="text-purple-700 font-bold underline hover:text-purple-900"
                >
                  Cliquez ici pour scanner
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {midiState.inputs.map((input) => {
                  const isSelected = input.id === midiState.selectedInputId;
                  return (
                    <div
                      key={input.id}
                      onClick={() => onSelectDevice(input.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-purple-50 border-purple-300 text-purple-900'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            isSelected ? 'bg-purple-600 animate-pulse' : 'bg-slate-400'
                          }`}
                        />
                        <div>
                          <p className="font-extrabold text-xs">{input.name}</p>
                          <p className="text-[11px] text-slate-500">
                            Fabricant: {input.manufacturer} | ID: {input.id}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200">
                        {isSelected ? 'Actif' : 'Sélectionner'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Realtime Note Event Receiver */}
          <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Moniteur MIDI en Direct (Casio Privia)
              </span>
              {midiState.lastEvent && (
                <span className="text-[10px] text-emerald-400 font-mono">
                  Reçu à {midiState.lastEvent.time}
                </span>
              )}
            </div>

            {midiState.lastEvent ? (
              <div className="bg-slate-800/90 p-2.5 rounded-lg border border-slate-700 font-mono text-xs text-emerald-300 flex items-center justify-between">
                <span>
                  <b>{midiState.lastEvent.command}</b> : Note {midiState.lastEvent.note}
                </span>
                <span>Vélocité : {midiState.lastEvent.velocity}</span>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Jouez une note sur votre clavier Casio USB. La note apparaîtra ici en temps réel.
              </p>
            )}
          </div>

          {/* Diagnostic Console Logs */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-slate-600" />
              <span>Console & Journal d&apos;Événements Web MIDI</span>
            </h3>

            <div className="bg-slate-950 text-slate-300 p-3 rounded-xl font-mono text-[11px] h-36 overflow-y-auto space-y-1 select-text">
              {midiState.logs.length === 0 ? (
                <p className="text-slate-600">Aucun log enregistré.</p>
              ) : (
                midiState.logs.map((log, idx) => {
                  let color = 'text-slate-300';
                  if (log.type === 'success') color = 'text-emerald-400';
                  if (log.type === 'warn') color = 'text-amber-400';
                  if (log.type === 'error') color = 'text-red-400';
                  if (log.type === 'event') color = 'text-purple-300';

                  return (
                    <div key={idx} className="flex gap-2 leading-relaxed">
                      <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                      <span className={color}>{log.message}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Checklist Troubleshooting Guide */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-700">
            <p className="font-bold text-slate-900">Checklist rapide pour Casio Privia + MIDIWeb :</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                <b>Câble USB & Adaptateur OTG :</b> Vérifiez que le câble USB est connecté sur le port <i>USB to Host</i> du Casio et branché au port Lightning/USB-C de l&apos;iPad/iPhone avec un adaptateur OTG officiel.
              </li>
              <li>
                <b>Réglages MIDIWeb :</b> Dans l&apos;application MIDIWeb, confirmez que <i>Casio USB</i> apparaît sous <b>MIDI Inputs</b> et que l&apos;option <b>SysEx</b> est cochée.
              </li>
              <li>
                <b>Sur cette page web :</b> Cliquez sur le bouton <b className="text-purple-700">« Re-scanner (SysEx Oui) »</b> ci-dessus si le clavier n&apos;est pas apparu immédiatement au chargement.
              </li>
            </ol>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
