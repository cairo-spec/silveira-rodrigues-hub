import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, User, ShieldCheck, MessageCircle, Users, Headphones, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { notifyAdmins, clearNotificationsByReference } from "@/lib/notifications";

interface ChatMessage {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  user_id: string;
  user_name?: string;
}

interface ChatRoom {
  id: string;
  is_active: boolean;
  room_type: string;
}

interface LiveChatProps {
  roomType: "lobby" | "suporte";
}

const LiveChat = ({ roomType }: LiveChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeChat();
  }, [user, roomType]);

  useEffect(() => {
    if (!room) return;

    // Clear notifications for this chat room when viewing
    if (roomType === "suporte") {
      clearNotificationsByReference(room.id);
    }

    const channel = supabase
      .channel(`chat-room-${room.id}`)
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
          if (roomType === "lobby" && !userNames[newMsg.user_id]) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('nome')
              .eq('user_id', newMsg.user_id)
              .maybeSingle();
            if (profile) {
              setUserNames(prev => ({ ...prev, [newMsg.user_id]: profile.nome }));
            }
          }
          setMessages((prev) => [...prev, newMsg]);
          
          // Clear notifications when new message arrives while viewing
          if (roomType === "suporte") {
            clearNotificationsByReference(room.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${room.id}`
        },
        (payload) => {
          setMessages((prev) => prev.filter(msg => msg.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room, roomType, userNames]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeChat = async () => {
    if (!user) return;

    setIsLoading(true);
    setMessages([]);

    if (roomType === "lobby") {
      const { data: lobbyRoom } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('room_type', 'lobby')
        .eq('is_active', true)
        .maybeSingle();

      if (lobbyRoom) {
        setRoom(lobbyRoom);
        await fetchMessages(lobbyRoom.id, true);
      } else {
        const { data: newRoom, error } = await supabase
          .from('chat_rooms')
          .insert({ user_id: user.id, room_type: 'lobby' })
          .select()
          .single();

        if (error) {
          toast({
            title: "Erro",
            description: "Não foi possível acessar o lobby",
            variant: "destructive"
          });
        } else {
          setRoom(newRoom);
        }
      }
    } else {
      const { data: existingRoom } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('user_id', user.id)
        .eq('room_type', 'suporte')
        .eq('is_active', true)
        .maybeSingle();

      if (existingRoom) {
        setRoom(existingRoom);
        await fetchMessages(existingRoom.id, false);
      } else {
        const { data: newRoom, error } = await supabase
          .from('chat_rooms')
          .insert({ user_id: user.id, room_type: 'suporte' })
          .select()
          .single();

        if (error) {
          toast({
            title: "Erro",
            description: "Não foi possível iniciar o suporte",
            variant: "destructive"
          });
        } else {
          setRoom(newRoom);
        }
      }
    }

    setIsLoading(false);
  };

  const fetchMessages = async (roomId: string, fetchUserNames: boolean) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as mensagens",
        variant: "destructive"
      });
    } else {
      setMessages(data || []);
      
      if (fetchUserNames && data && data.length > 0) {
        const userIds = [...new Set(data.map(m => m.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, nome')
          .in('user_id', userIds);
        
        if (profiles) {
          const namesMap: Record<string, string> = {};
          profiles.forEach(p => { namesMap[p.user_id] = p.nome; });
          setUserNames(namesMap);
        }
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !room || !newMessage.trim()) return;

    setIsSending(true);

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: room.id,
        user_id: user.id,
        message: newMessage.trim(),
        is_admin: false
      });

    if (!error && roomType === "suporte") {
      // Notify admins about new support chat message
      notifyAdmins(
        'chat_message',
        'Nova mensagem no suporte',
        `Um usuário enviou uma mensagem no chat de suporte`,
        room.id
      );
    }

    setIsSending(false);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive"
      });
    } else {
      setNewMessage("");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível apagar a mensagem",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isLobby = roomType === "lobby";
  const roomTitle = isLobby ? "Lobby" : "Suporte";
  const roomIcon = isLobby ? (
    <Users className="h-5 w-5" />
  ) : (
    <Headphones className="h-5 w-5" />
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          {roomIcon}
          {roomTitle}
        </h2>
        <p className="text-muted-foreground">
          {isLobby 
            ? "Sala pública - todos podem ver as mensagens" 
            : "Chat privado com a equipe de suporte"
          }
        </p>
      </div>

      <Card className="flex flex-col h-[500px]">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {isLobby ? "Chat público" : "Chat privado"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Inicie uma conversa</h3>
              <p className="text-sm text-muted-foreground">
                {isLobby 
                  ? "Envie uma mensagem para a comunidade" 
                  : "Envie uma mensagem e nossa equipe responderá em breve"
                }
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.user_id === user?.id;
              const senderName = message.is_admin 
                ? "Equipe" 
                : (isLobby ? (userNames[message.user_id] || "Membro") : (isOwnMessage ? "Você" : ""));
              
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.is_admin ? "" : isOwnMessage ? "flex-row-reverse" : ""}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    message.is_admin 
                      ? "bg-primary text-primary-foreground" 
                      : isOwnMessage 
                        ? "bg-primary/80 text-primary-foreground"
                        : "bg-muted"
                  }`}>
                    {message.is_admin ? (
                      <ShieldCheck className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div className={`max-w-[70%] ${message.is_admin ? "" : isOwnMessage ? "text-right" : ""}`}>
                    {isLobby && (
                      <p className={`text-xs font-medium mb-1 ${isOwnMessage ? "text-right" : ""}`}>
                        {senderName}
                      </p>
                    )}
                    <div className={`rounded-lg p-3 ${
                      message.is_admin 
                        ? "bg-muted text-foreground" 
                        : isOwnMessage
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                    }`}>
                      <p className="text-sm">{message.message}</p>
                    </div>
                    <div className={`flex items-center gap-2 mt-1 ${isOwnMessage ? "justify-end" : ""}`}>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(message.created_at), "HH:mm", { locale: ptBR })}
                      </p>
                      {isLobby && isOwnMessage && !message.is_admin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteMessage(message.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Textarea
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="min-h-[40px] max-h-[120px] resize-none"
              rows={1}
            />
            <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default LiveChat;