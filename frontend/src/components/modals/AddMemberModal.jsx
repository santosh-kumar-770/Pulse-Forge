import React, { useState } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import { useRoom } from '../../context/RoomContext';
import { roomsApi } from '../../api/rooms';
import { useQueryClient } from '@tanstack/react-query';

export default function AddMemberModal({ isOpen, onClose }) {
  const { activeRoomId } = useRoom();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setIsSubmitting(true);
      setError('');
      await roomsApi.addMember(activeRoomId, {
        email: email.trim().toLowerCase(),
        role,
      });

      queryClient.invalidateQueries({ queryKey: ['members', activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ['timeline', activeRoomId] });
      onClose();
      setEmail('');
      setRole('member');
    } catch (err) {
      setError(err.message || 'Failed to add member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md p-5 sm:p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 text-slate-400 hover:text-slate-100 rounded-xl hover:bg-slate-800 transition active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 pr-8">
          <div className="p-2 sm:p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400 shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100">Add Teammate to Room</h2>
            <p className="text-xs text-slate-400">Invite a registered hacker to this war-room workspace</p>
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
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Teammate Email *</label>
            <input
              type="email"
              required
              placeholder="e.g., sophia@pulseforge.dev"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Assigned Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="member">Member (Can edit tasks, notes, milestones)</option>
              <option value="admin">Admin (Can manage settings and invite members)</option>
            </select>
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
              disabled={isSubmitting || !email.trim()}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition active:scale-95 text-center min-h-[42px]"
            >
              {isSubmitting ? 'Adding...' : 'Add Teammate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
