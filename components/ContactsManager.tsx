
import React, { useState, useEffect } from 'react';
import { EmergencyContact } from '../types';

interface ContactsManagerProps {
  contacts: EmergencyContact[];
  onAdd: (contact: EmergencyContact) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

const ContactsManager: React.FC<ContactsManagerProps> = ({ contacts, onAdd, onDelete, onBack }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('Parent');
  
  // Parent specific settings
  const [customMessage, setCustomMessage] = useState('');
  const [alertType, setAlertType] = useState<'STANDARD' | 'URGENT_CALL' | 'VIDEO_LINK'>('STANDARD');

  // Reset advanced fields when relation changes away from Parent
  useEffect(() => {
    if (relation !== 'Parent') {
        setCustomMessage('');
        setAlertType('STANDARD');
    } else {
        // Default text for parents
        setCustomMessage("I'm in danger! Here is my location. Please call me immediately.");
    }
  }, [relation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && phone) {
      onAdd({
        id: Date.now().toString(),
        name,
        phone,
        relation,
        customAlertMessage: relation === 'Parent' ? customMessage : undefined,
        alertType: relation === 'Parent' ? alertType : 'STANDARD'
      });
      setName('');
      setPhone('');
      setRelation('Parent');
      setCustomMessage('');
      setAlertType('STANDARD');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition-colors">
            ⬅️
        </button>
        <div>
            <h2 className="text-2xl font-display text-white">My Guardians</h2>
            <p className="text-xs text-gray-400">Manage who receives your SOS alerts</p>
        </div>
      </div>

      {/* Add Form */}
      <form onSubmit={handleSubmit} className="bg-gradient-to-b from-gray-800 to-gray-900 p-5 rounded-xl border border-gray-700 shadow-lg space-y-4">
        <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🛡️</span>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">Add New Guardian</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
            <div>
                <label className="block text-[10px] uppercase text-gray-500 mb-1 font-bold">Name</label>
                <input 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-black/50 border border-gray-600 rounded-lg p-3 text-white focus:border-primary outline-none focus:ring-1 focus:ring-primary placeholder-gray-600 text-sm"
                    placeholder="e.g. Dad"
                    required
                />
            </div>

            <div>
                <label className="block text-[10px] uppercase text-gray-500 mb-1 font-bold">Phone Number</label>
                <input 
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-black/50 border border-gray-600 rounded-lg p-3 text-white focus:border-primary outline-none focus:ring-1 focus:ring-primary placeholder-gray-600 text-sm"
                    placeholder="+1 (555) 000-0000"
                    type="tel"
                    required
                />
            </div>

            <div>
                <label className="block text-[10px] uppercase text-gray-500 mb-1 font-bold">Relation</label>
                <select 
                    value={relation}
                    onChange={e => setRelation(e.target.value)}
                    className="w-full bg-black/50 border border-gray-600 rounded-lg p-3 text-white focus:border-primary outline-none text-sm appearance-none"
                >
                    <option value="Parent">Parent</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Friend">Friend</option>
                    <option value="Doctor">Doctor</option>
                </select>
            </div>

            {/* Parent Specific Settings */}
            {relation === 'Parent' && (
                <div className="mt-2 p-3 bg-primary/10 border border-primary/30 rounded-lg space-y-3 animate-fadeIn">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase">
                        <span>⭐</span> Parent Alert Customization
                    </div>
                    
                    <div>
                        <label className="block text-[10px] uppercase text-gray-400 mb-1">Custom SOS Message</label>
                        <textarea 
                            value={customMessage}
                            onChange={e => setCustomMessage(e.target.value)}
                            className="w-full bg-black/50 border border-primary/40 rounded-lg p-2 text-white focus:border-primary outline-none text-xs h-20"
                            placeholder="Enter custom message for parents..."
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase text-gray-400 mb-1">Notification Priority</label>
                        <select 
                            value={alertType}
                            onChange={e => setAlertType(e.target.value as any)}
                            className="w-full bg-black/50 border border-primary/40 rounded-lg p-2 text-white focus:border-primary outline-none text-xs"
                        >
                            <option value="STANDARD">Standard (SMS + Location)</option>
                            <option value="URGENT_CALL">Urgent (Auto-Call + SMS)</option>
                            <option value="VIDEO_LINK">Visual (Live Video Link + SMS)</option>
                        </select>
                    </div>
                </div>
            )}
        </div>

        <button type="submit" className="w-full bg-primary hover:bg-purple-700 text-white font-bold py-3 rounded-lg mt-2 transition-all flex justify-center items-center gap-2">
            <span>+</span> Add to Safety Network
        </button>
      </form>

      {/* List */}
      <div className="space-y-3">
        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest pl-1">Trusted Network ({contacts.length})</h3>
        {contacts.length === 0 && (
            <div className="p-4 border border-dashed border-gray-700 rounded-xl text-center text-gray-500 text-sm">
                No contacts added yet.
            </div>
        )}
        {contacts.map(contact => (
          <div key={contact.id} className="bg-surface p-4 rounded-xl border border-gray-800 flex justify-between items-center group hover:border-gray-600 transition-all relative overflow-hidden">
            {/* Highlight for Parents */}
            {contact.relation === 'Parent' && (
                <div className="absolute top-0 right-0 w-12 h-12 bg-primary/20 -mr-6 -mt-6 rounded-full blur-xl pointer-events-none"></div>
            )}
            
            <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-xl">
                    {contact.relation === 'Parent' ? '👪' : '👤'}
                </div>
                <div>
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                        {contact.name}
                        {contact.alertType === 'URGENT_CALL' && <span className="text-[8px] bg-red-900 text-red-200 px-1 rounded border border-red-800">CALL</span>}
                        {contact.alertType === 'VIDEO_LINK' && <span className="text-[8px] bg-blue-900 text-blue-200 px-1 rounded border border-blue-800">VIDEO</span>}
                    </div>
                    <div className="text-xs text-primary">{contact.relation}</div>
                    <div className="text-xs text-gray-500">{contact.phone}</div>
                </div>
            </div>
            <button 
              onClick={() => onDelete(contact.id)}
              className="w-8 h-8 flex items-center justify-center bg-red-900/20 text-red-500 rounded-full hover:bg-red-900/40 transition-colors z-10"
              title="Remove Contact"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      
      <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-900/50 flex gap-3 items-start">
        <span className="text-lg">ℹ️</span>
        <p className="text-xs text-blue-200 leading-relaxed">
            Parents configured with <strong>Urgent Call</strong> will receive an automated phone call immediately after the SOS signal is verified.
        </p>
      </div>
    </div>
  );
};

export default ContactsManager;