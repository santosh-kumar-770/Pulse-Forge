import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckSquare,
  Pin,
  Trophy,
  Clock,
  Layers,
  User,
  X,
  MessageSquare,
  Shield,
  Compass
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CommandPalette({
  isOpen,
  onClose,
  onOpenTaskModal,
  onOpenImportantModal,
  onOpenAchievementModal,
  onOpenTimelineModal,
  onOpenRoomModal,
  onOpenProfileModal,
  onOpenRoomSettings,
  onOpenDiscoverRooms,
  onToggleChat,
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        onClose(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'chat',
      label: 'Open War-Room Team Chat',
      desc: 'Toggle the real-time hacker communications drawer',
      icon: MessageSquare,
      color: 'text-indigo-400 bg-indigo-500/10',
      action: () => {
        onClose(false);
        onToggleChat();
      },
    },
    {
      id: 'discover',
      label: 'Explore Public War Rooms',
      desc: 'Discover and join active community hackathon sprints',
      icon: Compass,
      color: 'text-violet-400 bg-violet-500/10',
      action: () => {
        onClose(false);
        onOpenDiscoverRooms();
      },
    },
    {
      id: 'settings',
      label: 'Room Privacy & Join Requests',
      desc: 'Toggle public/private and review applicant requests',
      icon: Shield,
      color: 'text-amber-400 bg-amber-500/10',
      action: () => {
        onClose(false);
        onOpenRoomSettings();
      },
    },
    {
      id: 'task',
      label: 'Create New Task',
      desc: 'Add an actionable ticket to sprint backlog',
      icon: CheckSquare,
      color: 'text-indigo-400 bg-indigo-500/10',
      action: () => {
        onClose(false);
        onOpenTaskModal();
      },
    },
    {
      id: 'important',
      label: 'Pin Link or Secret',
      desc: 'Store URLs, keys, or endpoints in Knowledge Vault',
      icon: Pin,
      color: 'text-amber-400 bg-amber-500/10',
      action: () => {
        onClose(false);
        onOpenImportantModal();
      },
    },
    {
      id: 'achievement',
      label: 'Unlock Team Trophy',
      desc: 'Celebrate milestones with confetti in the Trophy Case',
      icon: Trophy,
      color: 'text-yellow-400 bg-yellow-500/10',
      action: () => {
        onClose(false);
        onOpenAchievementModal();
      },
    },
    {
      id: 'timeline',
      label: 'Schedule Checkpoint',
      desc: 'Set forward roadmap milestones and countdown alerts',
      icon: Clock,
      color: 'text-violet-400 bg-violet-500/10',
      action: () => {
        onClose(false);
        onOpenTimelineModal();
      },
    },
    {
      id: 'nav-timeline',
      label: 'View Timeline & Milestones',
      desc: 'Jump to forward countdowns and past changelog',
      icon: Clock,
      color: 'text-slate-400 bg-slate-800',
      action: () => {
        onClose(false);
        navigate('/timeline');
      },
    },
    {
      id: 'nav-achievements',
      label: 'View Hall of Fame',
      desc: 'Jump to team trophies and starred victories',
      icon: Trophy,
      color: 'text-slate-400 bg-slate-800',
      action: () => {
        onClose(false);
        navigate('/achievements');
      },
    },
    {
      id: 'room',
      label: 'Launch New War Room',
      desc: 'Create an isolated workspace for a new hackathon',
      icon: Layers,
      color: 'text-indigo-400 bg-indigo-500/10',
      action: () => {
        onClose(false);
        onOpenRoomModal();
      },
    },
    {
      id: 'profile',
      label: 'Edit Hacker Profile',
      desc: 'Update skills, avatar, and role',
      icon: User,
      color: 'text-slate-400 bg-slate-800',
      action: () => {
        onClose(false);
        onOpenProfileModal();
      },
    },
  ];

  const filtered = actions.filter(
    (a) =>
      a.label.toLowerCase().includes(query.toLowerCase()) ||
      a.desc.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-24 p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-3.5 sm:px-4 py-3 sm:py-3.5 border-b border-slate-800 bg-slate-950/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or jump to feature (or press Esc)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-base sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <button
            onClick={() => onClose(false)}
            aria-label="Close command palette"
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No matching commands or actions found.
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-slate-800/80 transition-colors group"
                >
                  <div className={`p-2 rounded-lg ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 truncate">
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {item.desc}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
