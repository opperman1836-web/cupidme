'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Send, Clock, CreditCard } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { useRealtimeMessages } from '@/hooks/useRealtime';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useToastStore } from '@/components/ui/Toast';
import { formatTimeLeft } from '@/lib/utils';

export default function ChatPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const token = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.userId);
  const messages = useChatStore((s) => s.messages[roomId || ''] || []);
  const setMessages = useChatStore((s) => s.setMessages);
  const addToast = useToastStore((s) => s.addToast);

  useRealtimeMessages(roomId);

  useEffect(() => {
    async function init() {
      try {
        // Start/get chat room
        const roomRes = await api.post<any>('/api/chat/start', { match_id: matchId }, token!);
        const room = roomRes.data;
        setRoomId(room.id);
        setExpiresAt(room.expires_at);

        // Load messages
        const msgRes = await api.get<any>(`/api/chat/${room.id}/messages`, token!);
        setMessages(room.id, (msgRes.data || []).reverse());
      } catch (err: any) {
        addToast(err.message || 'Failed to load chat', 'error');
      }
    }
    if (token && matchId) init();
  }, [token, matchId, setMessages, addToast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !roomId) return;
    setSending(true);
    try {
      await api.post(`/api/chat/${roomId}/messages`, { content: input.trim() }, token!);
      setInput('');
    } catch (err: any) {
      addToast(err.message || 'Failed to send', 'error');
    }
    setSending(false);
  }

  async function handleExtend() {
    if (!roomId) return;
    try {
      const res = await api.post<any>(`/api/chat/${roomId}/extend`, {}, token!);
      setExpiresAt(res.data.expires_at);
      addToast('Chat extended by 24 hours!', 'success');
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-dark-100">
        <div className="flex items-center gap-3">
          <Avatar alt="Match" size="md" />
          <div>
            <h2 className="font-bold text-dark-900">Chat</h2>
            {expiresAt && (
              <div className="flex items-center gap-1 text-xs text-dark-400">
                <Clock className="w-3 h-3" />
                {formatTimeLeft(expiresAt)}
              </div>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExtend}>
          <CreditCard className="w-4 h-4 mr-1" /> Extend
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.sender_id === userId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                  isMe
                    ? 'bg-cupid-500 text-white rounded-br-md'
                    : 'bg-dark-100 text-dark-900 rounded-bl-md'
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 pt-4 border-t border-dark-100">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-xl border border-dark-200 px-4 py-3 focus:border-cupid-500 focus:ring-2 focus:ring-cupid-200 focus:outline-none"
          maxLength={2000}
        />
        <Button type="submit" loading={sending} disabled={!input.trim()}>
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </div>
  );
}
