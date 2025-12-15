import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Loader2, User, ShieldCheck, FileText, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { notifyAdmins, clearNotificationsByReference } from "@/lib/notifications";

interface TicketMessage {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  user_id: string;
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  attachment_url: string | null;
  created_at: string;
}

interface TicketChatProps {
  ticket: Ticket;
  onBack: () => void;
}

const statusLabels: Record<string, string> = {
  open: "Aberto",
  in_progress: "Em andamento",
  resolved: "Resolvido",
  closed: "Fechado"
};

const TicketChat = ({ ticket, onBack }: TicketChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    
    // Clear notifications for this ticket when viewing
    clearNotificationsByReference(ticket.id);

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`ticket-messages-${ticket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticket.id}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as TicketMessage]);
          // Clear notifications when new message arrives while viewing
          clearNotificationsByReference(ticket.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticket.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticket.id)
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
    setIsLoading(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;

    setIsSending(true);

    const { error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticket.id,
        user_id: user.id,
        message: newMessage.trim(),
        is_admin: false
      });

    if (!error) {
      // Notify admins about new message
      notifyAdmins(
        'ticket_message',
        'Nova mensagem em ticket',
        `O usuário enviou uma mensagem no ticket "${ticket.title}"`,
        ticket.id
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

  const isTicketClosed = ticket.status === "closed" || ticket.status === "resolved";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{ticket.title}</h2>
          <Badge variant="secondary" className="mt-1">
            {statusLabels[ticket.status]}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Descrição original
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
          {ticket.attachment_url && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3 gap-2"
              onClick={() => window.open(ticket.attachment_url!, '_blank')}
            >
              <FileText className="h-4 w-4" />
              Ver Anexo
              <Download className="h-3 w-3" />
            </Button>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Criado em {format(new Date(ticket.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          </p>
        </CardContent>
      </Card>

      <Card className="flex flex-col h-[400px]">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-sm">Conversa</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Nenhuma mensagem ainda
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
        
        {!isTicketClosed && (
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
        )}
        
        {isTicketClosed && (
          <div className="p-4 border-t bg-muted/50">
            <p className="text-sm text-muted-foreground text-center">
              Este ticket está {ticket.status === "resolved" ? "resolvido" : "fechado"}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TicketChat;
