import React from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Crown,
  User,
  Mail,
  Code2,
  Sparkles
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

export default function MembersView({ onOpenAddMemberModal }) {
  const { activeRoomId, activeRoom, myRole } = useRoom();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members', activeRoomId],
    queryFn: () => roomsApi.listMembers(activeRoomId),
    enabled: !!activeRoomId,
  });

  const canManage = myRole === 'owner' || myRole === 'admin';

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
            War Room Team & Roles
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Active contributors, roles, and technical skillsets in <span className="text-indigo-400 font-semibold">{activeRoom?.name}</span>
          </p>
        </div>

        {canManage && (
          <button
            onClick={onOpenAddMemberModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            Add Teammate
          </button>
        )}
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map((member) => {
          const u = member.user || {};
          const roleConfig = ROLE_BADGES[member.role] || ROLE_BADGES.member;
          const RoleIcon = roleConfig.icon;
          const skills = u.skills || [];

          return (
            <div
              key={member.id}
              className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Top: Avatar, Name, Role */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                      alt={u.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-100 truncate">{u.name}</h3>
                      <p className="text-xs text-indigo-400 font-medium truncate">{u.role_title || 'Hacker'}</p>
                      <p className="text-[11px] text-slate-500 font-mono truncate">{u.email}</p>
                    </div>
                  </div>

                  <span
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border shrink-0 ${roleConfig.style}`}
                  >
                    <RoleIcon className="w-3 h-3" />
                    {roleConfig.label}
                  </span>
                </div>

                {/* Bio */}
                {u.bio && (
                  <p className="text-xs text-slate-300 leading-relaxed mb-3 line-clamp-2">
                    {u.bio}
                  </p>
                )}

                {/* Skills Tags */}
                {skills.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500">
                      <Code2 className="w-3 h-3" />
                      Skills & Superpowers
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-950 border border-slate-800/80 rounded-md text-[11px] font-mono text-indigo-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-800/60 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}</span>
                <span className="text-slate-600 font-mono">ID #{member.user_id}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
