'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useTypingIndicator(chatRoomId: string | null, userId: string | null) {
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!chatRoomId || !userId) return;

    const channel = supabase.channel(`typing:${chatRoomId}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const others = Object.values(state).flat().filter(
          (p: any) => p.user_id !== userId && p.is_typing
        );
        setIsOtherTyping(others.length > 0);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatRoomId, userId, supabase]);

  const sendTyping = useCallback(() => {
    if (!chatRoomId || !userId) return;

    const channel = supabase.channel(`typing:${chatRoomId}`);
    channel.track({ user_id: userId, is_typing: true });

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      channel.track({ user_id: userId, is_typing: false });
    }, 3000);
  }, [chatRoomId, userId, supabase]);

  const stopTyping = useCallback(() => {
    if (!chatRoomId || !userId) return;
    const channel = supabase.channel(`typing:${chatRoomId}`);
    channel.track({ user_id: userId, is_typing: false });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  }, [chatRoomId, userId, supabase]);

  return { isOtherTyping, sendTyping, stopTyping };
}
