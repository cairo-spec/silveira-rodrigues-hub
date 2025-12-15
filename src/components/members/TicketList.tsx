import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Plus, MessageSquare, Clock, AlertCircle, CheckCircle, Loader2, Paperclip, FileText, CalendarIcon } from "lucide-react";
import { format, addDays, isWeekend, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import TicketChat from "./TicketChat";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  deadline: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
}

// Calculate minimum deadline (2 business days from today)
const addBusinessDays = (date: Date, days: number): Date => {
  let result = new Date(date);
  let addedDays = 0;
  
  while (addedDays < days) {
    result = addDays(result, 1);
    if (!isWeekend(result)) {
      addedDays++;
    }
  }
  
  return result;
};

const getMinDeadline = (): Date => {
  return addBusinessDays(new Date(), 2);
};

const isValidDeadline = (date: Date): boolean => {
  const minDeadline = startOfDay(getMinDeadline());
  const selectedDate = startOfDay(date);
  return !isBefore(selectedDate, minDeadline);
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: "Aberto", color: "bg-blue-500", icon: <Clock className="h-3 w-3" /> },
  in_progress: { label: "Em andamento", color: "bg-yellow-500", icon: <AlertCircle className="h-3 w-3" /> },
  resolved: { label: "Resolvido", color: "bg-green-500", icon: <CheckCircle className="h-3 w-3" /> },
  closed: { label: "Fechado", color: "bg-gray-500", icon: <CheckCircle className="h-3 w-3" /> }
};


const TicketList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // New ticket form
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDeadline, setNewDeadline] = useState<Date | undefined>(getMinDeadline());
  const [newAttachment, setNewAttachment] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchTickets();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('tickets-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchTickets = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus tickets",
        variant: "destructive"
      });
    } else {
      setTickets(data || []);
    }
    setIsLoading(false);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsCreating(true);
    setIsUploading(true);

    let attachmentUrl: string | null = null;

    // Upload attachment if provided
    if (newAttachment) {
      const fileExt = newAttachment.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ticket-files')
        .upload(filePath, newAttachment);

      if (uploadError) {
        toast({
          title: "Erro",
          description: "Não foi possível fazer upload do anexo",
          variant: "destructive"
        });
        setIsCreating(false);
        setIsUploading(false);
        return;
      }

      // Get signed URL for private bucket
      const { data: urlData } = await supabase.storage
        .from('ticket-files')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

      attachmentUrl = urlData?.signedUrl || null;
    }

    setIsUploading(false);

    const { error } = await supabase
      .from('tickets')
      .insert({
        user_id: user.id,
        title: newTitle,
        description: newDescription,
        deadline: newDeadline ? format(newDeadline, 'yyyy-MM-dd') : null,
        attachment_url: attachmentUrl
      });

    setIsCreating(false);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o ticket",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Ticket criado",
        description: "Seu ticket foi criado com sucesso"
      });
      setCreateModalOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewDeadline(getMinDeadline());
      setNewAttachment(null);
      fetchTickets();
    }
  };

  if (selectedTicket) {
    return (
      <TicketChat 
        ticket={selectedTicket} 
        onBack={() => setSelectedTicket(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Meus Tickets</h2>
          <p className="text-muted-foreground">Acompanhe suas solicitações de suporte</p>
        </div>
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTicket} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  placeholder="Resumo do problema"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva detalhadamente seu problema ou solicitação"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={6}
                  maxLength={5000}
                  required
                />
                <p className="text-xs text-muted-foreground text-right">
                  {newDescription.length}/5000 caracteres
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="attachment">Anexo (opcional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="attachment"
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    onChange={(e) => setNewAttachment(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                </div>
                {newAttachment && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Paperclip className="h-3 w-3" />
                    {newAttachment.name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Prazo</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newDeadline && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newDeadline ? format(newDeadline, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={newDeadline}
                      onSelect={setNewDeadline}
                      disabled={(date) => !isValidDeadline(date) || isWeekend(date)}
                      initialFocus
                      locale={ptBR}
                      className={cn("p-3 pointer-events-auto")}
                    />
                    <p className="text-xs text-muted-foreground p-3 pt-0">
                      Mínimo de 2 dias úteis (finais de semana excluídos)
                    </p>
                  </PopoverContent>
                </Popover>
              </div>
              <Button type="submit" className="w-full" disabled={isCreating || isUploading}>
                {(isCreating || isUploading) ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {isUploading ? "Enviando anexo..." : "Criando..."}
                  </>
                ) : (
                  "Criar Ticket"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum ticket ainda</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie seu primeiro ticket para solicitar suporte
            </p>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <Card 
              key={ticket.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedTicket(ticket)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{ticket.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {ticket.description}
                    </CardDescription>
                    {ticket.attachment_url && (
                      <Badge variant="outline" className="mt-2 gap-1 w-fit">
                        <FileText className="h-3 w-3" />
                        Anexo
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge 
                      variant="secondary" 
                      className={`${statusConfig[ticket.status]?.color} text-white`}
                    >
                      {statusConfig[ticket.status]?.icon}
                      <span className="ml-1">{statusConfig[ticket.status]?.label}</span>
                    </Badge>
                    {ticket.deadline && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {format(new Date(ticket.deadline), "dd/MM/yyyy")}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">
                  Criado em {format(new Date(ticket.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TicketList;
