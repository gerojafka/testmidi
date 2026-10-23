export type Clef = 'treble' | 'bass';
export type NoteLang = 'fr' | 'en';
export type Difficulty = '0' | '1' | '2' | '3' | '4'; // 0: Easy, 1: Medium, 2: Hard, 3: Lower, 4: Upper

export interface NoteInfo {
  id: string;
  pos: number; // Position relative to bottom line of staff
  nameIndex: number; // 0=Do/C, 1=Ré/D, etc.
  octave: number;
  midi: number;
  result: 'good' | 'bad' | null;
  pickedMidi?: number;
}

export interface MidiDiagnosticLog {
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'error' | 'event';
  message: string;
}

export interface MidiState {
  isSupported: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  sysexEnabled: boolean;
  inputs: Array<{ id: string; name: string; manufacturer: string; state: string }>;
  selectedInputId: string | null;
  error: string | null;
  lastEvent: { note: number; velocity: number; command: string; time: string } | null;
  logs: MidiDiagnosticLog[];
}
