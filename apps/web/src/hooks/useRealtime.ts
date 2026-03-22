'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useChatStore } from '@/stores/chatStore';

export function useRealtimeMessages(chatRoomId: string | null) {
  const addMessage = useChatStore((s) => s.addMessage);

  useEffect(() => {
    if (!chatRoomId) return;

    const supabase = createClient();

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
          addMessage(chatRoomId, payload.new as any);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatRoomId, addMessage]);
}
