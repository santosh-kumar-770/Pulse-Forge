import React from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Crown,
  User,
  Mail,
  Code2,
  Sparkles,
  Lock,
  Globe,
  UserCheck
} from 'lucide-react';
import { useRoom } from '../context/RoomContext';
import { useQuery } from '@tanstack/react-query';
import { roomsApi } from '../api/rooms';
import { formatDistanceToNow } from 'date-fns';

const ROLE_BADGES = {
  owner: { label: 'Owner', icon: Crown, style: 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300' },
  admin: { label: 'Admin', icon: Shield, style: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300' },
  member: { label: 'Member', icon: User, style: 'bg-slate-800 border-slate-700 text-slate-300' },
};

export default function MembersView({ onOpenAddMemberModal, onOpenRoomSettings }) {
  const { activeRoomId, activeRoom, myRole } = useRoom();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members', activeRoomId],
    queryFn: () => roomsApi.listMembers(activeRoomId),
    enabled: !!activeRoomId,
  });

  const canManage = myRole === 'owner' || myRole === 'admin';
  const pendingCount = activeRoom?.pending_request_count || 0;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
              War Room Team & Roles
            </h1>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 ${
              activeRoom?.is_private
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            }`}>
              {activeRoom?.is_private ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
              {activeRoom?.is_private ? 'Private War Room' : 'Public Room'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Active contributors, roles, and technical skillsets in <span className="text-indigo-400 font-semibold">{activeRoom?.name}</span>
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenRoomSettings}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-semibold transition shadow-sm"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              Room Settings
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenAddMemberModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30"
            >
              <UserPlus className="w-4 h-4" />
              Add Teammate
            </button>
          </div>
        )}
      </div>

      {/* Pending Join Requests Banner (if Host) */}
      {canManage && pendingCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-200">
                {pendingCount} Candidate {pendingCount === 1 ? 'is' : 'are'} waiting for your approval!
              </h4>
              <p className="text-xs text-amber-300/80">
                Hackers have submitted join requests to enter this sprint. Review and accept candidates.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenRoomSettings}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow"
          >
            Review Candidates
          </button>
        </div>
      )}

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map((member) => {
          const badge = ROLE_BADGES[member.role] || ROLE_BADGES.member;
          const BadgeIcon = badge.icon;
          const u = member.user || {};

          return (
            <div
              key={member.id}
              className="p-5 bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl transition-all shadow-sm flex flex-col justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <img
                  src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.name || 'hacker'}`}
                  alt={u.name}
                  className="w-12 h-12 rounded-xl object-cover bg-slate-800 border border-slate-700/80 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-100 truncate">
                      {u.name}
                    </h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${badge.style}`}>
                      <BadgeIcon className="w-3 h-3" />
                      {badge.label}
                    </span>
                  </div>

                  <p className="text-xs text-indigo-400 font-mono mt-0.5">
                    {u.role_title || 'Hacker'}
                  </p>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <span className="truncate">{u.email}</span>
                  </div>

                  {u.bio && (
                    <p className="text-xs text-slate-300 italic mt-2 line-clamp-2 leading-relaxed">
                      "{u.bio}"
                    </p>
                  )}
                </div>
              </div>

              {/* Skills Pills */}
              {u.skills && u.skills.length > 0 && (
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                  {u.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-400 rounded-md font-mono"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
