import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageCircle, ArrowLeft, Send, User, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { clearNotificationsByReference } from "@/lib/notifications";

interface ChatRoom {
  id: string;
  user_id: string;
  is_active: boolean;
  created_at: string;
  profiles?: { nome: string; email: string } | null;
}

interface ChatMessage {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

const AdminChats = () => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchRooms();

    const channel = supabase
      .channel('admin-chat-rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_rooms' }, () => fetchRooms())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => {
        if (selectedRoom) fetchMessages(selectedRoom.id);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedRoom]);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
      
      // Clear notifications for this chat room when admin views it
      clearNotificationsByReference(selectedRoom.id);

      const channel = supabase
        .channel(`admin-room-${selectedRoom.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `room_id=eq.${selectedRoom.id}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as ChatMessage]);
          // Clear notifications when new message arrives while viewing
          clearNotificationsByReference(selectedRoom.id);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedRoom]);

  const fetchRooms = async () => {
    const { data: roomsData, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Erro", description: "Não foi possível carregar chats", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    // Fetch profiles for each room
    const userIds = [...new Set(roomsData?.map(r => r.user_id) || [])];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, nome, email')
      .in('user_id', userIds);

    const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
    const roomsWithProfiles = roomsData?.map(room => ({
      ...room,
      profiles: profilesMap.get(room.user_id) || null
    })) || [];

    setRooms(roomsWithProfiles);
    setIsLoading(false);
  };

  const fetchMessages = async (roomId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !newMessage.trim()) return;

    setIsSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: selectedRoom.id,
        user_id: user?.id,
        message: newMessage.trim(),
        is_admin: true
      });

    if (!error) {
      // Create notification for room owner (support chat)
      await supabase.from('notifications').insert({
        user_id: selectedRoom.user_id,
        type: 'chat_message',
        title: 'Nova mensagem no suporte',
        message: `Você recebeu uma nova mensagem da equipe de suporte`,
        reference_id: selectedRoom.id
      });
    }

    setIsSending(false);
    if (error) {
      toast({ title: "Erro", description: "Não foi possível enviar mensagem", variant: "destructive" });
    } else {
      setNewMessage("");
    }
  };

  if (selectedRoom) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedRoom(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold">{selectedRoom.profiles?.nome}</h2>
            <p className="text-sm text-muted-foreground">{selectedRoom.profiles?.email}</p>
          </div>
        </div>

        <Card className="flex flex-col h-[500px]">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Chat ao vivo
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.is_admin ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  msg.is_admin ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
                  {msg.is_admin ? <ShieldCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <div className={`max-w-[70%] ${msg.is_admin ? "text-right" : ""}`}>
                  <div className={`rounded-lg p-3 ${
                    msg.is_admin ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    <p className="text-sm">{msg.message}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
          <div className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Textarea
                placeholder="Responder..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="min-h-[40px] max-h-[120px] resize-none"
                rows={1}
              />
              <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Chats ao Vivo</h2>
        <p className="text-muted-foreground">Conversas ativas com usuários</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : rooms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium">Nenhum chat ativo</h3>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rooms.map((room) => (
            <Card key={room.id} className="cursor-pointer hover:shadow-md" onClick={() => setSelectedRoom(room)}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{room.profiles?.nome}</CardTitle>
                    <CardDescription>{room.profiles?.email}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-green-500 text-white">Ativo</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">
                  Iniciado em {format(new Date(room.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminChats;
