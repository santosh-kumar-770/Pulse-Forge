import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Pin,
  Link2,
  KeyRound,
  FileText,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Trash2,
  Star,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import { useRoom } from '../context/RoomContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../api/tasks';
import { importantApi } from '../api/important';
import { fireConfetti } from '../components/ui/Confetti';
import { formatDistanceToNow } from 'date-fns';

const PRIORITY_STYLES = {
  urgent: 'bg-rose-500/15 border-rose-500/40 text-rose-300 font-bold',
  high: 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold',
  medium: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 font-medium',
  low: 'bg-slate-800 border-slate-700 text-slate-400',
};

const STATUS_COLUMNS = [
  { id: 'backlog', label: 'Backlog', color: 'border-slate-800', dot: 'bg-slate-500' },
  { id: 'in_progress', label: 'In Progress', color: 'border-indigo-500/40', dot: 'bg-indigo-400' },
  { id: 'review', label: 'Review', color: 'border-amber-500/40', dot: 'bg-amber-400' },
  { id: 'done', label: 'Done', color: 'border-emerald-500/40', dot: 'bg-emerald-400' },
];

export default function MissionBoardView({ onOpenTaskModal, onOpenImportantModal }) {
  const { activeRoomId, activeRoom } = useRoom();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [mobileColumn, setMobileColumn] = useState('backlog');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // 1. Fetch Tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', activeRoomId, priorityFilter, search],
    queryFn: () => tasksApi.listTasks(activeRoomId, { priority: priorityFilter || undefined, search: search || undefined }),
    enabled: !!activeRoomId,
  });

  // 2. Fetch Important Notes
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['important', activeRoomId],
    queryFn: () => importantApi.listNotes(activeRoomId),
    enabled: !!activeRoomId,
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }) => tasksApi.updateTaskStatus(activeRoomId, taskId, status),
    onSuccess: (updatedTask) => {
      if (updatedTask.status === 'done') {
        fireConfetti({ spread: 45 });
      }
      queryClient.invalidateQueries({ queryKey: ['tasks', activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ['timeline', activeRoomId] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => tasksApi.deleteTask(activeRoomId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ['timeline', activeRoomId] });
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: (noteId) => importantApi.togglePin(activeRoomId, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['important', activeRoomId] });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId) => importantApi.deleteNote(activeRoomId, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['important', activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ['timeline', activeRoomId] });
    },
  });

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Group tasks by status for Kanban
  const tasksByStatus = {
    backlog: tasks.filter((t) => t.status === 'backlog'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    review: tasks.filter((t) => t.status === 'review'),
    done: tasks.filter((t) => t.status === 'done'),
  };

  const urgentCount = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done').length;

  const renderTaskColumn = (col) => {
    const colTasks = tasksByStatus[col.id] || [];
    return (
      <div
        key={col.id}
        className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-3 sm:p-3.5 min-h-[350px] sm:min-h-[400px] flex flex-col"
      >
        {/* Column Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${col.dot}`} />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {col.label}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-bold text-slate-400">
            {colTasks.length}
          </span>
        </div>

        {/* Tasks List in Column */}
        <div className="space-y-2.5 flex-1">
          {colTasks.length === 0 ? (
            <div className="h-32 border border-dashed border-slate-800/60 rounded-xl flex items-center justify-center text-xs text-slate-500">
              No tasks in {col.label}
            </div>
          ) : (
            colTasks.map((task) => (
              <div
                key={task.id}
                className="group p-3 sm:p-3.5 bg-slate-900 border border-slate-800/90 rounded-xl hover:border-slate-700 transition-all shadow-sm"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] uppercase border tracking-wider ${
                      PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium
                    }`}
                  >
                    {task.priority}
                  </span>
                  <button
                    onClick={() => deleteTaskMutation.mutate(task.id)}
                    aria-label="Delete task"
                    className="p-1 -mr-1 text-slate-500 hover:text-rose-400 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition active:scale-95 rounded-lg"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h4 className="text-xs font-bold text-slate-100 leading-snug mb-1">
                  {task.title}
                </h4>

                {task.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                    {task.description}
                  </p>
                )}

                {/* Footer: Assignee + Status progression button */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-2 gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {task.assigned_user ? (
                      <div className="flex items-center gap-1.5 truncate">
                        <img
                          src={task.assigned_user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'}
                          alt={task.assigned_user.name}
                          title={task.assigned_user.name}
                          className="w-5 h-5 rounded-md object-cover border border-slate-700 shrink-0"
                        />
                        <span className="text-[11px] text-slate-400 truncate hidden xs:inline">
                          {task.assigned_user.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">Unassigned</span>
                    )}
                  </div>

                  {/* Status quick progression */}
                  <div className="flex items-center gap-1 shrink-0">
                    {col.id === 'backlog' && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ taskId: task.id, status: 'in_progress' })}
                        className="px-2.5 py-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 rounded-lg text-[11px] font-semibold transition active:scale-95"
                      >
                        Start &rarr;
                      </button>
                    )}
                    {col.id === 'in_progress' && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ taskId: task.id, status: 'review' })}
                        className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded-lg text-[11px] font-semibold transition active:scale-95"
                      >
                        Review &rarr;
                      </button>
                    )}
                    {col.id === 'review' && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ taskId: task.id, status: 'done' })}
                        className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded-lg text-[11px] font-bold transition active:scale-95 flex items-center gap-1"
                      >
                        Done ✓
                      </button>
                    )}
                    {col.id === 'done' && (
                      <span className="text-[11px] font-bold text-emerald-400 px-1 py-0.5">
                        ✓ Shipped
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in">
      {/* Top Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
              Mission Board
            </h1>
            {urgentCount > 0 && (
              <span className="px-2 py-0.5 bg-rose-500/15 border border-rose-500/40 text-rose-300 rounded-full text-xs font-bold animate-pulse">
                {urgentCount} Urgent
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Real-time war-room task progression and pinned team assets
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onOpenImportantModal}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-amber-300 hover:text-amber-200 transition shadow-sm active:scale-95 min-h-[42px]"
          >
            <Pin className="w-3.5 h-3.5" />
            <span>Pin to Vault</span>
          </button>
          <button
            onClick={onOpenTaskModal}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30 active:scale-95 min-h-[42px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: IMPORTANT STUFF (KNOWLEDGE VAULT) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
            <Pin className="w-4 h-4 text-amber-400" />
            <span>Pinned Knowledge Vault ({notes.length})</span>
          </div>
        </div>

        {notes.length === 0 ? (
          <div className="p-6 sm:p-8 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 text-center">
            <p className="text-sm text-slate-400 font-medium">No pinned items yet.</p>
            <p className="text-xs text-slate-500 mt-1">Pin your submission URL, Figma link, and API secrets for quick team access.</p>
            <button
              onClick={onOpenImportantModal}
              className="mt-3 px-3.5 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-semibold hover:bg-amber-500/20 active:scale-95 transition"
            >
              + Pin First Item
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {notes.map((note) => {
              const isCopied = copiedId === note.id;
              return (
                <div
                  key={note.id}
                  className={`relative p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    note.is_pinned
                      ? 'bg-slate-900/90 border-amber-500/30 shadow-lg shadow-amber-500/5'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                          {note.content_type === 'link' ? (
                            <Link2 className="w-4 h-4" />
                          ) : note.content_type === 'snippet' ? (
                            <KeyRound className="w-4 h-4" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-slate-200 truncate" title={note.title}>
                          {note.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => togglePinMutation.mutate(note.id)}
                          aria-label={note.is_pinned ? 'Unpin' : 'Pin to top'}
                          className={`p-1.5 rounded-lg transition active:scale-95 ${
                            note.is_pinned ? 'text-amber-400 hover:text-amber-300' : 'text-slate-500 hover:text-slate-300'
                          }`}
                          title={note.is_pinned ? 'Unpin' : 'Pin to top'}
                        >
                          <Star className={`w-3.5 h-3.5 ${note.is_pinned ? 'fill-amber-400' : ''}`} />
                        </button>
                        <button
                          onClick={() => deleteNoteMutation.mutate(note.id)}
                          aria-label="Delete note"
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition active:scale-95"
                          title="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Content Preview */}
                    <div className="my-2">
                      {note.content_type === 'snippet' ? (
                        <pre className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-24 whitespace-pre-wrap break-all selection:bg-amber-500/30">
                          {note.content}
                        </pre>
                      ) : note.content_type === 'link' ? (
                        <a
                          href={note.content.startsWith('http') ? note.content : `https://${note.content}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 p-2 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-indigo-300 hover:text-indigo-200 hover:underline break-all"
                        >
                          <span className="truncate flex-1">{note.content}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-1" />
                        </a>
                      ) : (
                        <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed whitespace-pre-line bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60 break-words">
                          {note.content}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 mt-2">
                    <span className="truncate mr-2">
                      {note.created_at ? formatDistanceToNow(new Date(note.created_at), { addSuffix: true }) : ''}
                    </span>
                    <button
                      onClick={() => handleCopy(note.id, note.content)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition font-medium text-xs active:scale-95 shrink-0"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: TASKS KANBAN / LIST */}
      <section className="space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 ${
                  viewMode === 'kanban'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                List View
              </button>
            </div>

            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 shrink-0">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full sm:w-auto px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Priorities</option>
              <option value="urgent">🔴 Urgent</option>
              <option value="high">🟠 High</option>
              <option value="medium">🟣 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
          </div>
        </div>

        {/* Mobile Column Tabs (Only when viewMode is 'kanban' and on mobile) */}
        {viewMode === 'kanban' && (
          <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {STATUS_COLUMNS.map((col) => {
              const count = tasksByStatus[col.id]?.length || 0;
              const isSelected = mobileColumn === col.id;
              return (
                <button
                  key={col.id}
                  onClick={() => setMobileColumn(col.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span>{col.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Kanban Board View */}
        {viewMode === 'kanban' ? (
          <>
            {/* Desktop / Tablet Grid (>= md) */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
              {STATUS_COLUMNS.map((col) => renderTaskColumn(col))}
            </div>

            {/* Mobile View (< md): Renders currently active column */}
            <div className="md:hidden">
              {STATUS_COLUMNS.filter((col) => col.id === mobileColumn).map((col) =>
                renderTaskColumn(col)
              )}
            </div>
          </>
        ) : (
          /* List View (Responsive) */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
            {tasks.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No tasks match your criteria.
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
                    <select
                      value={task.status}
                      onChange={(e) => updateStatusMutation.mutate({ taskId: task.id, status: e.target.value })}
                      className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 shrink-0"
                    >
                      <option value="backlog">Backlog</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase border tracking-wider shrink-0 ${
                        PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium
                      }`}
                    >
                      {task.priority}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-100 truncate">{task.title}</div>
                      {task.description && (
                        <div className="text-[11px] text-slate-400 truncate">{task.description}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-0 border-slate-800/60">
                    {task.assigned_user ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <img
                          src={task.assigned_user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'}
                          alt={task.assigned_user.name}
                          className="w-5 h-5 rounded-md object-cover"
                        />
                        <span className="text-xs">{task.assigned_user.name}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">Unassigned</span>
                    )}

                    <button
                      onClick={() => deleteTaskMutation.mutate(task.id)}
                      aria-label="Delete task"
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}
