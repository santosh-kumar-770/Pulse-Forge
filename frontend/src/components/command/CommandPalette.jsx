import React, { useState, useEffect } from 'react';
import { Search, CheckSquare, Pin, Trophy, Clock, Layers, User, X } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-950/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or jump to feature (or press Esc)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <button
            onClick={() => onClose(false)}
            className="p-1 text-slate-500 hover:text-slate-300 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of actions */}
        <div className="p-2 max-h-80 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No matching commands found.
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-800/80 transition-colors text-left group"
                >
                  <div className={`p-2 rounded-lg border border-slate-800/50 ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">
                      {item.label}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{item.desc}</div>
                  </div>
                  <span className="text-[10px] text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/50">
                    Jump
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500">
          <span>PulseForge Quick Action Hub</span>
          <div className="flex items-center gap-2">
            <span>Esc to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
