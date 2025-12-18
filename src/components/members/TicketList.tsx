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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Plus, MessageSquare, Clock, AlertCircle, CheckCircle, Loader2, Paperclip, FileText, CalendarIcon, Tag, Eye } from "lucide-react";
import { format, addDays, isWeekend, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { notifyAdmins } from "@/lib/notifications";
import { serviceCategories, getCategoryById, groupedCategories } from "@/lib/pricing-categories";
import TicketChat from "./TicketChat";

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
  opportunity_id: string | null;
  created_at: string;
  updated_at: string;
}

interface TicketListProps {
  isPaidSubscriber: boolean;
  defaultCategory?: string;
  defaultTitle?: string;
  openCreateModal?: boolean;
  onCreateModalChange?: (open: boolean) => void;
  opportunityId?: string; // Filter tickets by opportunity, or show all if undefined
}

// Brazilian holidays calculation
const getEasterDate = (year: number): Date => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
};

const getBrazilianHolidays = (year: number): Date[] => {
  const easter = getEasterDate(year);
  const fixedHolidays = [
    new Date(year, 0, 1),
    new Date(year, 3, 21),
    new Date(year, 4, 1),
    new Date(year, 8, 7),
    new Date(year, 9, 12),
    new Date(year, 10, 2),
    new Date(year, 10, 15),
    new Date(year, 11, 25),
  ];
  const movableHolidays = [
    addDays(easter, -48),
    addDays(easter, -47),
    addDays(easter, -2),
    addDays(easter, 60),
  ];
  return [...fixedHolidays, ...movableHolidays];
};

const isBrazilianHoliday = (date: Date): boolean => {
  const year = date.getFullYear();
  const holidays = getBrazilianHolidays(year);
  const dateStr = format(date, 'yyyy-MM-dd');
  return holidays.some(h => format(h, 'yyyy-MM-dd') === dateStr);
};

const isBusinessDay = (date: Date): boolean => {
  return !isWeekend(date) && !isBrazilianHoliday(date);
};

const addBusinessDays = (date: Date, days: number): Date => {
  let result = new Date(date);
  let addedDays = 0;
  while (addedDays < days) {
    result = addDays(result, 1);
    if (isBusinessDay(result)) {
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
  return !isBefore(selectedDate, minDeadline) && isBusinessDay(date);
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: "Aberto", color: "bg-blue-500", icon: <Clock className="h-3 w-3" /> },
  in_progress: { label: "Em andamento", color: "bg-yellow-500", icon: <AlertCircle className="h-3 w-3" /> },
  resolved: { label: "Resolvido", color: "bg-green-500", icon: <CheckCircle className="h-3 w-3" /> },
  closed: { label: "Fechado", color: "bg-gray-500", icon: <CheckCircle className="h-3 w-3" /> }
};

const TicketList = ({ isPaidSubscriber, defaultCategory, defaultTitle, openCreateModal, onCreateModalChange, opportunityId }: TicketListProps) => {
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
  const [newCategory, setNewCategory] = useState<string>("");
  const [includeUpgrade, setIncludeUpgrade] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Handle external modal control and default category/title
  useEffect(() => {
    if (openCreateModal) {
      setCreateModalOpen(true);
      if (defaultCategory) {
        setNewCategory(defaultCategory);
      }
      if (defaultTitle) {
        setNewTitle(defaultTitle);
      }
    }
  }, [openCreateModal, defaultCategory, defaultTitle]);

  // Sync modal state with parent
  useEffect(() => {
    if (onCreateModalChange) {
      onCreateModalChange(createModalOpen);
    }
  }, [createModalOpen, onCreateModalChange]);

  // Get selected category details
  const selectedCategory = getCategoryById(newCategory);
  const upgradeCategory = getCategoryById("inclui-socio");
  const isTechnicalService = selectedCategory?.category === "Técnico";
  
  const displayPrice = selectedCategory 
    ? (isPaidSubscriber ? selectedCategory.priceSubscriber : selectedCategory.priceRegular)
    : null;
  const upgradePrice = upgradeCategory
    ? (isPaidSubscriber ? upgradeCategory.priceSubscriber : upgradeCategory.priceRegular)
    : null;
  
  // Filter out Upgrade category from the dropdown
  const filteredCategories = Object.entries(groupedCategories).reduce((acc, [categoryName, items]) => {
    if (categoryName !== "Upgrade") {
      acc[categoryName] = items;
    }
    return acc;
  }, {} as Record<string, typeof serviceCategories>);

  useEffect(() => {
    fetchTickets();

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
  }, [user, opportunityId]);

  // Reset upgrade when category changes
  useEffect(() => {
    setIncludeUpgrade(false);
  }, [newCategory]);

  const fetchTickets = async () => {
    if (!user) return;

    let query = supabase
      .from('tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // If opportunityId is provided, filter by it; otherwise show all tickets
    // No filter means show all tickets (including those without opportunity)

    const { data, error } = await query;

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
    if (!user || !newCategory) return;

    setIsCreating(true);
    setIsUploading(true);

    let attachmentUrl: string | null = null;

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

      const { data: urlData } = await supabase.storage
        .from('ticket-files')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);

      attachmentUrl = urlData?.signedUrl || null;
    }

    setIsUploading(false);

    const category = getCategoryById(newCategory);
    const upgrade = getCategoryById("inclui-socio");
    const isTech = category?.category === "Técnico";
    
    let priceToStore = category 
      ? (isPaidSubscriber ? category.priceSubscriber : category.priceRegular)
      : null;
    
    let categoryToStore = newCategory;
    
    if (isTech && includeUpgrade && upgrade) {
      const upgradePriceValue = isPaidSubscriber ? upgrade.priceSubscriber : upgrade.priceRegular;
      priceToStore = `${priceToStore} + ${upgradePriceValue} (Upgrade)`;
      categoryToStore = `${newCategory}+upgrade`;
    }

    // Optimistic UI
    const tempId = `temp-${Date.now()}`;
    const tempTicket: Ticket = {
      id: tempId,
      title: newTitle,
      description: newDescription,
      status: 'open',
      priority: 'medium',
      deadline: newDeadline ? format(newDeadline, 'yyyy-MM-dd') : null,
      attachment_url: attachmentUrl,
      service_category: categoryToStore,
      service_price: priceToStore,
      opportunity_id: opportunityId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    setTickets(prev => [tempTicket, ...prev]);
    setCreateModalOpen(false);
    
    const { data, error } = await supabase
      .from('tickets')
      .insert({
        user_id: user.id,
        title: newTitle,
        description: newDescription,
        deadline: newDeadline ? format(newDeadline, 'yyyy-MM-dd') : null,
        attachment_url: attachmentUrl,
        service_category: categoryToStore,
        service_price: priceToStore,
        opportunity_id: opportunityId || null
      })
      .select()
      .single();

    setIsCreating(false);

    if (error) {
      setTickets(prev => prev.filter(t => t.id !== tempId));
      toast({
        title: "Erro",
        description: "Não foi possível criar o ticket",
        variant: "destructive"
      });
    } else {
      setTickets(prev => prev.map(t => t.id === tempId ? data : t));
      
      await supabase.from('ticket_events').insert({
        ticket_id: data.id,
        user_id: user.id,
        event_type: 'created',
        new_value: 'open',
      });
      
      notifyAdmins(
        'new_ticket',
        'Novo ticket criado',
        `Um usuário criou o ticket "${newTitle}" - ${category?.service || 'Sem categoria'}`,
        data.id
      );
      
      toast({
        title: "Ticket criado",
        description: "Seu ticket foi criado com sucesso"
      });
      
      setNewTitle("");
      setNewDescription("");
      setNewDeadline(getMinDeadline());
      setNewAttachment(null);
      setNewCategory("");
      setIncludeUpgrade(false);
    }
  };

  // Filter displayed tickets based on opportunityId if provided
  const displayedTickets = opportunityId 
    ? tickets.filter(t => t.opportunity_id === opportunityId)
    : tickets;

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
          <h2 className="text-2xl font-semibold text-foreground">
            {opportunityId ? "Tickets desta Oportunidade" : "Meus Tickets"}
          </h2>
          <p className="text-muted-foreground">
            {opportunityId ? "Tickets relacionados a esta oportunidade" : "Acompanhe suas solicitações de suporte"}
          </p>
        </div>
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Criar Novo Ticket</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <form onSubmit={handleCreateTicket} className="space-y-4 mt-4">
                {/* Service Category Selection */}
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria do Serviço *</Label>
                  <Select value={newCategory} onValueChange={setNewCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(filteredCategories).map(([categoryName, items]) => (
                        <div key={categoryName}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted">
                            {categoryName}
                          </div>
                          {items.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              <div className="flex flex-col">
                                <span>{item.service}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Selected Category Details */}
                {selectedCategory && (
                  <Card className="bg-muted/50 border-primary/20">
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{selectedCategory.service}</h4>
                          <p className="text-sm text-muted-foreground">{selectedCategory.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          {isPaidSubscriber ? (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground line-through">
                                {selectedCategory.priceRegular}
                              </p>
                              <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20 font-semibold">
                                {displayPrice}
                              </Badge>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground mb-1">Preço Avulso</p>
                              <Badge variant="secondary" className="font-semibold">
                                {displayPrice}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {selectedCategory.successFee !== "N/A" && (
                        <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                            📊 Honorários de Êxito: <span className="text-foreground">{selectedCategory.successFee}</span>
                          </p>
                        </div>
                      )}
                      
                      {isTechnicalService && upgradeCategory && (
                        <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-semibold">{upgradeCategory.service}</p>
                              <p className="text-xs text-muted-foreground">{upgradeCategory.description}</p>
                            </div>
                            <Switch 
                              checked={includeUpgrade} 
                              onCheckedChange={setIncludeUpgrade}
                            />
                          </div>
                          {includeUpgrade && (
                            <div className="flex items-center justify-between pt-2 border-t border-primary/10">
                              <span className="text-xs text-muted-foreground">Valor do Upgrade:</span>
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-semibold">
                                + {upgradePrice}
                              </Badge>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {!isPaidSubscriber && (
                        <div className="p-2 bg-primary/5 rounded-lg">
                          <p className="text-xs text-primary font-medium">
                            💡 Assinantes têm preços especiais. Considere assinar o Jornal de Licitações!
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    placeholder="Resumo do problema"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição *</Label>
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
                        disabled={(date) => !isValidDeadline(date)}
                        initialFocus
                        locale={ptBR}
                        className={cn("p-3 pointer-events-auto")}
                      />
                      <p className="text-xs text-muted-foreground p-3 pt-0">
                        Mínimo de 2 dias úteis (finais de semana e feriados excluídos)
                      </p>
                    </PopoverContent>
                  </Popover>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isCreating || isUploading || !newCategory}
                >
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
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : displayedTickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum ticket ainda</h3>
            <p className="text-muted-foreground text-center mb-4">
              {opportunityId ? "Nenhum ticket para esta oportunidade" : "Crie seu primeiro ticket para solicitar suporte"}
            </p>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {displayedTickets.map((ticket) => {
            const category = ticket.service_category ? getCategoryById(ticket.service_category) : null;
            return (
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
                      <div className="flex flex-wrap gap-2 mt-2">
                        {ticket.attachment_url && (
                          <Badge variant="outline" className="gap-1 w-fit">
                            <FileText className="h-3 w-3" />
                            Anexo
                          </Badge>
                        )}
                        {category && (
                          <Badge variant="outline" className="gap-1 w-fit bg-primary/5">
                            <Tag className="h-3 w-3" />
                            {category.service}
                          </Badge>
                        )}
                        {ticket.service_price && (
                          <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20">
                            {ticket.service_price}
                          </Badge>
                        )}
                        {ticket.opportunity_id && (
                          <Badge variant="outline" className="gap-1 w-fit bg-blue-500/10 text-blue-600 border-blue-500/20">
                            <Eye className="h-3 w-3" />
                            Vinculado
                          </Badge>
                        )}
                      </div>
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TicketList;
