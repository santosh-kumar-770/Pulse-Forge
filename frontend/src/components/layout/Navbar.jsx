import React, { useState, useEffect } from 'react';
import {
  Flame,
  ChevronDown,
  Plus,
  Clock,
  Command,
  User,
  LogOut,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useRoom } from '../../context/RoomContext';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { timelineApi } from '../../api/timeline';

export default function Navbar({
  onOpenCommandPalette,
  onOpenNewRoomModal,
  onOpenJoinRoomModal,
  onOpenProfileModal
}) {
  const { user, logout } = useAuth();
  const { rooms, activeRoom, switchRoom } = useRoom();

  const [isRoomDropdownOpen, setIsRoomDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Fetch upcoming checkpoints to calculate the live countdown
  const { data: timelineData } = useQuery({
    queryKey: ['timeline', activeRoom?.id],
    queryFn: () => timelineApi.getTimeline(activeRoom.id),
    enabled: !!activeRoom?.id,
    refetchInterval: 15000,
  });

  // Calculate next pending target deadline
  const nextMilestone = timelineData?.events?.find(e => e.status === 'pending');

  // Live ticking countdown
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, isPassed: false, label: '' });

  useEffect(() => {
    function updateCountdown() {
      if (!nextMilestone?.target_time) {
        setTimeLeft(null);
        return;
      }

      const target = new Date(nextMilestone.target_time).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isPassed: true, label: nextMilestone.event_name });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds, isPassed: false, label: nextMilestone.event_name });
      }
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextMilestone]);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <header className="sticky top-0 z-40 h-16 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Brand + Room Switcher */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="relative p-2 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl shadow-lg shadow-indigo-600/30 text-white">
            <Flame className="w-5 h-5 fill-white" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                PulseForge
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 rounded-md">
                WAR ROOM
              </span>
            </div>
          </div>
        </div>

        {/* Room Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsRoomDropdownOpen(!isRoomDropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-all text-left"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
            <div className="max-w-[140px] sm:max-w-[200px] truncate">
              <div className="text-xs font-bold text-slate-200 truncate">
                {activeRoom?.name || 'Select Room'}
              </div>
              <div className="text-[10px] font-mono text-slate-500 truncate">
                /{activeRoom?.slug || 'workspace'}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          </button>

          {isRoomDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in">
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-800/80 mb-1">
                Your Workspaces ({rooms.length})
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1">
                {rooms.map((room) => {
                  const isActive = room.id === activeRoom?.id;
                  return (
                    <button
                      key={room.id}
                      onClick={() => {
                        switchRoom(room);
                        setIsRoomDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors ${
                        isActive
                          ? 'bg-indigo-600/15 text-indigo-300 font-semibold border border-indigo-500/30'
                          : 'hover:bg-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <div className="truncate">{room.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">/{room.slug}</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                        {room.my_role || 'member'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-slate-800/80 mt-2 pt-2 grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    setIsRoomDropdownOpen(false);
                    onOpenNewRoomModal();
                  }}
                  className="flex items-center justify-center gap-1.5 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> New Room
                </button>
                <button
                  onClick={() => {
                    setIsRoomDropdownOpen(false);
                    onOpenJoinRoomModal();
                  }}
                  className="flex items-center justify-center gap-1.5 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" /> Join Code
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Live Hackathon Countdown Clock */}
      <div className="hidden md:flex items-center gap-3">
        {timeLeft ? (
          <div className="flex items-center gap-3 px-3.5 py-1.5 bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-inner">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${timeLeft.isPassed ? 'bg-rose-400' : 'bg-amber-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${timeLeft.isPassed ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
              </span>
              <span className="text-xs font-semibold text-slate-400 max-w-[130px] truncate" title={timeLeft.label}>
                {timeLeft.label}:
              </span>
            </div>

            {timeLeft.isPassed ? (
              <span className="text-xs font-bold text-rose-400 font-mono tracking-wider">
                DEADLINE REACHED
              </span>
            ) : (
              <div className="flex items-center gap-1 font-mono text-sm font-bold text-amber-300 tracking-wider">
                <span className="px-1.5 py-0.5 bg-slate-950 rounded-md border border-amber-500/20 shadow-sm">
                  {pad(timeLeft.hours)}h
                </span>
                <span>:</span>
                <span className="px-1.5 py-0.5 bg-slate-950 rounded-md border border-amber-500/20 shadow-sm">
                  {pad(timeLeft.minutes)}m
                </span>
                <span>:</span>
                <span className="px-1.5 py-0.5 bg-slate-950 rounded-md border border-amber-500/20 shadow-sm text-amber-400">
                  {pad(timeLeft.seconds)}s
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 border border-slate-800/60 rounded-xl text-xs text-slate-400">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>War Room Online</span>
          </div>
        )}
      </div>

      {/* Right: Quick Action Bar + User Pill */}
      <div className="flex items-center gap-3">
        {/* Command Palette Trigger Button */}
        <button
          onClick={() => onOpenCommandPalette(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition-colors shadow-sm"
          title="Command Palette (Cmd+K)"
        >
          <Command className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Actions</span>
          <kbd className="text-[10px] font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-500">
            ⌘K
          </kbd>
        </button>

        {/* User Pill Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-all"
          >
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={user?.name}
              className="w-7 h-7 rounded-lg object-cover border border-indigo-500/50"
            />
            <div className="hidden sm:block text-left max-w-[120px] truncate">
              <div className="text-xs font-bold text-slate-200 truncate">{user?.name}</div>
              <div className="text-[10px] text-indigo-400 truncate">{user?.role_title || 'Hacker'}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isUserDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in">
              <div className="p-2 border-b border-slate-800/80 mb-1">
                <div className="text-xs font-bold text-slate-200">{user?.name}</div>
                <div className="text-[11px] text-slate-500 font-mono truncate">{user?.email}</div>
              </div>

              <button
                onClick={() => {
                  setIsUserDropdownOpen(false);
                  onOpenProfileModal();
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors"
              >
                <User className="w-4 h-4 text-indigo-400" />
                Profile & Skills
              </button>

              <button
                onClick={() => {
                  setIsUserDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors mt-1"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
