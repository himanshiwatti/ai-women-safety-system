
import { EmergencyContact } from './types';

export const APP_NAME = "GUARDIAN EYE";

export const MOCK_CONTACTS: EmergencyContact[] = [
  { 
    id: '1', 
    name: 'Mom', 
    phone: '+1234567890', 
    relation: 'Parent',
    customAlertMessage: 'EMERGENCY! I am unsafe. Tracking is ON.',
    alertType: 'URGENT_CALL'
  },
  { id: '2', name: 'Partner', phone: '+0987654321', relation: 'Spouse' },
  { id: '3', name: 'Emergency Services', phone: '911', relation: 'Authority' },
];

export const SAFETY_TIPS = [
  "Stay in well-lit areas when walking alone.",
  "Trust your instincts; if something feels off, leave.",
  "Keep your phone charged and easily accessible.",
  "Share your live location with trusted contacts.",
  "Avoid using headphones in isolated areas to stay aware."
];

export const MAP_STYLES = {
  safe: '#10B981',
  moderate: '#F59E0B',
  danger: '#D50000',
  path: '#FF4FF9'
};