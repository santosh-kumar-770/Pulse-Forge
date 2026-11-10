import React, { useState } from 'react';
import {
  Clock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  History,
  Send,
  Sparkles,
  Calendar,
  Check,
  ChevronRight,
  User,
  Trash2,
  Flame,
  Award,
  Pin
} from 'lucide-react';
import { useRoom } from '../context/RoomContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timelineApi } from '../api/timeline';
import { fireConfetti } from '../components/ui/Confetti';
import { format, formatDistanceToNow, isPast } from 'date-fns';

const ACTION_BADGES = {
  task_completed: { label: 'Task Done', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  task_created: { label: 'Task Added', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
  achievement_unlocked: { label: 'Trophy Unlocked', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  milestone_reached: { label: 'Milestone Hit', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  milestone_scheduled: { label: 'Checkpoint', color: 'bg-violet-500/15 text-violet-400 border-violet-500/30' },
  note_pinned: { label: 'Knowledge Pinned', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  manual_retro: { label: 'Retro Note', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  room_created: { label: 'Room Initialized', color: 'bg-slate-800 text-slate-300 border-slate-700' },
};

export default function TimelineView({ onOpenTimelineModal }) {
  const { activeRoomId } = useRoom();
  const queryClient = useQueryClient();

  const [mobileTab, setMobileTab] = useState('events'); // 'events' | 'history'
  const [retroInput, setRetroInput] = useState('');
  const [isSubmittingRetro, setIsSubmittingRetro] = useState(false);

  // Fetch timeline events & retrospective history logs
  const { data = { events: [], history: [] }, isLoading } = useQuery({
    queryKey: ['timeline', activeRoomId],
    queryFn: () => timelineApi.getTimeline(activeRoomId),
    enabled: !!activeRoomId,
    refetchInterval: 10000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ eventId, status }) => timelineApi.updateEventStatus(activeRoomId, eventId, status),
    onSuccess: (updated) => {
      if (updated.status === 'completed') {
        fireConfetti({ spread: 60 });
      }
      queryClient.invalidateQueries({ queryKey: ['timeline', activeRoomId] });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (eventId) => timelineApi.deleteEvent(activeRoomId, eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', activeRoomId] });
    },
  });

  const handleAddRetro = async (e) => {
    e.preventDefault();
    if (!retroInput.trim()) return;

    try {
      setIsSubmittingRetro(true);
      await timelineApi.addRetrospectiveLog(activeRoomId, {
        action_type: 'manual_retro',
        description: retroInput.trim(),
      });
      setRetroInput('');
      queryClient.invalidateQueries({ queryKey: ['timeline', activeRoomId] });
    } catch (err) {
      console.error('Failed to append retrospective note:', err);
    } finally {
      setIsSubmittingRetro(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
            Timeline & Milestones
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Forward-looking hackathon checkpoints & immutable historical retrospective changelog
          </p>
        </div>

        <button
          onClick={onOpenTimelineModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-violet-600/30 self-stretch sm:self-auto active:scale-95 min-h-[42px]"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Checkpoint</span>
        </button>
      </div>

      {/* Mobile Tab Switcher (< lg) */}
      <div className="lg:hidden flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
        <button
          onClick={() => setMobileTab('events')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition active:scale-95 flex items-center justify-center gap-1.5 ${
            mobileTab === 'events'
              ? 'bg-violet-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Gates ({data.events.length})</span>
        </button>
        <button
          onClick={() => setMobileTab('history')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition active:scale-95 flex items-center justify-center gap-1.5 ${
            mobileTab === 'history'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Changelog ({data.history.length})</span>
        </button>
      </div>

      {/* Split View: Left (Upcoming Gates) / Right (Historical Changelog) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: UPCOMING CHECKPOINTS (5 Cols) */}
        <div className={`lg:col-span-5 space-y-4 ${mobileTab === 'events' ? 'block' : 'hidden lg:block'}`}>
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-violet-400" />
              <span>Forward Roadmap Gates ({data.events.length})</span>
            </div>
          </div>

          <div className="space-y-3">
            {data.events.length === 0 ? (
              <div className="p-6 sm:p-8 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 text-center">
                <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">No forward checkpoints scheduled.</p>
                <p className="text-[11px] text-slate-500 mt-1">Set deadlines like "Code Freeze" or "Deck Submission".</p>
                <button
                  onClick={onOpenTimelineModal}
                  className="mt-3 px-3.5 py-2 bg-violet-500/15 border border-violet-500/30 text-violet-300 rounded-xl text-xs font-semibold hover:bg-violet-500/25 active:scale-95 transition"
                >
                  + Add Checkpoint
                </button>
              </div>
            ) : (
              data.events.map((event) => {
                const target = new Date(event.target_time);
                const past = isPast(target);
                const isDone = event.status === 'completed';
                const isMissed = event.status === 'missed';

                return (
                  <div
                    key={event.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                      isDone
                        ? 'bg-slate-900/40 border-emerald-500/20 opacity-80'
                        : isMissed
                        ? 'bg-slate-900/60 border-rose-500/30'
                        : past
                        ? 'bg-slate-900/90 border-amber-500/40 shadow-lg shadow-amber-500/5'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Checkbox to mark complete */}
                        <button
                          onClick={() =>
                            updateStatusMutation.mutate({
                              eventId: event.id,
                              status: isDone ? 'pending' : 'completed',
                            })
                          }
                          aria-label={isDone ? 'Mark as pending' : 'Mark as achieved'}
                          className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0 active:scale-90 ${
                            isDone
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                              : 'border-slate-700 hover:border-slate-500 bg-slate-950'
                          }`}
                          title={isDone ? 'Mark as Pending' : 'Mark as Reached!'}
                        >
                          {isDone && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <h4
                            className={`text-sm font-bold truncate leading-tight ${
                              isDone ? 'line-through text-slate-400' : 'text-slate-100'
                            }`}
                          >
                            {event.event_name}
                          </h4>

                          <div className="flex items-center gap-1.5 sm:gap-2 mt-1 text-xs flex-wrap">
                            <span className="text-slate-400 font-mono text-[11px]">
                              {format(target, 'MMM d, h:mm a')}
                            </span>
                            <span className="text-slate-600 hidden xs:inline">&bull;</span>
                            <span
                              className={`font-semibold text-[11px] ${
                                isDone
                                  ? 'text-emerald-400'
                                  : past
                                  ? 'text-amber-400 animate-pulse'
                                  : 'text-violet-400'
                              }`}
                            >
                              {isDone
                                ? 'Achieved'
                                : past
                                ? 'Overdue!'
                                : formatDistanceToNow(target, { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right action / Delete */}
                      <button
                        onClick={() => deleteEventMutation.mutate(event.id)}
                        aria-label="Delete checkpoint"
                        className="text-slate-600 hover:text-rose-400 p-1.5 rounded-lg transition shrink-0 active:scale-95"
                        title="Delete checkpoint"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Owner info */}
                    {event.owner && (
                      <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-800/60 text-[11px] text-slate-500">
                        <img
                          src={event.owner.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'}
                          alt={event.owner.name}
                          className="w-4 h-4 rounded-full object-cover shrink-0"
                        />
                        <span className="truncate">Lead: {event.owner.name}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: IMMUTABLE RETROSPECTIVE CHANGELOG (7 Cols) */}
        <div className={`lg:col-span-7 space-y-4 ${mobileTab === 'history' ? 'block' : 'hidden lg:block'}`}>
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
              <History className="w-4 h-4 text-emerald-400" />
              <span>Retrospective Audit Log ({data.history.length})</span>
            </div>
            <span className="text-[11px] text-slate-500">Auto-synced</span>
          </div>

          {/* Quick Retrospective Entry Input */}
          <form onSubmit={handleAddRetro} className="p-2.5 sm:p-3 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Log a retrospective takeaway, feedback, or milestone..."
                value={retroInput}
                onChange={(e) => setRetroInput(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 min-w-0"
              />
              <button
                type="submit"
                disabled={isSubmittingRetro || !retroInput.trim()}
                className="px-3.5 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5 shrink-0 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Log</span>
              </button>
            </div>
          </form>

          {/* Chronological History Feed */}
          <div className="relative pl-7 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
            {data.history.length === 0 ? (
              <div className="p-6 sm:p-8 border border-slate-800 rounded-2xl bg-slate-900/30 text-center text-xs text-slate-500">
                No activity recorded yet in this war room.
              </div>
            ) : (
              data.history.map((log) => {
                const badge = ACTION_BADGES[log.action_type] || {
                  label: log.action_type.replace('_', ' '),
                  color: 'bg-slate-800 text-slate-300 border-slate-700',
                };
                const logTime = new Date(log.timestamp);

                return (
                  <div key={log.id} className="relative group">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[23px] top-2 w-3 h-3 rounded-full bg-slate-950 border-2 border-indigo-500 group-hover:scale-125 transition-transform" />

                    <div className="p-3 sm:p-3.5 bg-slate-900/70 border border-slate-800/80 rounded-2xl hover:border-slate-700 transition-colors">
                      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold border ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500" title={format(logTime, 'PPpp')}>
                          {formatDistanceToNow(logTime, { addSuffix: true })}
                        </span>
                      </div>

                      <p className="text-xs text-slate-200 leading-relaxed font-normal break-words">
                        {log.description}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
