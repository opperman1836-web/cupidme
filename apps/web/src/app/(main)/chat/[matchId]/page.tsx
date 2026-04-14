'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Clock, CreditCard, ArrowLeft, Sparkles, Heart,
  Shield, AlertTriangle, MapPin, Gift,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { useRealtimeMessages } from '@/hooks/useRealtime';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useToastStore } from '@/components/ui/Toast';
import { formatTimeLeft } from '@/lib/utils';

export default function ChatPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [matchUser, setMatchUser] = useState<any>(null);
  const [input, setInput] = useState('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showStarters, setShowStarters] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const token = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.userId);
  const messages = useChatStore((s) => s.messages[roomId || ''] || []);
  const setMessages = useChatStore((s) => s.setMessages);
  const addToast = useToastStore((s) => s.addToast);

  useRealtimeMessages(roomId);

  const { isOtherTyping, sendTyping, stopTyping } = useTypingIndicator(
    roomId,
    userId
  );

  const conversationStarters = [
    "What's something you've always wanted to try but haven't yet?",
    "If you could travel anywhere tomorrow, where would you go?",
    "What's a small thing that makes your day better?",
    "What's the best meal you've ever had?",
  ];

  useEffect(() => {
    async function init() {
      try {
        const roomRes = await api.post<any>('/api/chat/start', { match_id: matchId }, token!);
        const room = roomRes.data;
        setRoomId(room.id);
        setExpiresAt(room.expires_at);

        // Load match info
        try {
          const matchRes = await api.get<any>(`/api/matches/${matchId}`, token!);
          setMatchUser(matchRes.data?.other_user);
        } catch { /* ok */ }

        const msgRes = await api.get<any>(`/api/chat/${room.id}/messages`, token!);
        const msgs = (msgRes.data || []).reverse();
        setMessages(room.id, msgs);
        if (msgs.length === 0) setShowStarters(true);
      } catch (err: any) {
        addToast(err.message || 'Failed to load chat', 'error');
      }
    }
    if (token && matchId) init();
  }, [token, matchId, setMessages, addToast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || !roomId) return;
    setSending(true);
    stopTyping();
    try {
      await api.post(`/api/chat/${roomId}/messages`, { content: input.trim() }, token!);
      setInput('');
      analytics.track('message_sent', { room_id: roomId! });
      analytics.trackFunnel('chat_started');
      setShowStarters(false);
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

  function useStarter(text: string) {
    setInput(text);
    setShowStarters(false);
  }

  // Time remaining warning
  const timeLeft = expiresAt ? new Date(expiresAt).getTime() - Date.now() : null;
  const isExpiringSoon = timeLeft !== null && timeLeft > 0 && timeLeft < 2 * 60 * 60 * 1000;

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-dark-100">
        <div className="flex items-center gap-3">
          <Link href="/matches" className="md:hidden p-2 hover:bg-dark-50 rounded-xl">
            <ArrowLeft className="w-5 h-5 text-dark-500" />
          </Link>
          <Avatar
            src={matchUser?.primary_photo_url}
            alt={matchUser?.display_name || 'Match'}
            size="md"
          />
          <div>
            <h2 className="font-bold text-dark-900">
              {matchUser?.display_name || 'Your Match'}
            </h2>
            {expiresAt && (
              <div className={`flex items-center gap-1 text-xs ${isExpiringSoon ? 'text-amber-500' : 'text-dark-400'}`}>
                <Clock className="w-3 h-3" />
                {formatTimeLeft(expiresAt)}
                {isExpiringSoon && <AlertTriangle className="w-3 h-3" />}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/venues">
            <Button variant="ghost" size="sm">
              <MapPin className="w-4 h-4 mr-1" /> Venues
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleExtend}>
            <Clock className="w-4 h-4 mr-1" /> Extend
          </Button>
        </div>
      </div>

      {/* Expiring soon banner */}
      <AnimatePresence>
        {isExpiringSoon && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center justify-between"
          >
            <span className="text-sm text-amber-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Chat expires soon! Extend to keep talking.
            </span>
            <Button size="sm" onClick={handleExtend}>
              <CreditCard className="w-3.5 h-3.5 mr-1" /> Extend +24h
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-2">
        {messages.length === 0 && !showStarters && (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-cupid-200 mx-auto mb-3" />
            <p className="text-dark-400 text-sm">Start your conversation!</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.sender_id === userId;
          const isSystem = msg.message_type === 'system';
          const isFlagged = msg.moderation_status === 'flagged';

          if (isSystem) {
            return (
              <div key={msg.id} className="text-center py-2">
                <span className="text-xs text-dark-400 bg-dark-50 px-3 py-1 rounded-full">
                  {msg.content}
                </span>
              </div>
            );
          }

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] relative group`}>
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-gradient-to-r from-cupid-500 to-cupid-600 text-white rounded-br-lg'
                      : 'bg-white border border-dark-100 text-dark-800 rounded-bl-lg shadow-sm'
                  } ${isFlagged ? 'opacity-60' : ''}`}
                >
                  {msg.content}
                  {isFlagged && (
                    <span className="block text-[10px] mt-1 opacity-70 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Flagged by moderation
                    </span>
                  )}
                </div>
                <span className={`text-[10px] text-dark-300 mt-0.5 block ${isMe ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Conversation starters */}
      <AnimatePresence>
        {showStarters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-dark-100 pt-3 pb-2"
          >
            <p className="text-xs text-dark-400 mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cupid-500" /> Conversation starters
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {conversationStarters.map((starter) => (
                <button
                  key={starter}
                  onClick={() => useStarter(starter)}
                  className="flex-shrink-0 px-3 py-2 bg-cupid-50 text-cupid-700 rounded-xl text-xs font-medium hover:bg-cupid-100 transition-colors max-w-[200px] text-left"
                >
                  {starter}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Typing indicator */}
      {isOtherTyping && (
        <div className="flex items-center gap-2 px-4 py-1.5 text-sm text-dark-500">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span>{matchUser?.display_name || 'Someone'} is typing...</span>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 pt-3 border-t border-dark-100">
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); sendTyping(); }}
          placeholder="Type a message..."
          className="flex-1 rounded-2xl border border-dark-200 px-5 py-3 focus:border-cupid-500 focus:ring-2 focus:ring-cupid-100 focus:outline-none bg-white transition-all"
          maxLength={2000}
        />
        <motion.button
          type="submit"
          disabled={!input.trim() || sending}
          whileTap={{ scale: 0.9 }}
          className="w-12 h-12 bg-gradient-to-r from-cupid-500 to-cupid-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-cupid-500/25 disabled:opacity-50 disabled:shadow-none transition-all"
        >
          {sending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </motion.button>
      </form>
    </div>
  );
}
