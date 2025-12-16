import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageCircle, ArrowLeft, Send, User, ShieldCheck, Trash2, Users, Headphones, Paperclip, X, FileText } from "lucide-react";
import { format, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { clearNotificationsByReference } from "@/lib/notifications";

interface ChatRoom {
  id: string;
  user_id: string;
  is_active: boolean;
  room_type: string;
  created_at: string;
  profiles?: { nome: string; email: string } | null;
  unread_count?: number;
  last_message_at?: string;
}

interface ChatMessage {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  user_id: string;
}

const AdminChats = () => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [lobbyRoom, setLobbyRoom] = useState<ChatRoom | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState("support");
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchRooms();

    const channel = supabase
      .channel('admin-chat-rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_rooms' }, () => fetchRooms())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => {
        fetchRooms();
        if (selectedRoom) fetchMessages(selectedRoom.id);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedRoom]);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
      clearNotificationsByReference(selectedRoom.id);
      
      // Mark room as read by admin
      const lastReadKey = `admin_chat_read_${selectedRoom.id}`;
      localStorage.setItem(lastReadKey, new Date().toISOString());

      const channel = supabase
        .channel(`admin-room-${selectedRoom.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `room_id=eq.${selectedRoom.id}`
        }, (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMsg]);
          clearNotificationsByReference(selectedRoom.id);
          scrollToBottom();
        })
        .on('postgres_changes', { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `room_id=eq.${selectedRoom.id}`
        }, (payload) => {
          setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchRooms = async () => {
    // Fetch support rooms
    const { data: roomsData, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('room_type', 'suporte')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Fetch lobby room
    const { data: lobbyData } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('room_type', 'lobby')
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      toast({ title: "Erro", description: "Não foi possível carregar chats", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    // Fetch profiles and message counts
    const userIds = [...new Set(roomsData?.map(r => r.user_id) || [])];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, nome, email')
      .in('user_id', userIds);

    const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

    // Get current user for admin check
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    // Get unread counts, last message time, and filter active rooms
    const roomsWithDetails = await Promise.all((roomsData || []).map(async (room) => {
      // Get all messages for this room
      const { data: messagesData } = await supabase
        .from('chat_messages')
        .select('created_at, is_admin')
        .eq('room_id', room.id)
        .order('created_at', { ascending: false });

      const lastMessage = messagesData?.[0];
      const lastMessageAt = lastMessage?.created_at || room.created_at;
      
      // Get last read timestamp from localStorage
      const lastReadKey = `admin_chat_read_${room.id}`;
      const lastReadAt = localStorage.getItem(lastReadKey);
      
      // Count unread messages (non-admin messages after last read)
      const unreadCount = messagesData?.filter(m => {
        if (m.is_admin) return false; // Admin's own messages are not unread
        if (!lastReadAt) return true; // Never read = all user messages are unread
        return new Date(m.created_at) > new Date(lastReadAt);
      }).length || 0;

      return {
        ...room,
        profiles: profilesMap.get(room.user_id) || null,
        last_message_at: lastMessageAt,
        unread_count: unreadCount
      };
    }));

    // Filter: show only rooms with messages in last 24h OR with unread messages
    const now = new Date();
    const activeRooms = roomsWithDetails.filter(room => {
      const hoursSinceLastMessage = differenceInHours(now, new Date(room.last_message_at || room.created_at));
      return hoursSinceLastMessage <= 24 || (room.unread_count && room.unread_count > 0);
    });

    // Sort by last message time (most recent first)
    activeRooms.sort((a, b) => 
      new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
    );

    setRooms(activeRooms);
    setLobbyRoom(lobbyData);
    setIsLoading(false);
  };

  const fetchMessages = async (roomId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    
    if (data) {
      setMessages(data);
      
      // Fetch user names for lobby
      if (selectedRoom?.room_type === 'lobby' || activeTab === 'lobby') {
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
    if (!selectedRoom || (!newMessage.trim() && !attachment)) return;

    setIsSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    let messageText = newMessage.trim();

    // Handle file upload for support chat
    if (attachment && selectedRoom.room_type === 'suporte') {
      setIsUploading(true);
      const fileExt = attachment.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `chat/${selectedRoom.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ticket-files')
        .upload(filePath, attachment);

      if (uploadError) {
        toast({ title: "Erro", description: "Não foi possível fazer upload do arquivo", variant: "destructive" });
        setIsUploading(false);
        setIsSending(false);
        return;
      }

      const { data: urlData } = await supabase.storage
        .from('ticket-files')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);

      messageText = messageText 
        ? `${messageText}\n\n📎 Anexo: ${attachment.name}\n${urlData?.signedUrl || ''}`
        : `📎 Anexo: ${attachment.name}\n${urlData?.signedUrl || ''}`;
      
      setIsUploading(false);
    }
    
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: selectedRoom.id,
        user_id: user?.id,
        message: messageText,
        is_admin: true
      });

    if (!error && selectedRoom.room_type === 'suporte') {
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
      setAttachment(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível apagar a mensagem", variant: "destructive" });
    }
  };

  const handleLobbyClick = () => {
    if (lobbyRoom) {
      setSelectedRoom(lobbyRoom);
    }
  };

  if (selectedRoom) {
    const isLobby = selectedRoom.room_type === 'lobby';
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedRoom(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold">
              {isLobby ? 'Lobby' : selectedRoom.profiles?.nome}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isLobby ? 'Chat público' : selectedRoom.profiles?.email}
            </p>
          </div>
        </div>

        <Card className="flex flex-col h-[500px]">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              {isLobby ? 'Chat público' : 'Chat ao vivo'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const senderName = msg.is_admin 
                ? "Equipe" 
                : (isLobby ? (userNames[msg.user_id] || "Membro") : "Usuário");
              
              return (
                <div key={msg.id} className={`flex gap-3 ${msg.is_admin ? "flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    msg.is_admin ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    {msg.is_admin ? <ShieldCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <div className={`max-w-[85%] ${msg.is_admin ? "text-right" : ""}`}>
                    {isLobby && (
                      <p className={`text-xs font-medium mb-1 ${msg.is_admin ? "text-right" : ""}`}>
                        {senderName}
                      </p>
                    )}
                    <div className={`rounded-lg p-3 inline-block ${
                      msg.is_admin ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    </div>
                    <div className={`flex items-center gap-2 mt-1 ${msg.is_admin ? "justify-end" : ""}`}>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                      </p>
                      {/* Admin can delete any message in lobby */}
                      {isLobby && !msg.is_admin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteMessage(msg.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </CardContent>
          <div className="p-4 border-t">
            {attachment && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded-lg">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm flex-1 truncate">{attachment.name}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAttachment(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              {!isLobby && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSending}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Textarea
                placeholder="Responder..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="min-h-[40px] max-h-[120px] resize-none"
                rows={1}
              />
              <Button type="submit" size="icon" disabled={isSending || (!newMessage.trim() && !attachment)}>
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="support" className="gap-2">
            <Headphones className="h-4 w-4" />
            Suporte
          </TabsTrigger>
          <TabsTrigger value="lobby" className="gap-2">
            <Users className="h-4 w-4" />
            Lobby
          </TabsTrigger>
        </TabsList>

        <TabsContent value="support" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : rooms.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium">Nenhum chat de suporte ativo</h3>
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
                      <div className="flex items-center gap-2">
                        {room.unread_count && room.unread_count > 0 && (
                          <Badge variant="destructive" className="rounded-full">
                            {room.unread_count}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="bg-green-500 text-white">Ativo</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground">
                      Última mensagem: {room.last_message_at 
                        ? format(new Date(room.last_message_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                        : 'Sem mensagens'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="lobby" className="mt-4">
          {lobbyRoom ? (
            <Card className="cursor-pointer hover:shadow-md" onClick={handleLobbyClick}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Lobby Público
                    </CardTitle>
                    <CardDescription>Chat aberto para todos os membros</CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-green-500 text-white">Ativo</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">
                  Clique para acessar e moderar o lobby
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium">Lobby não encontrado</h3>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminChats;