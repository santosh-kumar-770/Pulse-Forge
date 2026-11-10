import React, { useState } from 'react';
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
  UserCheck,
  UserMinus,
  LogOut,
  AlertTriangle,
  X,
  Trash2
} from 'lucide-react';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomsApi } from '../api/rooms';

const ROLE_BADGES = {
  owner: { label: 'Owner', icon: Crown, style: 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300' },
  admin: { label: 'Admin', icon: Shield, style: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300' },
  member: { label: 'Member', icon: User, style: 'bg-slate-800 border-slate-700 text-slate-300' },
};

export default function MembersView({ onOpenAddMemberModal, onOpenRoomSettings }) {
  const { activeRoomId, activeRoom, myRole, leaveActiveRoom, refreshRooms } = useRoom();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Dialog States
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members', activeRoomId],
    queryFn: () => roomsApi.listMembers(activeRoomId),
    enabled: !!activeRoomId,
  });

  const canManage = myRole === 'owner' || myRole === 'admin';
  const isOwner = myRole === 'owner' || activeRoom?.created_by === user?.id;
  const pendingCount = activeRoom?.pending_request_count || 0;

  // Handle Remove Member (Host action)
  const handleConfirmRemove = async () => {
    if (!memberToRemove || !activeRoomId) return;
    try {
      setIsRemoving(true);
      setActionError('');
      await roomsApi.removeMember(activeRoomId, memberToRemove.user_id);
      await queryClient.invalidateQueries({ queryKey: ['members', activeRoomId] });
      await queryClient.invalidateQueries({ queryKey: ['room', activeRoomId] });
      await queryClient.invalidateQueries({ queryKey: ['rooms'] });
      await refreshRooms(activeRoomId);
      setMemberToRemove(null);
    } catch (err) {
      setActionError(err.message || 'Failed to remove member');
    } finally {
      setIsRemoving(false);
    }
  };

  // Handle Voluntary Leave Room
  const handleConfirmLeave = async () => {
    if (!activeRoomId) return;
    try {
      setIsLeaving(true);
      setActionError('');
      await leaveActiveRoom(activeRoomId);
      setShowLeaveModal(false);
    } catch (err) {
      setActionError(err.message || 'Failed to leave room');
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
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

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          {canManage && (
            <>
              <button
                onClick={onOpenRoomSettings}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-semibold transition shadow-sm active:scale-95 min-h-[42px]"
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Room Settings</span>
                {pendingCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                onClick={onOpenAddMemberModal}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30 active:scale-95 min-h-[42px]"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Teammate</span>
              </button>
            </>
          )}

          {/* Leave Room Button */}
          {!isOwner ? (
            <button
              onClick={() => setShowLeaveModal(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 min-h-[42px]"
              title="Leave this war room"
            >
              <LogOut className="w-4 h-4" />
              <span>Leave Room</span>
            </button>
          ) : (
            <div
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-[11px] text-slate-500 font-mono bg-slate-900/50 rounded-xl border border-slate-800"
              title="Owners must transfer ownership or delete the room"
            >
              <Crown className="w-3.5 h-3.5 text-yellow-500" />
              <span>Host (Owner)</span>
            </div>
          )}
        </div>
      </div>

      {/* Global Error Banner */}
      {actionError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')} className="p-1 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Pending Join Requests Banner (if Host) */}
      {canManage && pendingCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/20 text-amber-300 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-200">
                {pendingCount} Candidate {pendingCount === 1 ? 'is' : 'are'} waiting for your approval!
              </h4>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Hackers have submitted join requests to enter this sprint. Review and accept candidates.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenRoomSettings}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow active:scale-95 shrink-0 text-center"
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
          const isCurrentUser = member.user_id === user?.id;
          const canKickThisMember = isOwner && !isCurrentUser && member.role !== 'owner';

          return (
            <div
              key={member.id}
              className="p-4 sm:p-5 bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl transition-all shadow-sm flex flex-col justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <img
                  src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.name || 'hacker'}`}
                  alt={u.name}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover bg-slate-800 border border-slate-700/80 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <h3 className="text-sm font-bold text-slate-100 truncate">
                        {u.name}
                      </h3>
                      {isCurrentUser && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shrink-0 ${badge.style}`}>
                        <BadgeIcon className="w-3 h-3" />
                        {badge.label}
                      </span>

                      {/* Host Remove / Kick Button */}
                      {canKickThisMember && (
                        <button
                          onClick={() => setMemberToRemove({ id: member.id, user_id: member.user_id, name: u.name })}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition active:scale-95"
                          title={`Remove ${u.name} from room`}
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-indigo-400 font-mono mt-0.5">
                    {u.role_title || 'Hacker'}
                  </p>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                    <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{u.email}</span>
                  </div>

                  {u.bio && (
                    <p className="text-xs text-slate-300 italic mt-2 line-clamp-2 leading-relaxed break-words">
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

      {/* MODAL 1: Confirm Remove Member */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-100">
                  Remove Teammate
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Are you sure you want to remove <span className="text-white font-semibold">{memberToRemove.name}</span> from this war room?
                </p>
                <div className="mt-2 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  ⚠️ They will lose access immediately. Any active tasks assigned to them will be marked unassigned. Historical chat messages remain intact.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                disabled={isRemoving}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={isRemoving}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
              >
                <UserMinus className="w-3.5 h-3.5" />
                <span>{isRemoving ? 'Removing...' : 'Remove Member'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Confirm Voluntary Leave Room */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-100">
                  Leave War Room
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Are you sure you want to leave <span className="text-white font-semibold">{activeRoom?.name}</span>?
                </p>
                <div className="mt-2 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  You will need to request access or receive an invite to rejoin. Any active tasks assigned to you will be unassigned.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                disabled={isLeaving}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Stay in Room
              </button>
              <button
                type="button"
                onClick={handleConfirmLeave}
                disabled={isLeaving}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isLeaving ? 'Leaving...' : 'Yes, Leave Room'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
