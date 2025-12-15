import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, ArrowLeft, Send, User, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { clearNotificationsByReference } from "@/lib/notifications";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  user_id: string;
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
  resolved: { label: "Resolvido", color: "bg-green-500" },
  closed: { label: "Fechado", color: "bg-gray-500" }
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Baixa", color: "bg-slate-400" },
  medium: { label: "Média", color: "bg-blue-400" },
  high: { label: "Alta", color: "bg-orange-400" },
  urgent: { label: "Urgente", color: "bg-red-500" }
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
      
      // Clear notifications for this ticket when admin views it
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
          // Clear notifications when new message arrives while viewing
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

    // Fetch profiles for each ticket
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
    // Get ticket info before update
    const ticket = tickets.find(t => t.id === ticketId);
    
    const { error } = await supabase
      .from('tickets')
      .update({ status: newStatus as any })
      .eq('id', ticketId);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível atualizar status", variant: "destructive" });
    } else {
      // Create notification for user
      if (ticket) {
        const statusLabels: Record<string, string> = {
          open: "Aberto",
          in_progress: "Em andamento", 
          resolved: "Resolvido",
          closed: "Fechado"
        };
        
        await supabase.from('notifications').insert({
          user_id: ticket.user_id,
          type: 'ticket_status',
          title: 'Status do ticket atualizado',
          message: `O ticket "${ticket.title}" foi alterado para ${statusLabels[newStatus] || newStatus}`,
          reference_id: ticketId
        });
      }
      
      toast({ title: "Status atualizado" });
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newMessage.trim()) return;

    setIsSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: selectedTicket.id,
        user_id: user?.id,
        message: newMessage.trim(),
        is_admin: true
      });

    if (!error) {
      // Create notification for ticket owner
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
    }
  };

  const filteredTickets = tickets.filter(t => statusFilter === "all" || t.status === statusFilter);

  if (selectedTicket) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedTicket(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{selectedTicket.title}</h2>
            <p className="text-sm text-muted-foreground">
              {selectedTicket.profiles?.nome} • {selectedTicket.profiles?.email}
            </p>
          </div>
          <Select value={selectedTicket.status} onValueChange={(v) => handleStatusChange(selectedTicket.id, v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Aberto</SelectItem>
              <SelectItem value="in_progress">Em andamento</SelectItem>
              <SelectItem value="resolved">Resolvido</SelectItem>
              <SelectItem value="closed">Fechado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Descrição</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{selectedTicket.description}</p>
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
                placeholder="Responder ao usuário..."
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
            <SelectItem value="resolved">Resolvidos</SelectItem>
            <SelectItem value="closed">Fechados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium">Nenhum ticket encontrado</h3>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="cursor-pointer hover:shadow-md" onClick={() => setSelectedTicket(ticket)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">{ticket.title}</CardTitle>
                    <CardDescription>{ticket.profiles?.nome} • {ticket.profiles?.email}</CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge className={`${statusConfig[ticket.status]?.color} text-white`}>
                      {statusConfig[ticket.status]?.label}
                    </Badge>
                    <Badge className={`${priorityConfig[ticket.priority]?.color} text-white border-0`}>
                      {priorityConfig[ticket.priority]?.label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">
                  {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTickets;
