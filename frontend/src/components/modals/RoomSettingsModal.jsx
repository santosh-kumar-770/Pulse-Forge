import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Users,
  Lock,
  Globe,
  UserCheck,
  UserX,
  CheckCircle2,
  Clock,
  Sparkles,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomsApi } from '../../api/rooms';
import { useRoom } from '../../context/RoomContext';
import { formatDistanceToNow } from 'date-fns';

export default function RoomSettingsModal({ isOpen, onClose }) {
  const { activeRoom, activeRoomId, myRole, refreshRooms } = useRoom();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'requests'
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [missionStatement, setMissionStatement] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(true);

  useEffect(() => {
    if (activeRoom) {
      setName(activeRoom.name || '');
      setMissionStatement(activeRoom.mission_statement || '');
      setIsPrivate(Boolean(activeRoom.is_private));
      setRequiresApproval(activeRoom.requires_approval !== false);
    }
  }, [activeRoom]);

  // Fetch Pending Join Requests
  const {
    data: pendingRequests = [],
    isLoading: isRequestsLoading,
    refetch: refetchRequests
  } = useQuery({
    queryKey: ['join-requests', activeRoomId],
    queryFn: () => roomsApi.listJoinRequests(activeRoomId),
    enabled: isOpen && Boolean(activeRoomId) && ['owner', 'admin'].includes(myRole),
  });

  // Mutation to update room settings
  const updateSettingsMutation = useMutation({
    mutationFn: (data) => roomsApi.updateRoomSettings(activeRoomId, data),
    onSuccess: (updatedRoom) => {
      queryClient.invalidateQueries({ queryKey: ['room', activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      refreshRooms(activeRoomId);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  // Mutation to review join request
  const reviewMutation = useMutation({
    mutationFn: ({ requestId, action }) =>
      roomsApi.reviewJoinRequest(activeRoomId, requestId, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['join-requests', activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ['room', activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ['members', activeRoomId] });
      refetchRequests();
      refreshRooms(activeRoomId);
    },
  });

  if (!isOpen || !activeRoom) return null;

  const handleSave = (e) => {
    e.preventDefault();
    updateSettingsMutation.mutate({
      name,
      mission_statement: missionStatement,
      is_private: isPrivate,
      requires_approval: requiresApproval,
    });
  };

  const copyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/join/${activeRoom.slug}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center gap-2.5 pr-6">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-100 flex items-center gap-2">
                Room Privacy & Host Settings
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Configure visibility, join approvals, and review candidate applications
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 sm:pt-4 border-b border-slate-800/60 bg-slate-900/50">
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 active:scale-95 ${
              activeTab === 'settings'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Privacy & Settings</span>
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 relative active:scale-95 ${
              activeTab === 'requests'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Pending Requests</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'settings' ? (
            <form onSubmit={handleSave} className="space-y-5 sm:space-y-6">
              {saveSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Workspace privacy and host approval settings saved successfully!</span>
                </div>
              )}

              {/* Room Name & Mission */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    War Room Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-base sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Sprint Mission Statement
                  </label>
                  <textarea
                    rows={2}
                    value={missionStatement}
                    onChange={(e) => setMissionStatement(e.target.value)}
                    placeholder="What is this war room shipping?"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-base sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none"
                  />
                </div>
              </div>

              {/* Privacy Toggle Card */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-4">
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                    <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${isPrivate ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {isPrivate ? <Lock className="w-4 h-4 sm:w-5 sm:h-5" /> : <Globe className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold text-slate-200">
                        {isPrivate ? 'Private War Room' : 'Public Workspace'}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-relaxed">
                        {isPrivate
                          ? 'Hidden from open directory. Only users with direct invite link/code can view or request access.'
                          : 'Visible to all hackers on PulseForge via the Public Rooms explorer.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none active:scale-95 ${
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

                <div className="border-t border-slate-800/60 pt-4 flex items-start justify-between gap-3 sm:gap-4">
                  <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                    <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${requiresApproval ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                      <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold text-slate-200">
                        Require Host Approval
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-relaxed">
                        {requiresApproval
                          ? 'New members must submit a join request. Owner or admins must approve before they access tasks, timeline, or chat.'
                          : 'Anyone with access can join immediately as an active team member.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setRequiresApproval(!requiresApproval)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none active:scale-95 ${
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

              {/* Shareable Invite Code */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-indigo-950/20 border border-indigo-900/30 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-semibold block">
                    Invite Link & Room Code
                  </span>
                  <p className="text-xs font-mono text-slate-300 mt-0.5 truncate">
                    /join/{activeRoom.slug}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyInviteLink}
                  className="px-3 py-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-medium border border-indigo-500/30 flex items-center gap-1.5 transition active:scale-95 shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition active:scale-95 text-center min-h-[42px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateSettingsMutation.isPending}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 min-h-[42px]"
                >
                  {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          ) : (
            /* Pending Join Requests Tab */
            <div className="space-y-4">
              {isRequestsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">Loading pending requests...</span>
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-2xl">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-500 mb-3">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-300">No Pending Join Requests</h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    When hackers request to enter this war room, their profile and skillsets will appear here for your review.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 sm:p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <img
                          src={req.user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${req.user?.name}`}
                          alt={req.user?.name}
                          className="w-10 h-10 rounded-xl bg-slate-800 object-cover border border-slate-700 shrink-0 mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-100 truncate">
                              {req.user?.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                              {req.user?.role_title || 'Hacker'}
                            </span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {req.created_at ? formatDistanceToNow(new Date(req.created_at), { addSuffix: true }) : 'Just now'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-400 mt-1 break-words">
                            {req.message || req.user?.bio || 'Requested to join the sprint.'}
                          </p>

                          {/* Candidate Skills */}
                          {req.user?.skills && req.user.skills.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap mt-2">
                              {req.user.skills.map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60 font-mono"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Accept / Decline Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                        <button
                          type="button"
                          onClick={() => reviewMutation.mutate({ requestId: req.id, action: 'reject' })}
                          disabled={reviewMutation.isPending}
                          className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 min-h-[38px]"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => reviewMutation.mutate({ requestId: req.id, action: 'accept' })}
                          disabled={reviewMutation.isPending}
                          className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 min-h-[38px]"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
