import React, { useState } from 'react';
import { X, Trophy, Sparkles, AlertCircle } from 'lucide-react';
import { useRoom } from '../../context/RoomContext';
import { achievementsApi } from '../../api/achievements';
import { useQueryClient } from '@tanstack/react-query';
import { fireConfetti } from '../ui/Confetti';

export default function NewAchievementModal({ isOpen, onClose }) {
  const { activeRoomId } = useRoom();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [impactNote, setImpactNote] = useState('');
  const [isStarred, setIsStarred] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      setError('');
      await achievementsApi.createAchievement(activeRoomId, {
        title: title.trim(),
        impact_note: impactNote.trim() || null,
        is_starred: isStarred,
      });

      // Fire celebratory confetti!
      fireConfetti();

      queryClient.invalidateQueries({ queryKey: ['achievements', activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ['timeline', activeRoomId] });
      onClose();
      setTitle('');
      setImpactNote('');
      setIsStarred(true);
    } catch (err) {
      setError(err.message || 'Failed to unlock achievement');
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
          <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Unlock Team Trophy
              <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
            </h2>
            <p className="text-xs text-slate-400">Celebrate high-velocity milestones, demo successes, and breakthrough breakthroughs</p>
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
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Achievement Title *</label>
            <input
              type="text"
              required
              placeholder="e.g., Deployed MVP in <6 Hours, 100 Live Stage Signups"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Impact Note / Story</label>
            <textarea
              rows={3}
              placeholder="How did this move the needle? (e.g., Judge demo executed with 0 lag; audience cheered)"
              value={impactNote}
              onChange={(e) => setImpactNote(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isStarred"
              checked={isStarred}
              onChange={(e) => setIsStarred(e.target.checked)}
              className="w-4 h-4 rounded text-yellow-500 bg-slate-950 border-slate-800 focus:ring-yellow-500"
            />
            <label htmlFor="isStarred" className="text-xs font-medium text-slate-300 select-none cursor-pointer">
              Star in Hall of Fame headline showcase
            </label>
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
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-yellow-600/30 transition-all flex items-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              {isSubmitting ? 'Celebrating...' : 'Celebrate Milestone!'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
