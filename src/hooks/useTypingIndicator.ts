import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface TypingUser {
  id: string;
  name: string;
}

export const useTypingIndicator = (roomId: string | null) => {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!roomId || !user) return;

    const channel = supabase.channel(`typing-${roomId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: TypingUser[] = [];
        
        Object.entries(state).forEach(([userId, presences]) => {
          if (userId !== user.id) {
            const presence = presences[0] as { typing?: boolean; name?: string };
            if (presence?.typing) {
              users.push({
                id: userId,
                name: presence.name || 'Alguém',
              });
            }
          }
        });
        
        setTypingUsers(users);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomId, user]);

  const startTyping = useCallback(async (userName: string) => {
    if (!channelRef.current) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    await channelRef.current.track({
      typing: true,
      name: userName,
    });

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, []);

  const stopTyping = useCallback(async () => {
    if (!channelRef.current) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    await channelRef.current.track({
      typing: false,
    });
  }, []);

  return {
    typingUsers,
    startTyping,
    stopTyping,
  };
};
