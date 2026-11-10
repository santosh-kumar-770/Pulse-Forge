import React, { useState, useEffect } from 'react';
import { X, Pin, Link2, KeyRound, FileText, AlertCircle, Edit3 } from 'lucide-react';
import { useRoom } from '../../context/RoomContext';
import { importantApi } from '../../api/important';
import { useQueryClient } from '@tanstack/react-query';

export default function NewImportantModal({ isOpen, onClose, noteToEdit = null }) {
  const { activeRoomId } = useRoom();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState('link');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title || '');
      setContentType(noteToEdit.content_type || 'link');
      setContent(noteToEdit.content || '');
      setIsPinned(noteToEdit.is_pinned !== false);
    } else {
      setTitle('');
      setContentType('link');
      setContent('');
      setIsPinned(true);
    }
    setError('');
  }, [noteToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      setIsSubmitting(true);
      setError('');

      const payload = {
        title: title.trim(),
        content_type: contentType,
        content: content.trim(),
        is_pinned: isPinned,
      };

      if (noteToEdit) {
        await importantApi.updateNote(activeRoomId, noteToEdit.id, payload);
      } else {
        await importantApi.createNote(activeRoomId, payload);
      }

      queryClient.invalidateQueries({ queryKey: ['important', activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ['timeline', activeRoomId] });
      onClose();
    } catch (err) {
      setError(err.message || (noteToEdit ? 'Failed to update item' : 'Failed to pin item'));
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
          <div className="p-2 sm:p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 shrink-0">
            {noteToEdit ? <Edit3 className="w-5 h-5" /> : <Pin className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100">
              {noteToEdit ? 'Edit Pinned Knowledge Asset' : 'Pin to Knowledge Vault'}
            </h2>
            <p className="text-xs text-slate-400">
              {noteToEdit ? 'Update title, URL, secrets, or content' : 'Quick-access URLs, API keys, endpoints, and critical team notes'}
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
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Item Title *</label>
            <input
              type="text"
              required
              placeholder="e.g., Devpost Submission URL, OpenAI API Secret, Figma Canvas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Content Type</label>
            <div className="grid grid-cols-1 xs:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setContentType('link')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition active:scale-95 ${
                  contentType === 'link'
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Link2 className="w-4 h-4" />
                <span>Link (URL)</span>
              </button>
              <button
                type="button"
                onClick={() => setContentType('snippet')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition active:scale-95 ${
                  contentType === 'snippet'
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Key / Snippet</span>
              </button>
              <button
                type="button"
                onClick={() => setContentType('markdown')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition active:scale-95 ${
                  contentType === 'markdown'
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Note</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {contentType === 'link' ? 'Web Address (URL) *' : contentType === 'snippet' ? 'Secret / Snippet / Commands *' : 'Markdown Note Content *'}
            </label>
            <textarea
              rows={4}
              required
              placeholder={
                contentType === 'link'
                  ? 'https://devpost.com/software/...'
                  : contentType === 'snippet'
                  ? 'OPENAI_API_KEY=sk-...\nDATABASE_URL=postgresql://...'
                  : '### Demo Script\n1. Show live audio stream\n2. Demonstrate low latency'
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isPinned"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-800 focus:ring-amber-500"
            />
            <label htmlFor="isPinned" className="text-xs font-medium text-slate-300 select-none cursor-pointer">
              Pin to top of knowledge board
            </label>
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
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-amber-600/30 transition active:scale-95 text-center min-h-[42px]"
            >
              {isSubmitting ? 'Saving...' : noteToEdit ? 'Save Changes' : 'Pin Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
