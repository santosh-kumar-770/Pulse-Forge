import React, { useState } from 'react';
import {
  X,
  Compass,
  Users,
  Search,
  Sparkles,
  Lock,
  Globe,
  UserCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomsApi } from '../../api/rooms';
import { useRoom } from '../../context/RoomContext';

export default function DiscoverRoomsModal({ isOpen, onClose }) {
  const { switchRoom, refreshRooms } = useRoom();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [requestingRoomId, setRequestingRoomId] = useState(null);
  const [introMessage, setIntroMessage] = useState('');

  const {
    data: publicRooms = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['discover-rooms'],
    queryFn: () => roomsApi.discoverPublicRooms(),
    enabled: isOpen,
  });

  const joinMutation = useMutation({
    mutationFn: ({ roomId, message }) => roomsApi.requestJoinRoom(roomId, { message }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['discover-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      refetch();
      refreshRooms(variables.roomId);
      setRequestingRoomId(null);
      setIntroMessage('');
      if (data.status === 'joined') {
        switchRoom(variables.roomId);
        onClose();
      }
    },
  });

  if (!isOpen) return null;

  const filtered = publicRooms.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.mission_statement && r.mission_statement.toLowerCase().includes(search.toLowerCase()))
  );

  const handleJoinClick = (room) => {
    if (room.my_status === 'member') {
      switchRoom(room.id);
      onClose();
      return;
    }

    if (room.requires_approval) {
      setRequestingRoomId(room.id);
    } else {
      joinMutation.mutate({ roomId: room.id, message: '' });
    }
  };

  const submitJoinRequest = (e, roomId) => {
    e.preventDefault();
    joinMutation.mutate({ roomId, message: introMessage });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                Explore Public War Rooms
              </h2>
              <p className="text-xs text-slate-400">
                Discover active startup sprints and hackathon rooms across the community
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-slate-800/60 bg-slate-950/40">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search hackathons, startup sprints, or keywords..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono">Discovering public war rooms...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-2xl">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-500 mb-3">
                <Globe className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-300">No Public War Rooms Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                {search ? 'Try adjusting your search terms.' : 'Be the first to launch an open public war room!'}
              </p>
            </div>
          ) : (
            filtered.map((room) => {
              const isRequestingThis = requestingRoomId === room.id;

              return (
                <div
                  key={room.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-slate-100">
                          {room.name}
                        </h3>
                        {room.requires_approval ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            Approval Required
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                            <Globe className="w-2.5 h-2.5" />
                            Open Join
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-500" />
                          {room.member_count} {room.member_count === 1 ? 'member' : 'members'}
                        </span>
                      </div>

                      {room.mission_statement && (
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {room.mission_statement}
                        </p>
                      )}

                      <div className="text-[11px] text-slate-500 pt-1">
                        Host: <span className="text-slate-300 font-medium">{room.owner_name}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="shrink-0">
                      {room.my_status === 'member' ? (
                        <button
                          type="button"
                          onClick={() => handleJoinClick(room)}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Enter Room
                        </button>
                      ) : room.my_status === 'pending' ? (
                        <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-medium flex items-center gap-1.5 cursor-not-allowed">
                          <Clock className="w-3.5 h-3.5" />
                          Request Pending
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleJoinClick(room)}
                          disabled={joinMutation.isPending}
                          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
                        >
                          {room.requires_approval ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              Request Access
                            </>
                          ) : (
                            <>
                              <ArrowRight className="w-3.5 h-3.5" />
                              Join Now
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Message Prompt when Requesting Access */}
                  {isRequestingThis && (
                    <form
                      onSubmit={(e) => submitJoinRequest(e, room.id)}
                      className="mt-2 p-3 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-2 animate-fadeIn"
                    >
                      <label className="block text-[11px] font-medium text-indigo-300">
                        Include a note for the room host (optional):
                      </label>
                      <input
                        type="text"
                        value={introMessage}
                        onChange={(e) => setIntroMessage(e.target.value)}
                        placeholder="e.g. Full-stack hacker excited to help with Python & React!"
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                      />
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setRequestingRoomId(null)}
                          className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={joinMutation.isPending}
                          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                        >
                          <Send className="w-3 h-3" />
                          {joinMutation.isPending ? 'Submitting...' : 'Send Request'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
