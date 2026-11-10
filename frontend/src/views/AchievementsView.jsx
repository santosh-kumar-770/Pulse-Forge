import React from 'react';
import {
  Trophy,
  Sparkles,
  Star,
  Plus,
  Trash2,
  PartyPopper,
  Flame,
  Award,
  Share2
} from 'lucide-react';
import { useRoom } from '../context/RoomContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { achievementsApi } from '../api/achievements';
import { fireConfetti, fireCannons } from '../components/ui/Confetti';
import { formatDistanceToNow, format } from 'date-fns';

export default function AchievementsView({ onOpenAchievementModal }) {
  const { activeRoomId, activeRoom } = useRoom();
  const queryClient = useQueryClient();

  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ['achievements', activeRoomId],
    queryFn: () => achievementsApi.listAchievements(activeRoomId),
    enabled: !!activeRoomId,
  });

  const toggleStarMutation = useMutation({
    mutationFn: (id) => achievementsApi.toggleStar(activeRoomId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements', activeRoomId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => achievementsApi.deleteAchievement(activeRoomId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements', activeRoomId] });
    },
  });

  const starredList = achievements.filter((a) => a.is_starred);
  const standardList = achievements.filter((a) => !a.is_starred);

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in">
      {/* Top Banner */}
      <div className="relative p-5 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-slate-900 border border-yellow-500/20 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none hidden sm:block">
          <Trophy className="w-64 h-64 text-yellow-400 -mr-16 -mt-16" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-yellow-400 mb-1">
              <Sparkles className="w-4 h-4 animate-pulse" />
              PulseForge Hall of Fame
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Trophy Case & Milestones
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              Celebrate breakthrough speed, zero-bug deployments, and demo milestones unlocked by your team during this sprint.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => fireCannons()}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-900/80 hover:bg-slate-800 border border-yellow-500/30 text-yellow-300 rounded-xl text-xs font-bold transition shadow-md active:scale-95 min-h-[42px]"
            >
              <PartyPopper className="w-4 h-4" />
              <span>Celebrate All!</span>
            </button>
            <button
              onClick={onOpenAchievementModal}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 rounded-xl text-xs font-extrabold transition shadow-lg shadow-yellow-500/25 active:scale-95 min-h-[42px]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Unlock Trophy</span>
            </button>
          </div>
        </div>
      </div>

      {/* STARRED SHOWCASE */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span>Starred Victories ({starredList.length})</span>
        </div>

        {starredList.length === 0 ? (
          <div className="p-6 sm:p-8 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 text-center text-xs text-slate-500">
            No trophies starred yet. Star achievements to highlight them at the top!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {starredList.map((ach) => (
              <div
                key={ach.id}
                className="relative p-4 sm:p-5 rounded-2xl border bg-gradient-to-b from-slate-900 to-slate-950 border-yellow-500/40 shadow-xl shadow-yellow-500/5 hover:border-yellow-500/60 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 shadow-inner">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleStarMutation.mutate(ach.id)}
                        aria-label="Unstar achievement"
                        className="p-1.5 text-yellow-400 hover:text-yellow-300 transition active:scale-95 rounded-lg"
                        title="Unstar from headline"
                      >
                        <Star className="w-4 h-4 fill-yellow-400" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(ach.id)}
                        aria-label="Delete achievement"
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition active:scale-95 rounded-lg"
                        title="Delete achievement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-100 leading-snug mb-2">
                    {ach.title}
                  </h3>

                  {ach.impact_note && (
                    <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-4 leading-relaxed italic break-words">
                      "{ach.impact_note}"
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 mt-2">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 truncate mr-2">
                    {ach.celebrator && (
                      <span className="truncate">By {ach.celebrator.name}</span>
                    )}
                  </div>
                  <button
                    onClick={() => fireConfetti()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 rounded-lg text-xs font-bold transition shadow-sm active:scale-95 shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Celebrate!</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* STANDARD ACHIEVEMENTS */}
      {standardList.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider">
            <Award className="w-4 h-4 text-slate-400" />
            <span>Team Milestones ({standardList.length})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {standardList.map((ach) => (
              <div
                key={ach.id}
                className="p-4 rounded-2xl border bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-xs font-bold text-slate-200">{ach.title}</h4>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleStarMutation.mutate(ach.id)}
                        aria-label="Star achievement"
                        className="p-1.5 text-slate-500 hover:text-yellow-400 transition active:scale-95 rounded-lg"
                        title="Star achievement"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(ach.id)}
                        aria-label="Delete achievement"
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition active:scale-95 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {ach.impact_note && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 mb-3 break-words">
                      {ach.impact_note}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-500 mt-2">
                  <span className="truncate mr-2">
                    {ach.achieved_at ? formatDistanceToNow(new Date(ach.achieved_at), { addSuffix: true }) : ''}
                  </span>
                  <button
                    onClick={() => fireConfetti()}
                    className="text-xs text-yellow-400 hover:text-yellow-300 font-semibold p-1 active:scale-95 shrink-0"
                  >
                    🎉 Celebrate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
