import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, User, ShieldCheck, MessageCircle, Users, Headphones, Trash2, Paperclip, X } from "lucide-react";
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
  user_category?: string;
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
  const [userProfiles, setUserProfiles] = useState<Record<string, { nome: string; subscription_active: boolean; trial_active: boolean }>>({});
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initializeChat();
  }, [user, roomType]);

  useEffect(() => {
    if (!room) return;

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
          if (roomType === "lobby" && !userProfiles[newMsg.user_id]) {
            await fetchUserProfile(newMsg.user_id);
          }
          setMessages((prev) => [...prev, newMsg]);
          
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
  }, [room, roomType, userProfiles]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchUserProfile = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('nome, subscription_active, trial_active')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (profile) {
      setUserProfiles(prev => ({ 
        ...prev, 
        [userId]: profile 
      }));
    }
  };

  const getUserCategory = (userId: string, isAdmin: boolean): string => {
    if (isAdmin) return "Suporte";
    const profile = userProfiles[userId];
    if (!profile) return "Membro";
    if (profile.subscription_active) return "Assinante";
    if (profile.trial_active) return "Novato";
    return "Membro";
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

  const fetchMessages = async (roomId: string, fetchUserProfiles: boolean) => {
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
      
      if (fetchUserProfiles && data && data.length > 0) {
        const userIds = [...new Set(data.map(m => m.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, nome, subscription_active, trial_active')
          .in('user_id', userIds);
        
        if (profiles) {
          const profilesMap: Record<string, { nome: string; subscription_active: boolean; trial_active: boolean }> = {};
          profiles.forEach(p => { 
            profilesMap[p.user_id] = { 
              nome: p.nome, 
              subscription_active: p.subscription_active || false,
              trial_active: p.trial_active || false
            }; 
          });
          setUserProfiles(profilesMap);
        }
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !room || (!newMessage.trim() && !attachment)) return;

    setIsSending(true);
    let messageText = newMessage.trim();

    // Handle file upload for support chat
    if (attachment && roomType === "suporte") {
      setIsUploading(true);
      const fileExt = attachment.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `chat/${room.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ticket-files')
        .upload(filePath, attachment);

      if (uploadError) {
        toast({
          title: "Erro",
          description: "Não foi possível fazer upload do arquivo",
          variant: "destructive"
        });
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
        room_id: room.id,
        user_id: user.id,
        message: messageText,
        is_admin: false
      });

    if (!error && roomType === "suporte") {
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
      setAttachment(null);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file);
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
              const profile = userProfiles[message.user_id];
              const senderName = message.is_admin 
                ? "Equipe" 
                : (isLobby ? (profile?.nome || "Membro") : (isOwnMessage ? "Você" : ""));
              const category = isLobby ? getUserCategory(message.user_id, message.is_admin) : null;
              
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
                      <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? "justify-end" : ""}`}>
                        <p className="text-xs font-medium">{senderName}</p>
                        {category && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            category === "Suporte" ? "bg-primary/20 text-primary" :
                            category === "Assinante" ? "bg-green-100 text-green-700" :
                            category === "Novato" ? "bg-amber-100 text-amber-700" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {category}
                          </span>
                        )}
                      </div>
                    )}
                    <div className={`rounded-lg p-3 ${
                      message.is_admin 
                        ? "bg-muted text-foreground" 
                        : isOwnMessage
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
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
          {attachment && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded-lg">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm flex-1 truncate">{attachment.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setAttachment(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            {/* File attachment only for support chat (item 14) */}
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
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="min-h-[40px] max-h-[120px] resize-none"
              rows={1}
            />
            <Button type="submit" size="icon" disabled={isSending || isUploading || (!newMessage.trim() && !attachment)}>
              {(isSending || isUploading) ? (
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