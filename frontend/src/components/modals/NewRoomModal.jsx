import React, { useState } from 'react';
import { X, Layers, AlertCircle } from 'lucide-react';
import { useRoom } from '../../context/RoomContext';
import { roomsApi } from '../../api/rooms';

export default function NewRoomModal({ isOpen, onClose }) {
  const { refreshRooms, switchRoom } = useRoom();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [missionStatement, setMissionStatement] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      setError('');
      const newRoom = await roomsApi.createRoom({
        name: name.trim(),
        slug: slug.trim() || undefined,
        mission_statement: missionStatement.trim() || null,
      });

      await refreshRooms(newRoom.id);
      switchRoom(newRoom);
      onClose();
      setName('');
      setSlug('');
      setMissionStatement('');
    } catch (err) {
      setError(err.message || 'Failed to create war room');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Create New War Room</h2>
            <p className="text-xs text-slate-400">Launch an isolated workspace for a new hackathon, sprint, or startup project</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Workspace Name *</label>
            <input
              type="text"
              required
              placeholder="e.g., HackZurich 2026 AI War Room, Stealth MVP Sprint"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug) {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30));
                }
              }}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Custom Room Slug / Invite Code</label>
            <input
              type="text"
              placeholder="e.g., hackzurich-ai-2026"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">Teammates can use this code to join your room instantly.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mission Statement</label>
            <textarea
              rows={3}
              placeholder="What is the north-star goal for this sprint? (e.g., Ship an autonomous multimodal agent in 36h and win Best Overall)"
              value={missionStatement}
              onChange={(e) => setMissionStatement(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
            >
              {isSubmitting ? 'Creating...' : 'Launch Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
