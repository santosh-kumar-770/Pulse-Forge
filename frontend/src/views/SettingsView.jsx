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
  UserCheck
} from 'lucide-react';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { roomsApi } from '../api/rooms';

export default function SettingsView({ onOpenProfileModal, onOpenRoomSettings }) {
  const { activeRoom, myRole, refreshRooms } = useRoom();
  const { user } = useAuth();

  const [name, setName] = useState(activeRoom?.name || '');
  const [missionStatement, setMissionStatement] = useState(activeRoom?.mission_statement || '');
  const [isPrivate, setIsPrivate] = useState(Boolean(activeRoom?.is_private));
  const [requiresApproval, setRequiresApproval] = useState(activeRoom?.requires_approval !== false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
          <Check className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: ROOM DETAILS & PRIVACY */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">War Room Configuration</h2>
              <p className="text-xs text-slate-400">Settings for {activeRoom?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                type="button"
                onClick={onOpenRoomSettings}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                Join Requests
                {activeRoom?.pending_request_count > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                    {activeRoom.pending_request_count}
                  </span>
                )}
              </button>
            )}

            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-800 text-indigo-400 border border-slate-700">
              Role: {myRole}
            </span>
          </div>
        </div>

        {/* Invite Code Bar */}
        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Shareable Room Code / Slug
            </div>
            <div className="text-sm font-mono font-bold text-indigo-300 mt-0.5">
              {activeRoom?.slug}
            </div>
          </div>
          <button
            onClick={handleCopySlug}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {isCopied ? 'Copied' : 'Copy Code'}
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
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 disabled:opacity-60 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">North Star Mission Statement</label>
            <textarea
              rows={3}
              disabled={!canEdit}
              value={missionStatement}
              onChange={(e) => setMissionStatement(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 disabled:opacity-60 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Privacy & Approval Controls */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {isPrivate ? <Lock className="w-4 h-4 text-amber-400" /> : <Globe className="w-4 h-4 text-emerald-400" />}
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    {isPrivate ? 'Private Room' : 'Public Room'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {isPrivate ? 'Hidden from directory, accessible via invite link only' : 'Discoverable in open directory'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => setIsPrivate(!isPrivate)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                  isPrivate ? 'bg-amber-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isPrivate ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="border-t border-slate-800/60 pt-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-indigo-400" />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Require Host Approval to Join
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {requiresApproval ? 'Hosts inspect & approve candidates' : 'Members join directly without approval'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => setRequiresApproval(!requiresApproval)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                  requiresApproval ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    requiresApproval ? 'translate-x-4' : 'translate-x-0'
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
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Saving...' : 'Save Workspace Changes'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* SECTION 2: PROFILE SHORTCUT */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt={user?.name}
            className="w-12 h-12 rounded-2xl object-cover border border-slate-700"
          />
          <div>
            <h3 className="text-sm font-bold text-slate-100">{user?.name}</h3>
            <p className="text-xs text-indigo-400">{user?.role_title || 'Hacker'}</p>
            <p className="text-[11px] text-slate-500">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={onOpenProfileModal}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
        >
          Edit Profile & Skills
        </button>
      </div>
    </div>
  );
}
