import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  X,
  Pin,
  Clock,
  Trophy,
  Users,
  Settings,
  Target,
  Shield,
  Compass,
  Lock,
  Globe,
  Plus,
  Layers,
  MessageSquare,
  LogOut,
  User,
  ChevronDown
} from 'lucide-react';
import { useRoom } from '../../context/RoomContext';
import { useAuth } from '../../context/AuthContext';

export default function MobileNavDrawer({
  isOpen,
  onClose,
  onToggleChat,
  onOpenRoomSettings,
  onOpenDiscoverRooms,
  onOpenNewRoomModal,
  onOpenJoinRoomModal,
  onOpenProfileModal
}) {
  const { user, logout } = useAuth();
  const { rooms, activeRoom, switchRoom, myRole } = useRoom();
  const [showRoomSwitcher, setShowRoomSwitcher] = useState(false);

  const isOwnerOrAdmin = ['owner', 'admin'].includes(myRole);

  const navItems = [
    {
      to: '/',
      label: 'Mission Board',
      sub: 'Tasks & Knowledge Vault',
      icon: Pin,
      color: 'text-indigo-400',
    },
    {
      to: '/timeline',
      label: 'Timeline & Milestones',
      sub: 'Roadmap & Audit Log',
      icon: Clock,
      color: 'text-violet-400',
    },
    {
      to: '/achievements',
      label: 'Trophy Case',
      sub: 'Victories & Hall of Fame',
      icon: Trophy,
      color: 'text-yellow-400',
    },
    {
      to: '/members',
      label: 'Team & Roles',
      sub: `${activeRoom?.name || 'Sprint'} Members`,
      icon: Users,
      color: 'text-emerald-400',
    },
    {
      to: '/settings',
      label: 'Settings',
      sub: 'Room & Profile Config',
      icon: Settings,
      color: 'text-slate-400',
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Slide-over Sheet */}
      <div className="relative w-4/5 max-w-xs h-full bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col z-10 overflow-y-auto">
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-lg text-white">
              <Target className="w-4 h-4" />
            </div>
            <span className="text-sm font-extrabold tracking-tight text-white">
              PulseForge
            </span>
            <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded">
              WAR ROOM
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 -mr-1 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 active:scale-95 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-5 flex-1">
          {/* Active Room Card */}
          {activeRoom && (
            <div className="p-3 bg-gradient-to-br from-indigo-950/50 to-slate-900 border border-indigo-500/30 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  Active Sprint
                </span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                  activeRoom.is_private
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                }`}>
                  {activeRoom.is_private ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                  {activeRoom.is_private ? 'Private' : 'Public'}
                </span>
              </div>

              <div className="font-bold text-sm text-slate-100 truncate">
                {activeRoom.name}
              </div>

              {activeRoom.mission_statement && (
                <p className="text-xs text-slate-300 italic line-clamp-2 leading-relaxed">
                  "{activeRoom.mission_statement}"
                </p>
              )}

              {/* Room Switcher Toggle Button */}
              <button
                onClick={() => setShowRoomSwitcher(!showRoomSwitcher)}
                className="w-full mt-2 py-1.5 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold border border-slate-700/60 transition flex items-center justify-between active:scale-98"
              >
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Switch Room ({rooms.length})
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showRoomSwitcher ? 'rotate-180' : ''}`} />
              </button>

              {/* Collapsible Room Switcher List */}
              {showRoomSwitcher && (
                <div className="pt-2 space-y-1 max-h-40 overflow-y-auto">
                  {rooms.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        switchRoom(r);
                        setShowRoomSwitcher(false);
                        onClose();
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs truncate flex items-center justify-between transition ${
                        r.id === activeRoom?.id
                          ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/40'
                          : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="truncate">{r.name}</span>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-1">
                        {r.my_role || 'member'}
                      </span>
                    </button>
                  ))}

                  <div className="pt-2 grid grid-cols-2 gap-1.5 border-t border-slate-800">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenNewRoomModal();
                      }}
                      className="py-1.5 px-2 bg-indigo-600 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Plus className="w-3 h-3" /> New
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenJoinRoomModal();
                      }}
                      className="py-1.5 px-2 bg-slate-800 text-slate-300 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Layers className="w-3 h-3" /> Code
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1">
            <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Views
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition active:scale-98 ${
                      isActive
                        ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-200 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
                    }`
                  }
                >
                  <Icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                  <div className="flex-1 truncate">
                    <div className="truncate">{item.label}</div>
                    <div className="text-[10px] font-normal text-slate-500 truncate">{item.sub}</div>
                  </div>
                </NavLink>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              War-Room Tools
            </div>

            <button
              onClick={() => {
                onClose();
                onToggleChat();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-950/60 border border-slate-800 active:scale-98 transition text-left"
            >
              <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="flex-1 truncate">
                <div className="truncate flex items-center gap-1.5">
                  <span>War-Room Team Chat</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-[10px] text-slate-500">Real-time team chat</div>
              </div>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenDiscoverRooms();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-950/40 border border-slate-800/80 active:scale-98 transition text-left"
            >
              <Compass className="w-4 h-4 text-violet-400 shrink-0" />
              <span>Explore Public Rooms</span>
            </button>

            {isOwnerOrAdmin && (
              <button
                onClick={() => {
                  onClose();
                  onOpenRoomSettings();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/30 active:scale-98 transition text-left"
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                  Privacy & Host Approval
                </span>
                {activeRoom?.pending_request_count > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] flex items-center justify-center">
                    {activeRoom.pending_request_count}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 space-y-2">
          <div
            onClick={() => {
              onClose();
              onOpenProfileModal();
            }}
            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-800/80 cursor-pointer transition active:scale-98"
          >
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={user?.name}
              className="w-8 h-8 rounded-lg object-cover border border-indigo-500/50 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-200 truncate">{user?.name}</div>
              <div className="text-[10px] text-indigo-400 truncate">{user?.role_title || 'Hacker'}</div>
            </div>
            <User className="w-4 h-4 text-slate-400 shrink-0" />
          </div>

          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 active:scale-98 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
