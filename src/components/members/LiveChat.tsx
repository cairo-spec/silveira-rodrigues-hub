import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, User, ShieldCheck, MessageCircle, Users, Headphones, ArrowLeft, Lock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChatMessage {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  user_id: string;
}

interface ChatRoom {
  id: string;
  is_active: boolean;
  room_type: string;
}

interface LiveChatProps {
  isSubscriber?: boolean;
}

type RoomType = "lobby" | "suporte";

const LiveChat = ({ isSubscriber = false }: LiveChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedRoomType) {
      initializeChat(selectedRoomType);
    }
  }, [user, selectedRoomType]);

  useEffect(() => {
    if (!room) return;

    // Subscribe to realtime updates
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
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeChat = async (roomType: RoomType) => {
    if (!user) return;

    setIsLoading(true);
    setMessages([]);

    // Find existing active room of this type or create new one
    const { data: existingRoom } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('user_id', user.id)
      .eq('room_type', roomType)
      .eq('is_active', true)
      .maybeSingle();

    if (existingRoom) {
      setRoom(existingRoom);
      await fetchMessages(existingRoom.id);
    } else {
      const { data: newRoom, error } = await supabase
        .from('chat_rooms')
        .insert({ user_id: user.id, room_type: roomType })
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível iniciar o chat",
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

  const handleBack = () => {
    setSelectedRoomType(null);
    setRoom(null);
    setMessages([]);
  };

  // Room selection view
  if (!selectedRoomType) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Chat ao Vivo</h2>
          <p className="text-muted-foreground">Escolha uma sala para conversar</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Lobby Card */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedRoomType("lobby")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <span className="text-lg">Lobby</span>
                  <p className="text-sm font-normal text-muted-foreground">
                    Sala geral de bate-papo
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Tire dúvidas gerais e converse com nossa equipe sobre assuntos diversos.
              </p>
            </CardContent>
          </Card>

          {/* Suporte Card */}
          <Card 
            className={`transition-shadow ${
              isSubscriber 
                ? "cursor-pointer hover:shadow-md" 
                : "opacity-60 cursor-not-allowed"
            }`}
            onClick={() => isSubscriber && setSelectedRoomType("suporte")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isSubscriber ? "bg-green-100" : "bg-gray-100"
                }`}>
                  {isSubscriber ? (
                    <Headphones className="h-6 w-6 text-green-600" />
                  ) : (
                    <Lock className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <span className="text-lg">Suporte</span>
                  <p className="text-sm font-normal text-muted-foreground">
                    Atendimento exclusivo
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isSubscriber ? (
                <p className="text-sm text-muted-foreground">
                  Suporte prioritário para assinantes. Resolva questões específicas do seu contrato.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Disponível apenas para assinantes do Jornal de Licitações.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Chat view
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const roomTitle = selectedRoomType === "lobby" ? "Lobby" : "Suporte";
  const roomIcon = selectedRoomType === "lobby" ? (
    <Users className="h-4 w-4" />
  ) : (
    <Headphones className="h-4 w-4" />
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            {roomIcon}
            {roomTitle}
          </h2>
          <p className="text-sm text-muted-foreground">
            {selectedRoomType === "lobby" 
              ? "Sala geral de bate-papo" 
              : "Atendimento exclusivo para assinantes"
            }
          </p>
        </div>
      </div>

      <Card className="flex flex-col h-[500px]">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Chat ativo
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Inicie uma conversa</h3>
              <p className="text-sm text-muted-foreground">
                Envie uma mensagem e nossa equipe responderá em breve
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.is_admin ? "" : "flex-row-reverse"}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.is_admin ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
                  {message.is_admin ? (
                    <ShieldCheck className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <div className={`max-w-[70%] ${message.is_admin ? "" : "text-right"}`}>
                  <div className={`rounded-lg p-3 ${
                    message.is_admin 
                      ? "bg-muted text-foreground" 
                      : "bg-primary text-primary-foreground"
                  }`}>
                    <p className="text-sm">{message.message}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(message.created_at), "HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))
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