import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MessageSquare,
  Send,
  Pin,
  Trash2,
  Smile,
  Radio,
  Zap,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../../api/messages';
import { useRoom } from '../../context/RoomContext';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';

const QUICK_EMOJIS = ['🔥', '🚀', '⚡', '🎉', '🐛', '👀', '💯'];

export default function WarRoomChatDrawer({ isOpen, onClose }) {
  const { activeRoom, activeRoomId, myRole } = useRoom();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [inputText, setInputText] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [isPinnedExpanded, setIsPinnedExpanded] = useState(true);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  // 1. TanStack Query: Fetch messages with 3s polling fallback for serverless
  const {
    data: messages = [],
    isLoading,
    refetch: refetchMessages
  } = useQuery({
    queryKey: ['messages', activeRoomId],
    queryFn: () => messagesApi.listMessages(activeRoomId),
    enabled: Boolean(activeRoomId),
    refetchInterval: wsConnected ? false : 3000, // Seamless fallback if WS inactive
  });

  // 2. WebSocket Real-Time Connection
  useEffect(() => {
    if (!activeRoomId || !isOpen) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const token = localStorage.getItem('pulseforge_token');
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/ws/rooms/${activeRoomId}?token=${encodeURIComponent(token)}`;

    let ws = null;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_message' && data.message) {
            queryClient.setQueryData(['messages', activeRoomId], (old = []) => {
              // Avoid duplicates
              if (old.some(m => m.id === data.message.id)) return old;
              return [...old, data.message];
            });
            scrollToBottom();
          } else if (data.type === 'message_pinned' && data.message) {
            queryClient.setQueryData(['messages', activeRoomId], (old = []) =>
              old.map(m => m.id === data.message.id ? data.message : m)
            );
          } else if (data.type === 'message_deleted' && data.message_id) {
            queryClient.setQueryData(['messages', activeRoomId], (old = []) =>
              old.filter(m => m.id !== data.message_id)
            );
          }
        } catch (e) {
          console.warn('WS message parse error:', e);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
      };

      ws.onerror = () => {
        setWsConnected(false);
      };
    } catch (err) {
      console.warn('WebSocket init failed, using polling fallback:', err);
      setWsConnected(false);
    }

    return () => {
      if (ws) {
        ws.close();
      }
      wsRef.current = null;
      setWsConnected(false);
    };
  }, [activeRoomId, isOpen, queryClient]);

  // Scroll to bottom on load and on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0 && isOpen) {
      scrollToBottom();
    }
  }, [messages.length, isOpen]);

  // 3. Send Message Mutation
  const sendMutation = useMutation({
    mutationFn: (content) => messagesApi.sendMessage(activeRoomId, content),
    onSuccess: (newMsg) => {
      queryClient.setQueryData(['messages', activeRoomId], (old = []) => {
        if (old.some(m => m.id === newMsg.id)) return old;
        return [...old, newMsg];
      });
      setInputText('');
      scrollToBottom();
    },
  });

  // 4. Pin Message Mutation
  const pinMutation = useMutation({
    mutationFn: (messageId) => messagesApi.togglePin(activeRoomId, messageId),
    onSuccess: (updated) => {
      queryClient.setQueryData(['messages', activeRoomId], (old = []) =>
        old.map(m => m.id === updated.id ? updated : m)
      );
    },
  });

  // 5. Delete Message Mutation
  const deleteMutation = useMutation({
    mutationFn: (messageId) => messagesApi.deleteMessage(activeRoomId, messageId),
    onSuccess: (_, messageId) => {
      queryClient.setQueryData(['messages', activeRoomId], (old = []) =>
        old.filter(m => m.id !== messageId)
      );
    },
  });

  const handleSend = (e) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || sendMutation.isPending) return;

    // If WS connected, we can send over WS or REST. REST guarantees DB persistence.
    sendMutation.mutate(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji) => {
    setInputText(prev => prev + emoji);
  };

  if (!isOpen) return null;

  const pinnedMessages = messages.filter(m => m.is_pinned);

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] bg-slate-900/95 border-l border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col animate-slideLeft transition-all duration-300">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-100 truncate max-w-[200px]">
                {activeRoom?.name || 'War-Room Comms'}
              </h3>
              {wsConnected ? (
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-full">
                  <Zap className="w-2.5 h-2.5 text-indigo-400" />
                  SYNC
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
              Active Hacker Broadcast & Team Chat
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Pinned Announcements Banner */}
      {pinnedMessages.length > 0 && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-3.5 py-2.5 text-xs text-amber-200">
          <div className="flex items-center justify-between font-semibold text-[11px] uppercase tracking-wider text-amber-400">
            <span className="flex items-center gap-1.5">
              <Pin className="w-3.5 h-3.5" />
              Pinned Announcements ({pinnedMessages.length})
            </span>
            <button
              onClick={() => setIsPinnedExpanded(!isPinnedExpanded)}
              className="p-0.5 hover:text-amber-300 transition"
            >
              {isPinnedExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {isPinnedExpanded && (
            <div className="mt-2 space-y-1.5 max-h-28 overflow-y-auto pr-1">
              {pinnedMessages.map((msg) => (
                <div
                  key={`pin-${msg.id}`}
                  className="p-2 rounded-lg bg-slate-900/80 border border-amber-500/30 flex items-start justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-[11px] text-amber-300 block">
                      {msg.sender?.name || 'Hacker'}:
                    </span>
                    <p className="text-[11px] text-slate-200 leading-relaxed break-words">
                      {msg.content}
                    </p>
                  </div>
                  {['owner', 'admin'].includes(myRole) && (
                    <button
                      onClick={() => pinMutation.mutate(msg.id)}
                      title="Unpin message"
                      className="text-amber-400/60 hover:text-amber-300 p-1 transition shrink-0"
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono">Syncing war-room chat stream...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-slate-800/60 flex items-center justify-center text-slate-500 mb-2">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-semibold text-slate-300">War-Room Comms Silent</h4>
            <p className="text-[11px] text-slate-500 max-w-xs mt-1">
              Drop critical updates, deploy links, and coordinate sprints with the team right here.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender_id === user?.id;
            const canManage = isMe || ['owner', 'admin'].includes(myRole);

            return (
              <div
                key={msg.id || index}
                className={`group flex items-start gap-3 text-xs ${msg.is_pinned ? 'p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20' : ''}`}
              >
                <img
                  src={msg.sender?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.sender?.name || 'hacker'}`}
                  alt={msg.sender?.name}
                  className="w-7 h-7 rounded-lg bg-slate-800 object-cover border border-slate-700/80 shrink-0 mt-0.5"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-semibold ${isMe ? 'text-indigo-300' : 'text-slate-200'}`}>
                        {msg.sender?.name || 'Hacker'}
                      </span>
                      {msg.sender?.role_title && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-800 text-slate-400 border border-slate-700/60">
                          {msg.sender.role_title}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">
                        {msg.created_at ? format(new Date(msg.created_at), 'h:mm a') : 'Now'}
                      </span>
                      {msg.is_pinned && (
                        <span className="text-[10px] text-amber-400 font-medium flex items-center gap-0.5">
                          <Pin className="w-2.5 h-2.5" /> Pinned
                        </span>
                      )}
                    </div>

                    {/* Action buttons on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      {['owner', 'admin'].includes(myRole) && (
                        <button
                          onClick={() => pinMutation.mutate(msg.id)}
                          title={msg.is_pinned ? 'Unpin' : 'Pin to top'}
                          className={`p-1 rounded hover:bg-slate-800 transition ${msg.is_pinned ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'}`}
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                      )}
                      {canManage && (
                        <button
                          onClick={() => deleteMutation.mutate(msg.id)}
                          title="Delete message"
                          className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-1 text-slate-200 leading-relaxed break-words font-sans selection:bg-indigo-500/40">
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emoji Reaction Pill Bar */}
      <div className="px-4 py-1.5 bg-slate-950/40 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto">
        <span className="text-[10px] text-slate-500 font-mono mr-1">Quick:</span>
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => addEmoji(emoji)}
            className="hover:scale-125 transition-transform text-sm px-1 py-0.5 rounded hover:bg-slate-800/60"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="p-3 bg-slate-950/80 border-t border-slate-800">
        <div className="relative flex items-center">
          <textarea
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type war-room message... (Enter to send)"
            className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none max-h-24"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sendMutation.isPending}
            className="absolute right-2 p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-40 disabled:hover:bg-indigo-600"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 px-1">
          <span>Shift+Enter for newline</span>
          <span className="font-mono">{inputText.length}/5000</span>
        </div>
      </form>
    </div>
  );
}
