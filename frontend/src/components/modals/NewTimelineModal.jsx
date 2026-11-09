import React, { useState } from 'react';
import { X, Clock, AlertCircle } from 'lucide-react';
import { useRoom } from '../../context/RoomContext';
import { timelineApi } from '../../api/timeline';
import { roomsApi } from '../../api/rooms';
import { useQueryClient, useQuery } from '@tanstack/react-query';

export default function NewTimelineModal({ isOpen, onClose }) {
  const { activeRoomId } = useRoom();
  const queryClient = useQueryClient();

  const [eventName, setEventName] = useState('');
  const [targetTime, setTargetTime] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { data: members = [] } = useQuery({
    queryKey: ['members', activeRoomId],
    queryFn: () => roomsApi.listMembers(activeRoomId),
    enabled: isOpen && !!activeRoomId,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!eventName.trim() || !targetTime) return;

    try {
      setIsSubmitting(true);
      setError('');
      await timelineApi.createEvent(activeRoomId, {
        event_name: eventName.trim(),
        target_time: new Date(targetTime).toISOString(),
        status: 'pending',
        owner_id: ownerId ? parseInt(ownerId, 10) : null,
      });

      queryClient.invalidateQueries({ queryKey: ['timeline', activeRoomId] });
      onClose();
      setEventName('');
      setTargetTime('');
      setOwnerId('');
    } catch (err) {
      setError(err.message || 'Failed to schedule milestone');
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
          <div className="p-2.5 bg-violet-500/10 border border-violet-500/30 rounded-xl text-violet-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Schedule Checkpoint / Deadline</h2>
            <p className="text-xs text-slate-400">Keep the team synchronized on critical hackathon gates</p>
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
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Checkpoint Event Name *</label>
            <input
              type="text"
              required
              placeholder="e.g., Code Freeze & Screencast Prep, Live Mentor Sync"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Time *</label>
              <input
                type="datetime-local"
                required
                value={targetTime}
                onChange={(e) => setTargetTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Checkpoint Owner</label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-violet-500"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.user?.name || `User #${m.user_id}`}
                  </option>
                ))}
              </select>
            </div>
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
              disabled={isSubmitting || !eventName.trim() || !targetTime}
              className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-violet-600/30 transition-all"
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Milestone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
