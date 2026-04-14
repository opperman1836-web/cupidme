'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useChatStore } from '@/stores/chatStore';

export function useRealtimeMessages(chatRoomId: string | null) {
  const addMessage = useChatStore((s) => s.addMessage);
  const retryCount = useRef(0);
  const maxRetries = 5;

  useEffect(() => {
    if (!chatRoomId) return;

    const supabase = createClient();
    retryCount.current = 0;

    function subscribe() {
      const channel = supabase
        .channel(`chat:${chatRoomId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `chat_room_id=eq.${chatRoomId}`,
          },
          (payload) => {
            retryCount.current = 0; // Reset on successful message
            addMessage(chatRoomId, payload.new as any);
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' && retryCount.current < maxRetries) {
            retryCount.current++;
            const delay = Math.min(1000 * Math.pow(2, retryCount.current), 30000);
            console.warn(`Chat realtime error, retrying in ${delay}ms (attempt ${retryCount.current})`);
            setTimeout(() => {
              supabase.removeChannel(channel);
              subscribe();
            }, delay);
          }
        });

      return channel;
    }

    const channel = subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [chatRoomId, addMessage]);
}
