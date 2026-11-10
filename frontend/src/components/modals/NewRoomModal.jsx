import React, { useState } from 'react';
import { X, Layers, AlertCircle, Globe, Lock, UserCheck } from 'lucide-react';
import { useRoom } from '../../context/RoomContext';
import { roomsApi } from '../../api/rooms';

export default function NewRoomModal({ isOpen, onClose }) {
  const { refreshRooms, switchRoom } = useRoom();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [missionStatement, setMissionStatement] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(true);
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
        is_private: isPrivate,
        requires_approval: requiresApproval,
      });

      await refreshRooms(newRoom.id);
      switchRoom(newRoom);
      onClose();
      setName('');
      setSlug('');
      setMissionStatement('');
      setIsPrivate(false);
      setRequiresApproval(true);
    } catch (err) {
      setError(err.message || 'Failed to create war room');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg p-5 sm:p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 text-slate-400 hover:text-slate-100 rounded-xl hover:bg-slate-800 transition active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 pr-8">
          <div className="p-2 sm:p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100">Create New War Room</h2>
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
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Custom Room Slug / Invite Code</label>
            <input
              type="text"
              placeholder="e.g., hackzurich-ai-2026"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">Teammates can use this code to join your room.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mission Statement</label>
            <textarea
              rows={2}
              placeholder="What is the north-star goal for this sprint? (e.g., Ship an autonomous multimodal agent in 36h and win Best Overall)"
              value={missionStatement}
              onChange={(e) => setMissionStatement(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Privacy & Approval Settings */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                <div className="mt-0.5 sm:mt-0 shrink-0">
                  {isPrivate ? <Lock className="w-4 h-4 text-amber-400" /> : <Globe className="w-4 h-4 text-emerald-400" />}
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    {isPrivate ? 'Private War Room' : 'Public Workspace'}
                  </span>
                  <span className="text-[11px] text-slate-400 block leading-tight">
                    {isPrivate ? 'Hidden from directory, invite link only' : 'Discoverable in open directory'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none active:scale-95 ${
                  isPrivate ? 'bg-amber-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isPrivate ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="border-t border-slate-800/80 pt-2.5 flex items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                <div className="mt-0.5 sm:mt-0 shrink-0">
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Require Host Approval
                  </span>
                  <span className="text-[11px] text-slate-400 block leading-tight">
                    {requiresApproval ? 'Hosts review & accept join requests' : 'Anyone can join instantly'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRequiresApproval(!requiresApproval)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none active:scale-95 ${
                  requiresApproval ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    requiresApproval ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-medium rounded-xl transition active:scale-95 text-center min-h-[42px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition active:scale-95 text-center min-h-[42px]"
            >
              {isSubmitting ? 'Creating...' : 'Launch War Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
