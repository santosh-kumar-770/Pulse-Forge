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

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Top Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenImportantModal}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-amber-300 hover:text-amber-200 transition-all shadow-sm"
          >
            <Pin className="w-3.5 h-3.5" />
            Pin to Vault
          </button>
          <button
            onClick={onOpenTaskModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* SECTION 1: IMPORTANT STUFF (KNOWLEDGE VAULT) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200 uppercase tracking-wider">
            <Pin className="w-4 h-4 text-amber-400" />
            <span>Pinned Knowledge Vault ({notes.length})</span>
          </div>
        </div>

        {notes.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 text-center">
            <p className="text-sm text-slate-400 font-medium">No pinned items yet.</p>
            <p className="text-xs text-slate-500 mt-1">Pin your submission URL, Figma link, and API secrets for quick team access.</p>
            <button
              onClick={onOpenImportantModal}
              className="mt-3 px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-semibold hover:bg-amber-500/20 transition-colors"
            >
              + Pin First Item
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {notes.map((note) => {
              const isCopied = copiedId === note.id;
              return (
                <div
                  key={note.id}
                  className={`relative p-4 rounded-2xl border transition-all ${
                    note.is_pinned
                      ? 'bg-slate-900/90 border-amber-500/30 shadow-lg shadow-amber-500/5'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
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
                        className={`p-1 rounded-md transition-colors ${
                          note.is_pinned ? 'text-amber-400 hover:text-amber-300' : 'text-slate-600 hover:text-slate-400'
                        }`}
                        title={note.is_pinned ? 'Unpin' : 'Pin to top'}
                      >
                        <Star className={`w-3.5 h-3.5 ${note.is_pinned ? 'fill-amber-400' : ''}`} />
                      </button>
                      <button
                        onClick={() => deleteNoteMutation.mutate(note.id)}
                        className="p-1 text-slate-600 hover:text-rose-400 rounded-md transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Content Preview */}
                  <div className="my-2.5">
                    {note.content_type === 'snippet' ? (
                      <pre className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-24 whitespace-pre-wrap break-all selection:bg-amber-500/30">
                        {note.content}
                      </pre>
                    ) : note.content_type === 'link' ? (
                      <a
                        href={note.content.startsWith('http') ? note.content : `https://${note.content}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 p-2 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-indigo-300 hover:text-indigo-200 hover:underline truncate"
                      >
                        <span className="truncate">{note.content}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ) : (
                      <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed whitespace-pre-line bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
                        {note.content}
                      </p>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
                    <span>
                      {note.created_at ? formatDistanceToNow(new Date(note.created_at), { addSuffix: true }) : ''}
                    </span>
                    <button
                      onClick={() => handleCopy(note.id, note.content)}
                      className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-medium text-xs"
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
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                List View
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Priorities</option>
              <option value="urgent">🔴 Urgent</option>
              <option value="high">🟠 High</option>
              <option value="medium">🟣 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
          </div>
        </div>

        {/* Kanban Board View */}
        {viewMode === 'kanban' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {STATUS_COLUMNS.map((col) => {
              const colTasks = tasksByStatus[col.id] || [];
              return (
                <div
                  key={col.id}
                  className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-3.5 min-h-[400px] flex flex-col"
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
                      <div className="h-32 border border-dashed border-slate-800/60 rounded-xl flex items-center justify-center text-xs text-slate-600">
                        No tasks in {col.label}
                      </div>
                    ) : (
                      colTasks.map((task) => (
                        <div
                          key={task.id}
                          className="group p-3.5 bg-slate-900 border border-slate-800/90 rounded-xl hover:border-slate-700 transition-all shadow-sm"
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
                              className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-2">
                            <div className="flex items-center gap-1.5">
                              {task.assigned_user ? (
                                <img
                                  src={task.assigned_user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'}
                                  alt={task.assigned_user.name}
                                  title={task.assigned_user.name}
                                  className="w-5 h-5 rounded-md object-cover border border-slate-700"
                                />
                              ) : (
                                <span className="text-[10px] text-slate-500 italic">Unassigned</span>
                              )}
                            </div>

                            {/* Status quick progression */}
                            <div className="flex items-center gap-1">
                              {col.id === 'backlog' && (
                                <button
                                  onClick={() => updateStatusMutation.mutate({ taskId: task.id, status: 'in_progress' })}
                                  className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded text-[10px] font-semibold transition-colors"
                                >
                                  Start &rarr;
                                </button>
                              )}
                              {col.id === 'in_progress' && (
                                <button
                                  onClick={() => updateStatusMutation.mutate({ taskId: task.id, status: 'review' })}
                                  className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded text-[10px] font-semibold transition-colors"
                                >
                                  Review &rarr;
                                </button>
                              )}
                              {col.id === 'review' && (
                                <button
                                  onClick={() => updateStatusMutation.mutate({ taskId: task.id, status: 'done' })}
                                  className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold transition-colors flex items-center gap-1"
                                >
                                  Done ✓
                                </button>
                              )}
                              {col.id === 'done' && (
                                <span className="text-[10px] font-bold text-emerald-400">
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
            })}
          </div>
        ) : (
          /* List View */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
            {tasks.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No tasks match your criteria.
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <select
                      value={task.status}
                      onChange={(e) => updateStatusMutation.mutate({ taskId: task.id, status: e.target.value })}
                      className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200"
                    >
                      <option value="backlog">Backlog</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase border tracking-wider ${
                        PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium
                      }`}
                    >
                      {task.priority}
                    </span>

                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-100 truncate">{task.title}</div>
                      {task.description && (
                        <div className="text-[11px] text-slate-400 truncate">{task.description}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {task.assigned_user && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <img
                          src={task.assigned_user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'}
                          alt={task.assigned_user.name}
                          className="w-5 h-5 rounded-md object-cover"
                        />
                        <span className="hidden sm:inline">{task.assigned_user.name}</span>
                      </div>
                    )}
                    <button
                      onClick={() => deleteTaskMutation.mutate(task.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
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
