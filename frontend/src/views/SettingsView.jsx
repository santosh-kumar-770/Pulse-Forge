import React, { useState, useEffect } from 'react';
import {
  Settings,
  Layers,
  Copy,
  Check,
  User,
  Shield,
  Save,
  AlertCircle,
  Lock,
  Globe,
  UserCheck,
  LogOut,
  Crown
} from 'lucide-react';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { roomsApi } from '../api/rooms';

export default function SettingsView({ onOpenProfileModal, onOpenRoomSettings }) {
  const { activeRoom, myRole, refreshRooms, leaveActiveRoom } = useRoom();
  const { user } = useAuth();

  const [name, setName] = useState(activeRoom?.name || '');
  const [missionStatement, setMissionStatement] = useState(activeRoom?.mission_statement || '');
  const [isPrivate, setIsPrivate] = useState(Boolean(activeRoom?.is_private));
  const [requiresApproval, setRequiresApproval] = useState(activeRoom?.requires_approval !== false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeRoom) {
      setName(activeRoom.name || '');
      setMissionStatement(activeRoom.mission_statement || '');
      setIsPrivate(Boolean(activeRoom.is_private));
      setRequiresApproval(activeRoom.requires_approval !== false);
    }
  }, [activeRoom]);

  const canEdit = myRole === 'owner' || myRole === 'admin';

  const handleCopySlug = () => {
    if (activeRoom?.slug) {
      navigator.clipboard.writeText(activeRoom.slug);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    if (!canEdit) return;

    try {
      setIsSaving(true);
      setError('');
      setMessage('');
      await roomsApi.updateRoomSettings(activeRoom.id, {
        name: name.trim(),
        mission_statement: missionStatement.trim() || null,
        is_private: isPrivate,
        requires_approval: requiresApproval,
      });
      await refreshRooms(activeRoom.id);
      setMessage('War room settings updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update war room');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl pb-12 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
          Workspace Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Configure the active war room and manage your hacker profile
        </p>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: ROOM DETAILS & PRIVACY */}
      <div className="p-4 sm:p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-100 truncate">War Room Configuration</h2>
              <p className="text-xs text-slate-400 truncate">Settings for {activeRoom?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canEdit && (
              <button
                type="button"
                onClick={onOpenRoomSettings}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition active:scale-95"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Join Requests</span>
                {activeRoom?.pending_request_count > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                    {activeRoom.pending_request_count}
                  </span>
                )}
              </button>
            )}

            <span className="text-xs font-mono px-2.5 py-1.5 rounded-lg bg-slate-800 text-indigo-400 border border-slate-700">
              Role: {myRole}
            </span>
          </div>
        </div>

        {/* Invite Code Bar */}
        <div className="p-3 sm:p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Shareable Room Code / Slug
            </div>
            <div className="text-sm font-mono font-bold text-indigo-300 mt-0.5 truncate">
              {activeRoom?.slug}
            </div>
          </div>
          <button
            onClick={handleCopySlug}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition active:scale-95 shrink-0"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <form onSubmit={handleSaveRoom} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">War Room Name</label>
            <input
              type="text"
              disabled={!canEdit}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-sm text-slate-100 disabled:opacity-60 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">North Star Mission Statement</label>
            <textarea
              rows={3}
              disabled={!canEdit}
              value={missionStatement}
              onChange={(e) => setMissionStatement(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-sm text-slate-100 disabled:opacity-60 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Privacy & Approval Controls */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                <div className="mt-0.5 sm:mt-0 shrink-0">
                  {isPrivate ? <Lock className="w-4 h-4 text-amber-400" /> : <Globe className="w-4 h-4 text-emerald-400" />}
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    {isPrivate ? 'Private Room' : 'Public Room'}
                  </span>
                  <span className="text-[11px] text-slate-400 block leading-tight">
                    {isPrivate ? 'Hidden from directory, accessible via invite link only' : 'Discoverable in open directory'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => setIsPrivate(!isPrivate)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 active:scale-95 ${
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

            <div className="border-t border-slate-800/60 pt-3 flex items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                <div className="mt-0.5 sm:mt-0 shrink-0">
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Require Host Approval to Join
                  </span>
                  <span className="text-[11px] text-slate-400 block leading-tight">
                    {requiresApproval ? 'Hosts inspect & approve candidates' : 'Members join directly without approval'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => setRequiresApproval(!requiresApproval)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 active:scale-95 ${
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

          {canEdit && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Workspace Changes'}</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* SECTION 2: PROFILE SHORTCUT */}
      <div className="p-4 sm:p-6 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt={user?.name}
            className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shrink-0"
          />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-100 truncate">{user?.name}</h3>
            <p className="text-xs text-indigo-400 truncate">{user?.role_title || 'Hacker'}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={onOpenProfileModal}
          className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition active:scale-95 text-center"
        >
          Edit Profile & Skills
        </button>
      </div>

      {/* SECTION 3: MEMBERSHIP & DANGER ZONE */}
      <div className="p-4 sm:p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Room Membership</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Voluntarily leave this war room workspace
          </p>
        </div>

        {myRole === 'owner' || activeRoom?.created_by === user?.id ? (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300/90 flex items-start gap-2.5">
            <Crown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-200">Host / Owner Protection Active</p>
              <p className="mt-0.5 text-[11px] text-amber-300/80">
                You are the primary host of <span className="font-semibold">{activeRoom?.name}</span>. Owners cannot leave without transferring ownership to another teammate or archiving the room.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              <p className="text-xs font-semibold text-slate-200">Leave {activeRoom?.name}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Remove yourself from active contributors. Any assigned tasks will be unassigned.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowLeaveModal(true)}
              className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-xs font-bold rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Leave War Room</span>
            </button>
          </div>
        )}
      </div>

      {/* CONFIRM LEAVE MODAL */}
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
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setIsLeaving(true);
                    await leaveActiveRoom(activeRoom?.id);
                    setShowLeaveModal(false);
                  } catch (err) {
                    setError(err.message || 'Failed to leave room');
                  } finally {
                    setIsLeaving(false);
                  }
                }}
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
