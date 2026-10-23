import { MidiDiagnosticLog, MidiState } from '../types';

export type NoteCallback = (note: number, velocity: number, isNoteOn: boolean) => void;
export type StateCallback = (state: MidiState) => void;

class MidiManager {
  private midiAccess: any = null;
  private selectedInput: any = null;
  private noteCallbacks: Set<NoteCallback> = new Set();
  private stateCallbacks: Set<StateCallback> = new Set();
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private pollCount = 0;

  private currentState: MidiState = {
    isSupported: typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator,
    isConnecting: false,
    isConnected: false,
    sysexEnabled: true, // Default true since user enabled SysEx in MIDIWeb
    inputs: [],
    selectedInputId: null,
    error: null,
    lastEvent: null,
    logs: []
  };

  constructor() {
    this.addLog('info', 'Gestionnaire MIDI initialisé. Recherche Web MIDI API...');
  }

  public getState(): MidiState {
    return { ...this.currentState };
  }

  public subscribeNote(cb: NoteCallback) {
    this.noteCallbacks.add(cb);
    return () => this.noteCallbacks.delete(cb);
  }

  public subscribeState(cb: StateCallback) {
    this.stateCallbacks.add(cb);
    cb(this.getState());
    return () => this.stateCallbacks.delete(cb);
  }

  private updateState(patch: Partial<MidiState>) {
    this.currentState = { ...this.currentState, ...patch };
    this.notifyState();
  }

  private notifyState() {
    this.stateCallbacks.forEach((cb) => cb(this.getState()));
  }

  public addLog(type: MidiDiagnosticLog['type'], message: string) {
    const timeStr = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const newLog: MidiDiagnosticLog = { timestamp: timeStr, type, message };
    const logs = [newLog, ...this.currentState.logs].slice(0, 30);
    this.updateState({ logs });
  }

  public async connect(sysex: boolean = this.currentState.sysexEnabled) {
    this.updateState({ isConnecting: true, sysexEnabled: sysex, error: null });

    if (!('requestMIDIAccess' in navigator)) {
      const err = 'Web MIDI API non supportée par ce navigateur (ex: Safari iOS natif sans MIDIWeb).';
      this.addLog('error', err);
      this.updateState({
        isSupported: false,
        isConnecting: false,
        isConnected: false,
        error: err
      });
      return false;
    }

    this.addLog('info', `Demande d'accès Web MIDI (sysex=${sysex})...`);

    try {
      // First try requested sysex mode
      let access: any = null;
      try {
        access = await (navigator as any).requestMIDIAccess({ sysex });
        this.addLog('success', `Accès Web MIDI accordé (sysex=${sysex}).`);
      } catch (sysexErr: any) {
        if (sysex) {
          this.addLog('warn', `Accès SysEx refusé/erreur (${sysexErr?.message || sysexErr}), essai sans SysEx...`);
          access = await (navigator as any).requestMIDIAccess({ sysex: false });
          this.updateState({ sysexEnabled: false });
          this.addLog('success', 'Accès Web MIDI accordé (sans SysEx).');
        } else {
          throw sysexErr;
        }
      }

      this.midiAccess = access;

      // Listen for device connects / disconnects (MIDIWeb / CoreMIDI dynamic attach)
      const onStateChange = (e: any) => {
        this.addLog('event', `Changement d'état port MIDI: ${e?.port?.name || 'Inconnu'} (${e?.port?.state || ''})`);
        this.scanInputs();
      };

      if (this.midiAccess) {
        this.midiAccess.onstatechange = onStateChange;
        if (typeof this.midiAccess.addEventListener === 'function') {
          this.midiAccess.addEventListener('statechange', onStateChange);
        }
      }

      this.scanInputs();
      this.startPollingForDevices();

      return true;
    } catch (err: any) {
      const errMsg = `Erreur d'accès Web MIDI: ${err?.message || err || 'Inconnue'}`;
      this.addLog('error', errMsg);
      this.updateState({
        isConnecting: false,
        isConnected: false,
        error: errMsg
      });
      return false;
    }
  }

  /**
   * Polyfill-safe extraction of MIDI inputs.
   * Works with standard MIDIInputMap, Array, Iterators, and WebMIDIAPIPolyfill objects in MIDIWeb.
   */
  public getMidiInputs(): any[] {
    if (!this.midiAccess || !this.midiAccess.inputs) return [];
    const inputsList: any[] = [];

    try {
      const inputs = this.midiAccess.inputs;

      // 1. Standard Map iterator .values()
      if (typeof inputs.values === 'function') {
        try {
          const iter = inputs.values();
          let next = iter.next();
          while (!next.done) {
            if (next.value) inputsList.push(next.value);
            next = iter.next();
          }
        } catch {
          // ignore
        }
      }

      // 2. .forEach
      if (inputsList.length === 0 && typeof inputs.forEach === 'function') {
        inputs.forEach((input: any) => {
          if (input) inputsList.push(input);
        });
      }

      // 3. Direct array
      if (inputsList.length === 0 && Array.isArray(inputs)) {
        inputs.forEach((i) => i && inputsList.push(i));
      }

      // 4. Object keys (legacy polyfills)
      if (inputsList.length === 0 && typeof inputs === 'object') {
        for (const key in inputs) {
          if (Object.prototype.hasOwnProperty.call(inputs, key) && inputs[key] && typeof inputs[key] === 'object') {
            if (inputs[key].name || inputs[key].id) {
              inputsList.push(inputs[key]);
            }
          }
        }
      }
    } catch (e: any) {
      this.addLog('warn', `Erreur lors de la lecture des inputs MIDI: ${e?.message || e}`);
    }

    return inputsList;
  }

  private bindAllInputs(inputsList: any[]) {
    this.addLog('info', `Attachement de l'écouteur multi-ports à ${inputsList.length} périphérique(s)...`);
    
    inputsList.forEach((input: any) => {
      if (!input) return;
      const onMessage = (event: any) => {
        this.handleMidiMessage(event, input.name || input.id || 'USB MIDI');
      };

      try {
        input.onmidimessage = onMessage;
        if (typeof input.addEventListener === 'function') {
          input.addEventListener('midimessage', onMessage);
        }
        this.addLog('success', `Écouteur actif sur port: "${input.name || input.id || 'USB-MIDI'}"`);
      } catch (err: any) {
        this.addLog('warn', `Impossible de lier le port "${input.name}": ${err?.message || err}`);
      }
    });
  }

  public scanInputs() {
    const rawInputs = this.getMidiInputs();
    const formattedInputs = rawInputs.map((i: any, idx: number) => ({
      id: i.id || `input-${idx}`,
      name: i.name || i.manufacturer || `Périphérique MIDI ${idx + 1}`,
      manufacturer: i.manufacturer || 'Inconnu',
      state: i.state || 'connected'
    }));

    this.addLog('info', `${formattedInputs.length} périphérique(s) MIDI détecté(s).`);

    if (formattedInputs.length > 0) {
      formattedInputs.forEach((inp) => {
        this.addLog('success', ` -> Détecté: "${inp.name}" (ID: ${inp.id})`);
      });
      // Bind to ALL inputs so no matter which port Casio sends on, we receive it!
      this.bindAllInputs(rawInputs);
    } else {
      this.unbindAllInputs();
    }

    const hasDevices = formattedInputs.length > 0;

    this.updateState({
      isConnecting: false,
      isConnected: hasDevices,
      inputs: formattedInputs,
      selectedInputId: formattedInputs[0]?.id || null
    });
  }

  public selectDevice(inputId: string) {
    this.updateState({ selectedInputId: inputId });
    const rawInputs = this.getMidiInputs();
    const match = rawInputs.find((i: any) => i.id === inputId);
    if (match) {
      this.bindAllInputs([match]);
    } else {
      this.bindAllInputs(rawInputs);
    }
  }

  private unbindAllInputs() {
    const inputs = this.getMidiInputs();
    inputs.forEach((input: any) => {
      try {
        input.onmidimessage = null;
        if (typeof input.removeEventListener === 'function') {
          input.removeEventListener('midimessage');
        }
      } catch (e) {}
    });
  }

  private handleMidiMessage(event: any, sourceName: string) {
    if (!event || !event.data) return;

    const data = event.data;
    const status = data[0];
    const note = data[1];
    const velocity = data[2] !== undefined ? data[2] : 64;

    const command = status & 0xf0;

    // Log raw bytes for diagnostics
    const hexBytes = Array.from(data).map((b: any) => '0x' + b.toString(16).padStart(2, '0').toUpperCase()).join(' ');

    // 0x90 = Note On, 0x80 = Note Off
    if (command === 0x90 && velocity > 0) {
      this.addLog('event', `[${sourceName}] Note ON: ${note} (Vel: ${velocity}) [${hexBytes}]`);
      this.updateState({
        lastEvent: {
          note,
          velocity,
          command: `Note ON (${sourceName})`,
          time: new Date().toLocaleTimeString('fr-FR')
        }
      });
      this.noteCallbacks.forEach((cb) => cb(note, velocity, true));
    } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
      this.addLog('event', `[${sourceName}] Note OFF: ${note}`);
      this.updateState({
        lastEvent: {
          note,
          velocity: 0,
          command: `Note OFF (${sourceName})`,
          time: new Date().toLocaleTimeString('fr-FR')
        }
      });
      this.noteCallbacks.forEach((cb) => cb(note, 0, false));
    } else {
      // Control Change, Pitch Bend, Active Sensing (0xFE), etc.
      if (status !== 0xfe) { // skip active sensing flood
        this.addLog('info', `[${sourceName}] Msg MIDI: ${hexBytes}`);
      }
    }
  }

  /**
   * MIDIWeb CoreMIDI bridge might take a few seconds after page load to bind USB OTG/Bluetooth.
   * We poll every 1.5 seconds up to 10 times if no devices are detected.
   */
  private startPollingForDevices() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollCount = 0;

    this.pollTimer = setInterval(() => {
      this.pollCount++;
      const currentInputs = this.getMidiInputs();

      if (currentInputs.length > 0) {
        this.addLog('success', `Recherche automatique: ${currentInputs.length} périphérique(s) trouvé(s) !`);
        this.scanInputs();
        if (this.pollTimer) clearInterval(this.pollTimer);
        this.pollTimer = null;
      } else if (this.pollCount >= 10) {
        if (this.pollTimer) clearInterval(this.pollTimer);
        this.pollTimer = null;
        this.addLog('info', 'Fin de la recherche automatique de démarrage.');
      } else {
        this.scanInputs();
      }
    }, 1500);
  }
}

export const midiManager = new MidiManager();
