'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useDuelStore } from '@/stores/duelStore';

export function useDuelRealtime(duelId: string | null) {
  const setDuel = useDuelStore((s) => s.setDuel);

  useEffect(() => {
    if (!duelId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`duel:${duelId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'duels',
          filter: `id=eq.${duelId}`,
        },
        (payload) => {
          setDuel(payload.new as any);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'duel_answers',
          filter: `duel_id=eq.${duelId}`,
        },
        () => {
          // Opponent answered — could trigger UI update
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [duelId, setDuel]);
}
