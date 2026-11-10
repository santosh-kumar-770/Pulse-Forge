import React, { useState, useEffect } from 'react';
import { X, CheckSquare, AlertCircle, Edit3 } from 'lucide-react';
import { useRoom } from '../../context/RoomContext';
import { tasksApi } from '../../api/tasks';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { roomsApi } from '../../api/rooms';

export default function NewTaskModal({ isOpen, onClose, taskToEdit = null }) {
  const { activeRoomId } = useRoom();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('backlog');
  const [priority, setPriority] = useState('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Pre-populate fields if editing
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setStatus(taskToEdit.status || 'backlog');
      setPriority(taskToEdit.priority || 'medium');
      setAssignedTo(taskToEdit.assigned_to ? String(taskToEdit.assigned_to) : '');
      if (taskToEdit.due_date) {
        try {
          const d = new Date(taskToEdit.due_date);
          const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          setDueDate(localIso);
        } catch {
          setDueDate('');
        }
      } else {
        setDueDate('');
      }
    } else {
      setTitle('');
      setDescription('');
      setStatus('backlog');
      setPriority('medium');
      setAssignedTo('');
      setDueDate('');
    }
    setError('');
  }, [taskToEdit, isOpen]);

  // Fetch room members to populate assignee dropdown
  const { data: members = [] } = useQuery({
    queryKey: ['members', activeRoomId],
    queryFn: () => roomsApi.listMembers(activeRoomId),
    enabled: isOpen && !!activeRoomId,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      setError('');

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        assigned_to: assignedTo ? parseInt(assignedTo, 10) : null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      };

      if (taskToEdit) {
        await tasksApi.updateTask(activeRoomId, taskToEdit.id, payload);
      } else {
        await tasksApi.createTask(activeRoomId, payload);
      }

      queryClient.invalidateQueries({ queryKey: ['tasks', activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ['timeline', activeRoomId] });
      onClose();
    } catch (err) {
      setError(err.message || (taskToEdit ? 'Failed to update task' : 'Failed to create task'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg p-5 sm:p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 text-slate-400 hover:text-slate-100 rounded-xl hover:bg-slate-800 transition active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 pr-8">
          <div className="p-2 sm:p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400 shrink-0">
            {taskToEdit ? <Edit3 className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100">
              {taskToEdit ? 'Edit War-Room Task' : 'Create New Task'}
            </h2>
            <p className="text-xs text-slate-400">
              {taskToEdit ? 'Update details, assignee, deadline, or sprint status' : 'Add an actionable item to the war-room sprint backlog'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Task Title *</label>
            <input
              type="text"
              required
              placeholder="e.g., Integrate Gemini Live Audio WebSocket"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description (Optional)</label>
            <textarea
              rows={3}
              placeholder="Context, requirements, technical nuances..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Sprint Stage</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="backlog">📋 Backlog</option>
                <option value="in_progress">⚡ In Progress</option>
                <option value="review">🔍 Review</option>
                <option value="done">✅ Done</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="urgent">🔴 Urgent / Blocker</option>
                <option value="high">🟠 High</option>
                <option value="medium">🟣 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Assignee</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.user?.name || `User #${m.user_id}`} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Due Time</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-medium rounded-xl transition active:scale-95 text-center min-h-[42px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition active:scale-95 text-center min-h-[42px]"
            >
              {isSubmitting ? 'Saving...' : taskToEdit ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
