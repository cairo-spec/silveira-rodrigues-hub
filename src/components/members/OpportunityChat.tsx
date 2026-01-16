import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send, MessageCircle, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

interface UserProfile {
  nome: string;
  avatar_url: string | null;
}

interface ChatRoom {
  id: string;
  opportunity_id: string;
}

interface OpportunityChatProps {
  opportunityId: string;
  opportunityTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin?: boolean;
}

const OpportunityChat = ({ opportunityId, opportunityTitle, open, onOpenChange, isAdmin = false }: OpportunityChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && user) {
      initializeChat();
    }
  }, [open, user, opportunityId]);

  useEffect(() => {
    if (!room) return;

    const channel = supabase
      .channel(`opportunity-chat-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${room.id}`
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          if (!userProfiles[newMsg.user_id]) {
            await fetchUserProfile(newMsg.user_id);
          }
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchUserProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("nome, avatar_url")
      .eq("user_id", userId)
      .single();

    if (data) {
      setUserProfiles((prev) => ({
        ...prev,
        [userId]: data
      }));
    }
  };

  const initializeChat = async () => {
    if (!user) return;
    setIsLoading(true);

    // Check for existing room
    const { data: existingRoom } = await supabase
      .from("chat_rooms")
      .select("id, opportunity_id")
      .eq("opportunity_id", opportunityId)
      .eq("room_type", "opportunity")
      .eq("is_active", true)
      .maybeSingle();

    if (existingRoom) {
      setRoom(existingRoom);
      await fetchMessages(existingRoom.id);
    } else {
      // Create new room
      const { data: newRoom, error } = await supabase
        .from("chat_rooms")
        .insert({
          user_id: user.id,
          opportunity_id: opportunityId,
          room_type: "opportunity",
          is_active: true
        })
        .select("id, opportunity_id")
        .single();

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível criar o chat",
          variant: "destructive"
        });
      } else {
        setRoom(newRoom);
      }
    }

    setIsLoading(false);
  };

  const fetchMessages = async (roomId: string) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
      
      // Fetch user profiles for all unique users
      const uniqueUserIds = [...new Set(data.map(m => m.user_id))];
      for (const userId of uniqueUserIds) {
        if (!userProfiles[userId]) {
          await fetchUserProfile(userId);
        }
      }
    }
  };

  const handleSendMessage = async () => {
    if (!user || !room || !newMessage.trim()) return;

    setIsSending(true);
    const messageText = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase
      .from("chat_messages")
      .insert({
        room_id: room.id,
        user_id: user.id,
        message: messageText,
        is_admin: isAdmin
      });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive"
      });
      setNewMessage(messageText);
    }

    setIsSending(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <span className="truncate">Chat: {opportunityTitle}</span>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-sm">Nenhuma mensagem ainda.</p>
                  <p className="text-xs">Inicie a conversa com sua equipe e o suporte.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isOwnMessage = msg.user_id === user?.id;
                    const profile = userProfiles[msg.user_id];
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                      >
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className={msg.is_admin ? "bg-primary text-primary-foreground" : ""}>
                            {profile ? getInitials(profile.nome) : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex flex-col ${isOwnMessage ? "items-end" : ""}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">
                              {profile?.nome || "Usuário"}
                              {msg.is_admin && (
                                <span className="ml-1 text-xs text-primary">(Suporte)</span>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          <div
                            className={`rounded-lg px-3 py-2 max-w-[280px] ${
                              isOwnMessage
                                ? "bg-primary text-primary-foreground"
                                : msg.is_admin
                                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t shrink-0">
              <div className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[40px] max-h-24 resize-none"
                  rows={1}
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={isSending || !newMessage.trim()}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OpportunityChat;