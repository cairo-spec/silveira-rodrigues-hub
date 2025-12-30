import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Loader2, User, ShieldCheck, FileText, Download, History, Paperclip, X, Eye, Tag, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import LinkifiedText from "@/components/ui/linkified-text";
import { notifyAdmins, clearNotificationsByReference } from "@/lib/notifications";
import TicketTimeline from "./TicketTimeline";
import { getCategoryById } from "@/lib/pricing-categories";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  deadline: string | null;
  attachment_url: string | null;
  service_category: string | null;
  service_price: string | null;
  opportunity_id?: string | null;
  created_at: string;
}

interface TicketChatProps {
  ticket: Ticket;
  onBack: () => void;
  onViewOpportunity?: (opportunityId: string) => void;
}

const statusLabels: Record<string, string> = {
  open: "Aberto",
  in_progress: "Em andamento",
  under_review: "Em revisão",
  resolved: "Resolvido",
  closed: "Fechado"
};

const statusColors: Record<string, string> = {
  open: "bg-blue-500",
  in_progress: "bg-amber-500",
  under_review: "bg-purple-500",
  resolved: "bg-green-500",
  closed: "bg-muted"
};

const TicketChat = ({ ticket, onBack, onViewOpportunity }: TicketChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [opportunityTitle, setOpportunityTitle] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMessages();
    
    // Fetch opportunity title if ticket has opportunity_id
    if (ticket.opportunity_id) {
      fetchOpportunityTitle();
    }
    
    clearNotificationsByReference(ticket.id);

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
          clearNotificationsByReference(ticket.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticket.id, ticket.opportunity_id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchOpportunityTitle = async () => {
    if (!ticket.opportunity_id) return;
    
    const { data } = await supabase
      .from('audited_opportunities')
      .select('title')
      .eq('id', ticket.opportunity_id)
      .single();
    
    if (data) {
      setOpportunityTitle(data.title);
    }
  };

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
    if (!user || (!newMessage.trim() && !attachment)) return;

    setIsSending(true);
    let messageText = newMessage.trim();

    if (attachment) {
      setIsUploading(true);
      const fileExt = attachment.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `ticket/${ticket.id}/${fileName}`;

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
      .from('ticket_messages')
      .insert({
        ticket_id: ticket.id,
        user_id: user.id,
        message: messageText,
        is_admin: false
      });

    if (!error) {
      notifyAdmins(
        'ticket_message',
        'Nova mensagem em ticket',
        `O usuário enviou uma mensagem no ticket "${ticket.title}"`,
        ticket.id,
        user.id
      );
      
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso"
      });
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file);
    }
  };

  const isTicketClosed = ticket.status === "resolved";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-foreground">{ticket.title}</h2>
          <Badge variant="secondary" className={`mt-1 text-white ${statusColors[ticket.status]}`}>
            {statusLabels[ticket.status]}
          </Badge>
        </div>
        {/* Ver Oportunidade button when ticket has opportunity_id */}
        {ticket.opportunity_id && onViewOpportunity && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onViewOpportunity(ticket.opportunity_id!)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Ver Oportunidade
          </Button>
        )}
      </div>

      {/* Opportunity link info */}
      {ticket.opportunity_id && opportunityTitle && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="py-3 flex items-center gap-2">
            <Eye className="h-4 w-4 text-blue-600" />
            <button
              onClick={() => onViewOpportunity?.(ticket.opportunity_id!)}
              className="text-sm text-left hover:underline text-blue-600 dark:text-blue-400"
            >
              Vinculado à oportunidade: <strong>{opportunityTitle}</strong>
            </button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Descrição original
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
          
          {/* Service info badges - same as admin view */}
          {(() => {
            const category = ticket.service_category ? getCategoryById(ticket.service_category.replace('+upgrade', '')) : null;
            const hasUpgrade = ticket.service_category?.includes('+upgrade');
            return (
              <div className="flex flex-wrap gap-2">
                {category && (
                  <Badge variant="outline" className="gap-1 bg-primary/5">
                    <Tag className="h-3 w-3" />
                    {category.service}
                    {hasUpgrade && " + Upgrade"}
                  </Badge>
                )}
                {ticket.service_price && (
                  <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20">
                    {ticket.service_price}
                  </Badge>
                )}
                {category?.successFee && category.successFee !== "N/A" && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    Êxito: {category.successFee}
                  </Badge>
                )}
                {ticket.deadline && (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    Prazo: {format(new Date(ticket.deadline), "dd/MM/yyyy")}
                  </Badge>
                )}
              </div>
            );
          })()}
          
          {ticket.attachment_url && (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => window.open(ticket.attachment_url!, '_blank')}
            >
              <FileText className="h-4 w-4" />
              Ver Anexo
              <Download className="h-3 w-3" />
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            Criado em {format(new Date(ticket.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          </p>
        </CardContent>
      </Card>

      <Collapsible open={timelineOpen} onOpenChange={setTimelineOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Timeline de Auditoria
            </span>
            <Badge variant="secondary" className="ml-2">
              {timelineOpen ? "Ocultar" : "Mostrar"}
            </Badge>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <Card>
            <CardContent className="pt-4">
              <TicketTimeline ticketId={ticket.id} ticketCreatedAt={ticket.created_at} />
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      <Card className="flex flex-col h-[400px] md:h-[calc(100vh-480px)] min-h-[400px]">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-sm font-semibold">Conversa</CardTitle>
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
                <div className={`max-w-[85%] ${message.is_admin ? "" : "text-right"}`}>
                  <div className={`rounded-lg p-3 inline-block max-w-full ${
                    message.is_admin 
                      ? "bg-muted text-foreground" 
                      : "bg-primary text-primary-foreground"
                  }`}>
                    <p className="text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                      <LinkifiedText text={message.message} />
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(message.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        
        {!isTicketClosed && (
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
              <Textarea
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    if (newMessage.trim() || attachment) {
                      handleSendMessage(e as any);
                    }
                  }
                }}
                className="min-h-[120px] max-h-[200px] resize-none"
                rows={5}
              />
              <Button type="submit" size="icon" disabled={isSending || (!newMessage.trim() && !attachment)}>
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
