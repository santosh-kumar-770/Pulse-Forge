import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Pin,
  Clock,
  MessageSquare,
  Trophy,
  Menu
} from 'lucide-react';

export default function BottomNav({ onToggleChat, isChatOpen, onOpenMenu }) {
  const location = useLocation();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-xl px-2 py-1.5 flex items-center justify-around safe-area-bottom shadow-2xl"
    >
      {/* 1. Tasks / Mission Board */}
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 active:scale-90 min-w-[56px] min-h-[48px] ${
            isActive
              ? 'text-indigo-400 font-bold bg-indigo-500/10'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`
        }
      >
        <Pin className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">Board</span>
      </NavLink>

      {/* 2. Timeline & Milestones */}
      <NavLink
        to="/timeline"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 active:scale-90 min-w-[56px] min-h-[48px] ${
            isActive
              ? 'text-violet-400 font-bold bg-violet-500/10'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`
        }
      >
        <Clock className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">Timeline</span>
      </NavLink>

      {/* 3. War-Room Team Chat Toggle */}
      <button
        onClick={onToggleChat}
        type="button"
        aria-label="Toggle War Room Chat"
        className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 active:scale-90 min-w-[56px] min-h-[48px] ${
          isChatOpen
            ? 'text-indigo-300 font-bold bg-indigo-600/20'
            : 'text-slate-400 hover:text-slate-200 font-medium'
        }`}
      >
        <div className="relative">
          <MessageSquare className="w-5 h-5 mb-0.5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <span className="text-[10px] tracking-tight">Chat</span>
      </button>

      {/* 4. Trophy Case */}
      <NavLink
        to="/achievements"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 active:scale-90 min-w-[56px] min-h-[48px] ${
            isActive
              ? 'text-yellow-400 font-bold bg-yellow-500/10'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`
        }
      >
        <Trophy className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">Trophies</span>
      </NavLink>

      {/* 5. More / Drawer Menu */}
      <button
        onClick={onOpenMenu}
        type="button"
        aria-label="Open Workspace Menu"
        className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-400 hover:text-slate-200 font-medium active:scale-90 transition-all duration-200 min-w-[56px] min-h-[48px]"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">More</span>
      </button>
    </nav>
  );
}
