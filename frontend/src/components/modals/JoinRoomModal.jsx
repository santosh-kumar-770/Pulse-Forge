import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useRoom } from '../../context/RoomContext';
import { roomsApi } from '../../api/rooms';

export default function JoinRoomModal({ isOpen, onClose }) {
  const { refreshRooms, switchRoom, setAwaitingRoom } = useRoom();

  const [slug, setSlug] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!slug.trim()) return;

    try {
      setIsSubmitting(true);
      setError('');
      setInfo('');
      const res = await roomsApi.joinRoomBySlug(slug.trim());

      if (res.status === 'pending') {
        setInfo(res.message || 'This room requires host approval. Your request is pending.');
        if (res.room) {
          setAwaitingRoom(res.room);
        }
        setTimeout(() => {
          onClose();
          setSlug('');
          setInfo('');
        }, 2500);
      } else {
        const roomObj = res.room || res;
        await refreshRooms(roomObj.id);
        switchRoom(roomObj);
        onClose();
        setSlug('');
      }
    } catch (err) {
      setError(err.message || 'Room not found with this code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Join Existing War Room</h2>
            <p className="text-xs text-slate-400">Enter the room slug or invite code shared by your team</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div className="mb-4 p-3 flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs">
            <Clock className="w-4 h-4 shrink-0" />
            <span>{info}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Room Code / Slug *</label>
            <input
              type="text"
              required
              placeholder="e.g., hackzurich-2026-ai"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().trim())}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
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
              disabled={isSubmitting || !slug.trim()}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
            >
              {isSubmitting ? 'Joining...' : 'Enter War Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
