import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, ArrowLeft, Send, User, ShieldCheck, CalendarIcon, Tag, RefreshCw, FileText, Download, Paperclip, X, Trash2, Archive, FolderOpen } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { clearNotificationsByReference } from "@/lib/notifications";
import { getCategoryById } from "@/lib/pricing-categories";
import { cn } from "@/lib/utils";
import LinkifiedText from "@/components/ui/linkified-text";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  deadline: string | null;
  service_category: string | null;
  service_price: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_archived: boolean;
  profiles?: { nome: string; email: string } | null;
}

interface TicketMessage {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: "Aberto", color: "bg-blue-500" },
  in_progress: { label: "Em andamento", color: "bg-yellow-500" },
  under_review: { label: "Em revisão", color: "bg-purple-500" },
  resolved: { label: "Concluído", color: "bg-green-500" },
  closed: { label: "Cancelado", color: "bg-gray-500" }
};

const AdminTickets = () => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<"current" | "archive">("current");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTickets();

    const channel = supabase
      .channel('admin-tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => fetchTickets())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      
      clearNotificationsByReference(selectedTicket.id);
      
      const channel = supabase
        .channel(`admin-ticket-${selectedTicket.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'ticket_messages',
          filter: `ticket_id=eq.${selectedTicket.id}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as TicketMessage]);
          clearNotificationsByReference(selectedTicket.id);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedTicket]);

  const fetchTickets = async () => {
    const { data: ticketsData, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Erro", description: "Não foi possível carregar tickets", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const userIds = [...new Set(ticketsData?.map(t => t.user_id) || [])];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, nome, email')
      .in('user_id', userIds);

    const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
    const ticketsWithProfiles = ticketsData?.map(ticket => ({
      ...ticket,
      profiles: profilesMap.get(ticket.user_id) || null
    })) || [];

    setTickets(ticketsWithProfiles);
    setIsLoading(false);
  };

  const fetchMessages = async (ticketId: string) => {
    const { data } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    
    const { error } = await supabase
      .from('tickets')
      .update({ status: newStatus as any })
      .eq('id', ticketId);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível atualizar status", variant: "destructive" });
    } else {
      if (ticket) {
        const statusLabels: Record<string, string> = {
          open: "Aberto",
          in_progress: "Em andamento", 
          resolved: "Concluído",
          closed: "Cancelado"
        };
        
        await supabase.rpc('notify_admins', {
          _type: 'ticket_status',
          _title: 'Status do ticket atualizado',
          _message: `O ticket "${ticket.title}" foi alterado para ${statusLabels[newStatus] || newStatus}`,
          _reference_id: ticketId
        }).then(() => {
          // Also notify the user
          supabase.from('notifications').insert({
            user_id: ticket.user_id,
            type: 'ticket_status',
            title: 'Status do ticket atualizado',
            message: `O ticket "${ticket.title}" foi alterado para ${statusLabels[newStatus] || newStatus}`,
            reference_id: ticketId
          });
        });
      }
      
      toast({ title: "Status atualizado" });
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
      }
    }
  };

  const handleReopenTicket = async (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    // Check if ticket was closed within last 30 days of inactivity (only for reopening canceled tickets)
    if (ticket.status === 'closed') {
      const daysSinceClosed = differenceInDays(new Date(), new Date(ticket.updated_at));
      if (daysSinceClosed > 30) {
        toast({ 
          title: "Erro", 
          description: "Este ticket foi cancelado há mais de 30 dias e não pode ser reaberto", 
          variant: "destructive" 
        });
        return;
      }
    }

    if (ticket.status === 'resolved') {
      toast({ 
        title: "Erro", 
        description: "Tickets concluídos não podem ser reabertos", 
        variant: "destructive" 
      });
      return;
    }

    await handleStatusChange(ticketId, 'open');
  };

  const handleDeleteTicket = async (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    // Delete related messages first
    await supabase.from('ticket_messages').delete().eq('ticket_id', ticketId);
    
    // Delete related events
    await supabase.from('ticket_events').delete().eq('ticket_id', ticketId);
    
    // Delete related notifications
    await supabase.from('notifications').delete().eq('reference_id', ticketId);

    // Delete the ticket
    const { error } = await supabase.from('tickets').delete().eq('id', ticketId);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível deletar o ticket", variant: "destructive" });
    } else {
      toast({ title: "Ticket deletado com sucesso" });
      setSelectedTicket(null);
      fetchTickets();
    }
  };

  const canDeleteTicket = (ticket: Ticket) => {
    return ticket.status === 'closed' && differenceInDays(new Date(), new Date(ticket.updated_at)) >= 5;
  };

  const canArchiveTicket = (ticket: Ticket) => {
    return ticket.status === 'resolved' && !ticket.is_archived && differenceInDays(new Date(), new Date(ticket.updated_at)) >= 5;
  };

  const handleArchiveTicket = async (ticketId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    const { error } = await supabase
      .from('tickets')
      .update({ is_archived: true })
      .eq('id', ticketId);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível arquivar o ticket", variant: "destructive" });
    } else {
      toast({ title: "Ticket arquivado com sucesso" });
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, is_archived: true } : null);
      }
      fetchTickets();
    }
  };

  const handleUnarchiveTicket = async (ticketId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    const { error } = await supabase
      .from('tickets')
      .update({ is_archived: false })
      .eq('id', ticketId);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível desarquivar o ticket", variant: "destructive" });
    } else {
      toast({ title: "Ticket restaurado com sucesso" });
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, is_archived: false } : null);
      }
      fetchTickets();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || (!newMessage.trim() && !attachment)) return;

    setIsSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    let messageText = newMessage.trim();

    // Handle file upload
    if (attachment) {
      setIsUploading(true);
      const fileExt = attachment.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `ticket/${selectedTicket.id}/${fileName}`;

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
      .from('ticket_messages')
      .insert({
        ticket_id: selectedTicket.id,
        user_id: user?.id,
        message: messageText,
        is_admin: true
      });

    if (!error) {
      await supabase.from('notifications').insert({
        user_id: selectedTicket.user_id,
        type: 'ticket_message',
        title: 'Nova resposta no ticket',
        message: `Você recebeu uma resposta no ticket "${selectedTicket.title}"`,
        reference_id: selectedTicket.id
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

  const currentTickets = tickets.filter(t => !t.is_archived);
  const archivedTickets = tickets.filter(t => t.is_archived);
  const displayTickets = viewMode === "current" ? currentTickets : archivedTickets;
  const filteredTickets = displayTickets.filter(t => statusFilter === "all" || t.status === statusFilter);

  if (selectedTicket) {
    const category = selectedTicket.service_category ? getCategoryById(selectedTicket.service_category) : null;
    const canReopen = selectedTicket.status === 'closed' && 
                      differenceInDays(new Date(), new Date(selectedTicket.updated_at)) <= 30;
    const canDelete = canDeleteTicket(selectedTicket);
    const hasAttachment = selectedTicket.attachment_url;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedTicket(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold">{selectedTicket.title}</h2>
              {hasAttachment && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => window.open(selectedTicket.attachment_url!, '_blank')}
                >
                  <FileText className="h-4 w-4" />
                  <Download className="h-3 w-3" />
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedTicket.profiles?.nome} • {selectedTicket.profiles?.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canReopen && (
              <Button variant="outline" size="sm" onClick={() => handleReopenTicket(selectedTicket.id)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reabrir
              </Button>
            )}
            {canDelete && (
              <Button variant="destructive" size="sm" onClick={() => handleDeleteTicket(selectedTicket.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar
              </Button>
            )}
            {canArchiveTicket(selectedTicket) && (
              <Button variant="outline" size="sm" onClick={() => handleArchiveTicket(selectedTicket.id)}>
                <Archive className="h-4 w-4 mr-2" />
                Arquivar
              </Button>
            )}
            {selectedTicket.is_archived && (
              <Button variant="outline" size="sm" onClick={() => handleUnarchiveTicket(selectedTicket.id)}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Restaurar
              </Button>
            )}
            <Select value={selectedTicket.status} onValueChange={(v) => handleStatusChange(selectedTicket.id, v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Aberto</SelectItem>
                <SelectItem value="in_progress">Em andamento</SelectItem>
                <SelectItem value="under_review">Em revisão</SelectItem>
                <SelectItem value="resolved">Concluído</SelectItem>
                <SelectItem value="closed">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Descrição</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">{selectedTicket.description}</p>
            <div className="flex flex-wrap gap-2">
              {category && (
                <Badge variant="outline" className="gap-1 bg-primary/5">
                  <Tag className="h-3 w-3" />
                  {category.service}
                </Badge>
              )}
              {selectedTicket.service_price && (
                <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20">
                  {selectedTicket.service_price}
                </Badge>
              )}
              {category?.successFee && category.successFee !== "N/A" && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  Êxito: {category.successFee}
                </Badge>
              )}
              {selectedTicket.deadline && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  Prazo: {format(new Date(selectedTicket.deadline), "dd/MM/yyyy")}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-[400px]">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-sm">Conversa</CardTitle>
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
                    <p className="text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                      <LinkifiedText text={msg.message} />
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(msg.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
          {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
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
                  placeholder="Responder ao usuário..."
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
                  className="min-h-[40px] max-h-[120px] resize-none"
                  rows={1}
                />
                <Button type="submit" size="icon" disabled={isSending || (!newMessage.trim() && !attachment)}>
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tickets de Suporte</h2>
          <p className="text-muted-foreground">Gerencie todos os tickets</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filtrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="open">Abertos</SelectItem>
            <SelectItem value="in_progress">Em andamento</SelectItem>
            <SelectItem value="under_review">Em revisão</SelectItem>
            <SelectItem value="resolved">Concluídos</SelectItem>
            <SelectItem value="closed">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "current" | "archive")}>
        <TabsList>
          <TabsTrigger value="current" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Atual ({currentTickets.length})
          </TabsTrigger>
          <TabsTrigger value="archive" className="gap-2">
            <Archive className="h-4 w-4" />
            Arquivo ({archivedTickets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={viewMode} className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : filteredTickets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium">
                  {viewMode === "current" ? "Nenhum ticket atual encontrado" : "Nenhum ticket arquivado"}
                </h3>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredTickets.map((ticket) => {
                const category = ticket.service_category ? getCategoryById(ticket.service_category) : null;
                const showArchiveButton = canArchiveTicket(ticket);
                const hasUpgrade = ticket.service_category?.includes('+upgrade');
                return (
                  <Card 
                    key={ticket.id} 
                    className={cn(
                      "cursor-pointer hover:shadow-md",
                      hasUpgrade && "border-2 border-amber-400 bg-amber-50/30 dark:bg-amber-950/10"
                    )} 
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{ticket.title}</CardTitle>
                          <CardDescription>{ticket.profiles?.nome} • {ticket.profiles?.email}</CardDescription>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {category && (
                              <Badge variant="outline" className="gap-1 bg-primary/5">
                                <Tag className="h-3 w-3" />
                                {category.service}
                              </Badge>
                            )}
                            {ticket.service_price && (
                              <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20">
                                {ticket.service_price}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <Badge className={`${statusConfig[ticket.status]?.color} text-white`}>
                            {statusConfig[ticket.status]?.label}
                          </Badge>
                          {ticket.deadline && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {format(new Date(ticket.deadline), "dd/MM/yyyy")}
                            </Badge>
                          )}
                          {showArchiveButton && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-1"
                              onClick={(e) => handleArchiveTicket(ticket.id, e)}
                            >
                              <Archive className="h-3 w-3" />
                              Arquivar
                            </Button>
                          )}
                          {ticket.is_archived && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-1"
                              onClick={(e) => handleUnarchiveTicket(ticket.id, e)}
                            >
                              <FolderOpen className="h-3 w-3" />
                              Restaurar
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminTickets;