
export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  MAP = 'MAP',
  AI_GUARD = 'AI_GUARD',
  SETTINGS = 'SETTINGS',
  FAKE_SHUTDOWN = 'FAKE_SHUTDOWN',
  CHAT = 'CHAT',
  EVIDENCE_VAULT = 'EVIDENCE_VAULT',
  CONTACTS = 'CONTACTS',
  VOICE_CHAT = 'VOICE_CHAT',
  LIVE_SHARE = 'LIVE_SHARE',
  DIGITAL_SHIELD = 'DIGITAL_SHIELD'
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
  customAlertMessage?: string;
  alertType?: 'STANDARD' | 'URGENT_CALL' | 'VIDEO_LINK';
}

export interface AlertLog {
  id: string;
  timestamp: number;
  type: 'SOS' | 'SCREAM' | 'SHAKE' | 'FALL' | 'ZONE_RISK';
  location: { lat: number; lng: number } | null;
  synced: boolean;
}

export interface SensorStatus {
  isListening: boolean;
  isWatching: boolean;
  screamDetected: boolean;
  motionRisk: number; // 0-100
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
