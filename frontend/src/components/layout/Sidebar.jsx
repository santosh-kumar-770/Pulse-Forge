import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Pin,
  Clock,
  Trophy,
  Users,
  Settings,
  Sparkles,
  Zap,
  Target
} from 'lucide-react';
import { useRoom } from '../../context/RoomContext';

export default function Sidebar() {
  const { activeRoom } = useRoom();

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
      sub: 'Forward Gates & History',
      icon: Clock,
      color: 'text-violet-400',
    },
    {
      to: '/achievements',
      label: 'Trophy Case',
      sub: 'Hall of Fame & Stars',
      icon: Trophy,
      color: 'text-yellow-400',
    },
    {
      to: '/members',
      label: 'Room Members',
      sub: 'Roles & Skillsets',
      icon: Users,
      color: 'text-emerald-400',
    },
    {
      to: '/settings',
      label: 'Settings & Profile',
      sub: 'Workspace Configuration',
      icon: Settings,
      color: 'text-slate-400',
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800/80 bg-slate-950/50 flex flex-col justify-between p-4 hidden md:flex">
      <div className="space-y-6">
        {/* Mission Statement Card */}
        {activeRoom?.mission_statement && (
          <div className="p-3.5 bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border border-indigo-500/20 rounded-2xl">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1">
              <Target className="w-3.5 h-3.5" />
              North Star Mission
            </div>
            <p className="text-xs text-slate-300 italic line-clamp-3 leading-relaxed">
              "{activeRoom.mission_statement}"
            </p>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-200 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
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
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800/80">
        <div className="flex items-center gap-2 p-2.5 bg-slate-900/40 rounded-xl border border-slate-800/60">
          <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div className="text-[11px] text-slate-400">
            Velocity Engine: <span className="text-emerald-400 font-semibold">Active</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
