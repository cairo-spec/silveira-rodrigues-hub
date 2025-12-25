import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, FileText, Search, ExternalLink, Download, Calendar, Building2, X, ClipboardList, CheckCircle, Settings2, Headphones, RefreshCw } from "lucide-react";
import { SearchCriteriaModal } from "./SearchCriteriaModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import LeadCaptureModal from "@/components/LeadCaptureModal";
import { useToast } from "@/hooks/use-toast";
import { notifyAdmins } from "@/lib/notifications";

const ASAAS_CHECKOUT_URL = "https://www.asaas.com/c/g8pj49zuijh6swzc";

type GoNoGoStatus = "Go" | "No_Go" | "Review_Required" | "Solicitada" | "Rejeitada" | "Participando" | "Vencida" | "Perdida";

interface Opportunity {
  id: string;
  title: string;
  opportunity_url: string | null;
  opportunity_abstract: string | null;
  closing_date: string;
  agency_name: string;
  go_no_go: GoNoGoStatus;
  audit_report_path: string | null;
  petition_path: string | null;
  portal_url: string | null;
  estimated_value: number | null;
  is_published: boolean;
  created_at: string;
  report_requested_at: string | null;
}

interface JornalAuditadoProps {
  isSubscriber: boolean;
  onRequestParecer?: (opportunityId: string, opportunityTitle: string, category?: string) => void;
  selectedOpportunityId?: string;
  onOpportunityClose?: () => void;
  onShowTickets?: (opportunityId?: string) => void;
}

const JornalAuditado = ({ 
  isSubscriber, 
  onRequestParecer, 
  selectedOpportunityId,
  onOpportunityClose,
  onShowTickets
}: JornalAuditadoProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [isDownloadingPetition, setIsDownloadingPetition] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"noticias" | "andamento" | "concluidas">("noticias");
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [activeTicketsByOpportunity, setActiveTicketsByOpportunity] = useState<Map<string, number>>(new Map());
  const [concludedRecursoByOpportunity, setConcludedRecursoByOpportunity] = useState<Set<string>>(new Set());
  const [activeParecerByOpportunity, setActiveParecerByOpportunity] = useState<Set<string>>(new Set());
  const [activeImpugnacaoByOpportunity, setActiveImpugnacaoByOpportunity] = useState<Set<string>>(new Set());

  // Fetch active tickets count for opportunities
  const fetchActiveTickets = async (opportunityIds: string[]) => {
    if (opportunityIds.length === 0) return;

    // Fetch tickets that are NOT resolved or closed (active tickets)
    const { data: tickets } = await supabase
      .from("tickets")
      .select("opportunity_id, status")
      .in("opportunity_id", opportunityIds)
      .not("status", "in", "(resolved,closed)");

    const countMap = new Map<string, number>();
    tickets?.forEach((ticket) => {
      if (ticket.opportunity_id) {
        countMap.set(ticket.opportunity_id, (countMap.get(ticket.opportunity_id) || 0) + 1);
      }
    });
    setActiveTicketsByOpportunity(countMap);
  };

  // Fetch concluded recurso-administrativo tickets for opportunities
  const fetchConcludedRecursoTickets = async (opportunityIds: string[]) => {
    if (opportunityIds.length === 0) return;

    // Fetch tickets that are resolved/closed AND have recurso-administrativo category
    const { data: tickets } = await supabase
      .from("tickets")
      .select("opportunity_id, service_category, status")
      .in("opportunity_id", opportunityIds)
      .in("status", ["resolved", "closed"]);

    const recursoSet = new Set<string>();
    tickets?.forEach((ticket) => {
      if (ticket.opportunity_id && ticket.service_category) {
        // Check if service_category contains recurso-administrativo (with or without +upgrade)
        const baseCategory = ticket.service_category.replace('+upgrade', '');
        if (baseCategory === 'recurso-administrativo') {
          recursoSet.add(ticket.opportunity_id);
        }
      }
    });
    setConcludedRecursoByOpportunity(recursoSet);
  };

  // Fetch active parecer-go-no-go tickets for opportunities
  const fetchActiveParecerTickets = async (opportunityIds: string[]) => {
    if (opportunityIds.length === 0) return;

    // Fetch tickets that are NOT resolved or closed AND have parecer-go-no-go category
    const { data: tickets } = await supabase
      .from("tickets")
      .select("opportunity_id, service_category, status")
      .in("opportunity_id", opportunityIds)
      .not("status", "in", "(resolved,closed)");

    const parecerSet = new Set<string>();
    tickets?.forEach((ticket) => {
      if (ticket.opportunity_id && ticket.service_category) {
        // Check if service_category contains parecer-go-no-go (with or without +upgrade)
        const baseCategory = ticket.service_category.replace('+upgrade', '');
        if (baseCategory === 'parecer-go-no-go') {
          parecerSet.add(ticket.opportunity_id);
        }
      }
    });
    setActiveParecerByOpportunity(parecerSet);
  };

  // Fetch active impugnacao-edital tickets for opportunities
  const fetchActiveImpugnacaoTickets = async (opportunityIds: string[]) => {
    if (opportunityIds.length === 0) return;

    // Fetch tickets that are NOT resolved or closed AND have impugnacao-edital category
    const { data: tickets } = await supabase
      .from("tickets")
      .select("opportunity_id, service_category, status")
      .in("opportunity_id", opportunityIds)
      .not("status", "in", "(resolved,closed)");

    const impugnacaoSet = new Set<string>();
    tickets?.forEach((ticket) => {
      if (ticket.opportunity_id && ticket.service_category) {
        // Check if service_category contains impugnacao-edital (with or without +upgrade)
        const baseCategory = ticket.service_category.replace('+upgrade', '');
        if (baseCategory === 'impugnacao-edital') {
          impugnacaoSet.add(ticket.opportunity_id);
        }
      }
    });
    setActiveImpugnacaoByOpportunity(impugnacaoSet);
  };

  useEffect(() => {
    fetchOpportunities();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('opportunities-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audited_opportunities'
        },
        () => {
          fetchOpportunities();
        }
      )
      .subscribe();

    // Subscribe to ticket updates to refresh active tickets count
    const ticketChannel = supabase
      .channel('tickets-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets'
        },
        () => {
          // Refetch opportunities to get updated ticket counts
          fetchOpportunities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(ticketChannel);
    };
  }, [user]);

  // Auto-open opportunity from mention click
  useEffect(() => {
    if (selectedOpportunityId && opportunities.length > 0) {
      const opp = opportunities.find(o => o.id === selectedOpportunityId);
      if (opp) {
        setSelectedOpportunity(opp);
      }
    }
  }, [selectedOpportunityId, opportunities]);

  // Notify parent when opportunity is closed
  const handleCloseOpportunity = () => {
    setSelectedOpportunity(null);
    onOpportunityClose?.();
  };

  const fetchOpportunities = async () => {
    const wasLoading = opportunities.length === 0;
    if (wasLoading) setIsLoading(true);
    
    const { data, error } = await supabase
      .from("audited_opportunities")
      .select("*")
      .eq("is_published", true)
      .order("closing_date", { ascending: true });

    if (data) {
      setOpportunities(data as Opportunity[]);
      
      // Fetch active tickets for all opportunities
      const allOpportunityIds = (data as Opportunity[]).map(o => o.id);
      fetchActiveTickets(allOpportunityIds);
      fetchConcludedRecursoTickets(allOpportunityIds);
      fetchActiveParecerTickets(allOpportunityIds);
      fetchActiveImpugnacaoTickets(allOpportunityIds);
      
      // Update selected opportunity if it exists (for realtime updates)
      if (selectedOpportunity) {
        const updated = data.find(o => o.id === selectedOpportunity.id);
        if (updated) {
          setSelectedOpportunity(updated as Opportunity);
        } else {
          // Opportunity was unpublished or deleted
          setSelectedOpportunity(null);
        }
      }
    }

    if (wasLoading) setIsLoading(false);
  };

  const handleRequestReport = (opportunity: Opportunity) => {
    if (!isSubscriber) {
      setShowLeadModal(true);
    } else {
      downloadReport(opportunity);
    }
  };

  const handleSolicitarRelatorio = async (opportunity: Opportunity) => {
    if (!isSubscriber) {
      setShowLeadModal(true);
      return;
    }

    setIsUpdating(opportunity.id);
    const { error } = await supabase
      .from("audited_opportunities")
      .update({ 
        go_no_go: "Solicitada" as GoNoGoStatus,
        report_requested_at: new Date().toISOString()
      })
      .eq("id", opportunity.id);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível solicitar o relatório", variant: "destructive" });
    } else {
      // Notify admins about the request
      notifyAdmins(
        'ticket_status',
        'Relatório solicitado',
        `Cliente solicitou relatório para: "${opportunity.title}"`,
        opportunity.id,
        user?.id
      );
      
      toast({ title: "Relatório solicitado", description: "Aguarde a análise da nossa equipe" });
      fetchOpportunities();
      setSelectedOpportunity(null);
    }
    setIsUpdating(null);
  };

  const handleRejeitarOportunidade = async (opportunity: Opportunity) => {
    if (!isSubscriber) {
      setShowLeadModal(true);
      return;
    }

    setIsUpdating(opportunity.id);
    const { error } = await supabase
      .from("audited_opportunities")
      .update({ go_no_go: "Rejeitada" as GoNoGoStatus })
      .eq("id", opportunity.id);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível rejeitar a oportunidade", variant: "destructive" });
    } else {
      // Notify admins about the rejection
      notifyAdmins(
        'ticket_status',
        'Oportunidade rejeitada',
        `Cliente rejeitou a oportunidade: "${opportunity.title}"`,
        opportunity.id,
        user?.id
      );
      
      toast({ title: "Oportunidade rejeitada" });
      fetchOpportunities();
      setSelectedOpportunity(null);
    }
    setIsUpdating(null);
  };

  const handleSolicitarParecer = (opportunity: Opportunity) => {
    if (onRequestParecer) {
      onRequestParecer(opportunity.id, opportunity.title);
    }
    setSelectedOpportunity(null);
  };

  const handleParticipar = async (opportunity: Opportunity) => {
    if (!isSubscriber) {
      setShowLeadModal(true);
      return;
    }

    setIsUpdating(opportunity.id);
    const { error } = await supabase
      .from("audited_opportunities")
      .update({ 
        go_no_go: "Participando" as GoNoGoStatus,
        petition_path: null // Clear petition link when participating
      })
      .eq("id", opportunity.id);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível confirmar participação", variant: "destructive" });
    } else {
      notifyAdmins(
        'ticket_status',
        'Participação confirmada',
        `Cliente confirmou participação na oportunidade: "${opportunity.title}"`,
        opportunity.id,
        user?.id
      );
      
      toast({ title: "Participação confirmada!" });
      fetchOpportunities();
      setSelectedOpportunity(null);
    }
    setIsUpdating(null);
  };

  const handleVitoria = async (opportunity: Opportunity) => {
    if (!isSubscriber) {
      setShowLeadModal(true);
      return;
    }

    setIsUpdating(opportunity.id);
    
    // Note: Audit report file cleanup is handled by admins only via storage policies
    // Regular users can only update the database record
    
    const { error } = await supabase
      .from("audited_opportunities")
      .update({ 
        go_no_go: "Vencida" as GoNoGoStatus
      })
      .eq("id", opportunity.id);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível registrar vitória", variant: "destructive" });
    } else {
      notifyAdmins(
        'ticket_status',
        'Vitória registrada!',
        `Cliente registrou VITÓRIA na oportunidade: "${opportunity.title}"`,
        opportunity.id,
        user?.id
      );
      
      toast({ title: "Vitória registrada! 🎉" });
      fetchOpportunities();
      setSelectedOpportunity(null);
    }
    setIsUpdating(null);
  };

  const handleDerrota = async (opportunity: Opportunity) => {
    if (!isSubscriber) {
      setShowLeadModal(true);
      return;
    }

    setIsUpdating(opportunity.id);
    
    // Note: Audit report file cleanup is handled by admins only via storage policies
    // Regular users can only update the database record
    
    const { error } = await supabase
      .from("audited_opportunities")
      .update({ 
        go_no_go: "Perdida" as GoNoGoStatus
      })
      .eq("id", opportunity.id);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível registrar derrota", variant: "destructive" });
    } else {
      notifyAdmins(
        'ticket_status',
        'Derrota registrada',
        `Cliente registrou DERROTA na oportunidade: "${opportunity.title}"`,
        opportunity.id,
        user?.id
      );
      
      toast({ title: "Derrota registrada" });
      fetchOpportunities();
      setSelectedOpportunity(null);
    }
    setIsUpdating(null);
  };

  const handleDisputaRevertida = async (opportunity: Opportunity) => {
    if (!isSubscriber) {
      setShowLeadModal(true);
      return;
    }

    setIsUpdating(opportunity.id);
    
    const { error } = await supabase
      .from("audited_opportunities")
      .update({ 
        go_no_go: "Vencida" as GoNoGoStatus
      })
      .eq("id", opportunity.id);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível reverter a disputa", variant: "destructive" });
    } else {
      notifyAdmins(
        'ticket_status',
        'Disputa revertida!',
        `Cliente reverteu a disputa para VITÓRIA na oportunidade: "${opportunity.title}"`,
        opportunity.id,
        user?.id
      );
      
      toast({ title: "Disputa revertida! 🎉", description: "Oportunidade marcada como Vencida" });
      fetchOpportunities();
      setSelectedOpportunity(null);
    }
    setIsUpdating(null);
  };

  const downloadReport = (opportunity: Opportunity) => {
    if (!opportunity.audit_report_path) {
      return;
    }
    // audit_report_path is now a Google Drive URL
    window.open(opportunity.audit_report_path, "_blank");
  };

  const downloadPetition = (opportunity: Opportunity) => {
    if (!opportunity.petition_path) {
      return;
    }
    // petition_path is now a Google Drive URL
    window.open(opportunity.petition_path, "_blank");
  };

  const handleRequestPetition = (opportunity: Opportunity) => {
    if (!isSubscriber) {
      setShowLeadModal(true);
    } else {
      downloadPetition(opportunity);
    }
  };

  // Check if opportunity was requested and now has a report attached (eligible for "Solicitar Parecer")
  const canRequestParecer = (opp: Opportunity): boolean => {
    return opp.report_requested_at !== null && 
           opp.audit_report_path !== null && 
           opp.go_no_go === "Review_Required";
  };

  // Check if closing date has passed by at least 1 day (for showing Vitória/Derrota buttons)
  const isAfterClosingDate = (opp: Opportunity): boolean => {
    const closingDate = new Date(opp.closing_date);
    const oneDayAfterClosing = new Date(closingDate);
    oneDayAfterClosing.setDate(oneDayAfterClosing.getDate() + 1);
    return new Date() >= oneDayAfterClosing;
  };

  const getGoNoGoBadge = (status: GoNoGoStatus) => {
    switch (status) {
      case "Go":
        return (
          <Badge variant="outline" className="border-green-600 text-green-700 text-xs">
            GO
          </Badge>
        );
      case "No_Go":
        return (
          <Badge variant="outline" className="border-red-600 text-red-700 text-xs">
            NO GO
          </Badge>
        );
      case "Solicitada":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-600 text-xs">
            SOLICITADA
          </Badge>
        );
      case "Rejeitada":
        return (
          <Badge variant="outline" className="border-gray-500 text-gray-600 text-xs">
            REJEITADA
          </Badge>
        );
      case "Participando":
        return (
          <Badge variant="outline" className="border-emerald-500 text-emerald-600 text-xs">
            PARTICIPANDO
          </Badge>
        );
      case "Vencida":
        return (
          <Badge variant="outline" className="border-purple-600 text-purple-700 text-xs bg-purple-50">
            VENCIDA
          </Badge>
        );
      case "Perdida":
        return (
          <Badge variant="outline" className="border-orange-600 text-orange-700 text-xs bg-orange-50">
            PERDIDA
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-600 text-xs">
            ANÁLISE
          </Badge>
        );
    }
  };

  // Filter by search term first
  const searchFiltered = opportunities.filter((opp) =>
    opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opp.agency_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Then filter by tab
  const getTabFilteredOpportunities = () => {
    switch (activeTab) {
      case "andamento":
        return searchFiltered.filter(opp => opp.go_no_go === "Participando");
      case "concluidas":
        return searchFiltered.filter(opp => opp.go_no_go === "Vencida" || opp.go_no_go === "Perdida");
      default: // noticias
        return searchFiltered.filter(opp => 
          !["Participando", "Vencida", "Perdida"].includes(opp.go_no_go)
        );
    }
  };

  const filteredOpportunities = getTabFilteredOpportunities();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Jornal Auditado</h2>
          <p className="text-muted-foreground">Oportunidades de licitação analisadas pela nossa equipe</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button 
            variant="outline" 
            onClick={() => setShowCriteriaModal(true)}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Meus Critérios
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onShowTickets?.()}
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            Todos os Tickets
          </Button>
        </div>
      </div>

      <SearchCriteriaModal 
        open={showCriteriaModal} 
        onOpenChange={setShowCriteriaModal} 
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título ou agência..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="noticias">
            Notícias ({searchFiltered.filter(o => !["Participando", "Vencida", "Perdida"].includes(o.go_no_go)).length})
          </TabsTrigger>
          <TabsTrigger value="andamento">
            Em Andamento ({searchFiltered.filter(o => o.go_no_go === "Participando").length})
          </TabsTrigger>
          <TabsTrigger value="concluidas">
            Concluídas ({searchFiltered.filter(o => o.go_no_go === "Vencida" || o.go_no_go === "Perdida").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredOpportunities.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium">Nenhuma oportunidade nesta categoria</h3>
                <p className="text-muted-foreground text-sm">
                  {activeTab === "noticias" && (searchTerm ? "Tente buscar com outros termos" : "Aguarde novas publicações")}
                  {activeTab === "andamento" && "Oportunidades com participação confirmada aparecerão aqui"}
                  {activeTab === "concluidas" && "Licitações vencidas ou perdidas aparecerão aqui"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Desktop Table View */}
              <Card className="hidden md:block">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Agência</TableHead>
                        <TableHead className="text-center">Valor Estimado</TableHead>
                        <TableHead className="text-center">Data Limite</TableHead>
                        <TableHead className="text-center">Parecer</TableHead>
                        <TableHead className="text-center">Atendimento</TableHead>
                        <TableHead className="text-center">Relatório</TableHead>
                        <TableHead className="text-center">Petição</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOpportunities.map((opp) => (
                        <TableRow 
                          key={opp.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedOpportunity(opp)}
                        >
                          <TableCell className="font-medium max-w-[250px]">
                            <div className="truncate">{opp.title}</div>
                          </TableCell>
                          <TableCell>{opp.agency_name}</TableCell>
                          <TableCell className="text-center">
                            {opp.estimated_value ? (
                              <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(opp.estimated_value)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="whitespace-nowrap">
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(new Date(opp.closing_date), "dd/MM/yyyy")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {getGoNoGoBadge(opp.go_no_go)}
                          </TableCell>
                          <TableCell className="text-center">
                            {activeTicketsByOpportunity.get(opp.id) ? (
                              <Badge variant="outline" className="border-cyan-500 text-cyan-600 bg-cyan-50">
                                <Headphones className="h-3 w-3 mr-1" />
                                Atendimento
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant={isSubscriber ? "default" : "secondary"}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRequestReport(opp);
                              }}
                              disabled={!opp.audit_report_path || isDownloading === opp.id}
                            >
                              {isDownloading === opp.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : isSubscriber ? (
                                <>
                                  <Download className="h-4 w-4 mr-1" />
                                  Baixar
                                </>
                              ) : (
                                "Solicitar"
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant={isSubscriber ? "outline" : "secondary"}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRequestPetition(opp);
                              }}
                              disabled={!opp.petition_path || isDownloadingPetition === opp.id}
                            >
                              {isDownloadingPetition === opp.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : isSubscriber ? (
                                <>
                                  <Download className="h-4 w-4 mr-1" />
                                  Baixar
                                </>
                              ) : (
                                "Solicitar"
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {filteredOpportunities.map((opp) => (
                  <Card 
                    key={opp.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedOpportunity(opp)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base line-clamp-2">{opp.title}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Building2 className="h-3 w-3" />
                            {opp.agency_name}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          {getGoNoGoBadge(opp.go_no_go)}
                          {activeTicketsByOpportunity.get(opp.id) && (
                            <Badge variant="outline" className="border-cyan-500 text-cyan-600 bg-cyan-50 text-xs">
                              <Headphones className="h-3 w-3 mr-1" />
                              Atendimento
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(opp.closing_date), "dd/MM/yyyy")}
                          </Badge>
                          {opp.estimated_value && (
                            <Badge variant="secondary" className="text-xs bg-gold/10 text-gold border-gold/20">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(opp.estimated_value)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={isSubscriber ? "default" : "secondary"}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRequestReport(opp);
                            }}
                            disabled={!opp.audit_report_path || isDownloading === opp.id}
                          >
                            {isDownloading === opp.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <FileText className="h-4 w-4 mr-1" />
                                Rel
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant={isSubscriber ? "outline" : "secondary"}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRequestPetition(opp);
                            }}
                            disabled={!opp.petition_path || isDownloadingPetition === opp.id}
                          >
                            {isDownloadingPetition === opp.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-1" />
                                Pet
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Modal */}
      <Dialog open={!!selectedOpportunity} onOpenChange={() => handleCloseOpportunity()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedOpportunity?.title}</DialogTitle>
            <DialogDescription className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {selectedOpportunity?.agency_name}
            </DialogDescription>
          </DialogHeader>

          {selectedOpportunity && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 py-4">
                {getGoNoGoBadge(selectedOpportunity.go_no_go)}
                {activeTicketsByOpportunity.get(selectedOpportunity.id) && (
                  <Badge variant="outline" className="border-cyan-500 text-cyan-600 bg-cyan-50">
                    <Headphones className="h-3 w-3 mr-1" />
                    Atendimento
                  </Badge>
                )}
              </div>

              {/* Hide dates for completed opportunities */}
              {!["Vencida", "Perdida"].includes(selectedOpportunity.go_no_go) && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Data Limite</p>
                    <p className="font-medium">
                      {format(new Date(selectedOpportunity.closing_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Publicado em</p>
                    <p className="font-medium">
                      {format(new Date(selectedOpportunity.created_at), "dd/MM/yyyy")}
                    </p>
                  </div>
                </div>
              )}

              {/* Valor Estimado */}
              {selectedOpportunity.estimated_value && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Valor Estimado</p>
                  <p className="font-medium text-lg text-gold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOpportunity.estimated_value)}
                  </p>
                </div>
              )}

              {selectedOpportunity.opportunity_abstract && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Resumo</p>
                  <p className="text-sm bg-muted p-3 rounded-md">
                    {selectedOpportunity.opportunity_abstract}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-4">
                {/* Links - for Participando show both edital and portal */}
                {selectedOpportunity.go_no_go === "Participando" ? (
                  <>
                    {selectedOpportunity.opportunity_url && (
                      <Button variant="outline" asChild>
                        <a href={selectedOpportunity.opportunity_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Ver Edital Original
                        </a>
                      </Button>
                    )}
                    {selectedOpportunity.portal_url && (
                      <Button variant="default" asChild>
                        <a href={selectedOpportunity.portal_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Acessar Portal de Acompanhamento
                        </a>
                      </Button>
                    )}
                  </>
                ) : (
                  selectedOpportunity.opportunity_url && (
                    <Button variant="outline" asChild>
                      <a href={selectedOpportunity.opportunity_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver Edital Original
                      </a>
                    </Button>
                  )
                )}

                {/* Download documents */}
                {selectedOpportunity.go_no_go === "Participando" ? (
                  <>
                    {/* For Participando: show both Petição and Relatório separately */}
                    {selectedOpportunity.petition_path && (
                      <Button
                        variant="outline"
                        onClick={() => handleRequestPetition(selectedOpportunity)}
                        disabled={isDownloadingPetition === selectedOpportunity.id}
                      >
                        {isDownloadingPetition === selectedOpportunity.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Baixar Petição
                          </>
                        )}
                      </Button>
                    )}
                    {selectedOpportunity.audit_report_path && (
                      <Button
                        variant="outline"
                        onClick={() => handleRequestReport(selectedOpportunity)}
                        disabled={isDownloading === selectedOpportunity.id}
                      >
                        {isDownloading === selectedOpportunity.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Baixar Relatório de Auditoria
                          </>
                        )}
                      </Button>
                    )}
                  </>
                ) : (
                  /* For other statuses: show only Relatório */
                  <>
                    {selectedOpportunity.audit_report_path && (
                      <Button
                        variant="outline"
                        onClick={() => handleRequestReport(selectedOpportunity)}
                        disabled={isDownloading === selectedOpportunity.id}
                      >
                        {isDownloading === selectedOpportunity.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Baixar Relatório de Auditoria
                          </>
                        )}
                      </Button>
                    )}
                    {/* Actions for Go - Participar or Rejeitar */}
                    {selectedOpportunity.go_no_go === "Go" && (
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => handleParticipar(selectedOpportunity)}
                            disabled={isUpdating === selectedOpportunity.id}
                            className="flex-1 border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            {isUpdating === selectedOpportunity.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Participar
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleRejeitarOportunidade(selectedOpportunity)}
                            disabled={isUpdating === selectedOpportunity.id}
                            className="flex-1"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Rejeitar
                          </Button>
                        </div>
                        {onRequestParecer && (
                          <Button
                            onClick={() => {
                              onRequestParecer(selectedOpportunity.id, selectedOpportunity.title);
                              setSelectedOpportunity(null);
                            }}
                            variant="outline"
                          >
                            <ClipboardList className="h-4 w-4 mr-2" />
                            Abrir Novo Ticket
                          </Button>
                        )}
                        {onShowTickets && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              onShowTickets(selectedOpportunity.id);
                              handleCloseOpportunity();
                            }}
                          >
                            <ClipboardList className="h-4 w-4 mr-2" />
                            Ver Tickets desta Oportunidade
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Actions for No_Go - Solicitar Impugnação or Rejeitar */}
                    {selectedOpportunity.go_no_go === "No_Go" && (
                      <div className="flex flex-col gap-2">
                        {activeImpugnacaoByOpportunity.has(selectedOpportunity.id) ? (
                          <>
                            <p className="text-sm text-muted-foreground text-center py-2">
                              Impugnação em andamento. Aguardando análise da equipe técnica...
                            </p>
                            {onShowTickets && (
                              <Button
                                variant="outline"
                                onClick={() => {
                                  onShowTickets(selectedOpportunity.id);
                                  handleCloseOpportunity();
                                }}
                              >
                                <ClipboardList className="h-4 w-4 mr-2" />
                                Ver Tickets da Oportunidade
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="flex gap-2">
                              {onRequestParecer && (
                                <Button
                                  onClick={() => {
                                    onRequestParecer(selectedOpportunity.id, selectedOpportunity.title, "impugnacao");
                                    setSelectedOpportunity(null);
                                  }}
                                  className="flex-1 bg-amber-500 hover:bg-amber-600"
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Solicitar Impugnação
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                onClick={() => handleRejeitarOportunidade(selectedOpportunity)}
                                disabled={isUpdating === selectedOpportunity.id}
                                className="flex-1"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Rejeitar
                              </Button>
                            </div>
                            {onRequestParecer && (
                              <Button
                                onClick={() => {
                                  onRequestParecer(selectedOpportunity.id, selectedOpportunity.title);
                                  setSelectedOpportunity(null);
                                }}
                                variant="outline"
                              >
                                <ClipboardList className="h-4 w-4 mr-2" />
                                Abrir Novo Ticket
                              </Button>
                            )}
                            {onShowTickets && (
                              <Button
                                variant="outline"
                                onClick={() => {
                                  onShowTickets(selectedOpportunity.id);
                                  handleCloseOpportunity();
                                }}
                              >
                                <ClipboardList className="h-4 w-4 mr-2" />
                                Ver Tickets desta Oportunidade
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Solicitar Parecer e Participar - when report was requested and attached */}
                {canRequestParecer(selectedOpportunity) && isSubscriber && (
                  <div className="flex flex-col gap-2">
                    {activeParecerByOpportunity.has(selectedOpportunity.id) ? (
                      <Button
                        onClick={() => {
                          if (onShowTickets) {
                            onShowTickets(selectedOpportunity.id);
                            handleCloseOpportunity();
                          }
                        }}
                        variant="outline"
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Ver Tickets da Oportunidade
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleSolicitarParecer(selectedOpportunity)}
                        className="bg-primary"
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Solicitar Parecer Go/No Go
                      </Button>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleParticipar(selectedOpportunity)}
                        disabled={isUpdating === selectedOpportunity.id}
                        className="flex-1 border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        {isUpdating === selectedOpportunity.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Participar
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleRejeitarOportunidade(selectedOpportunity)}
                        disabled={isUpdating === selectedOpportunity.id}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Action buttons for Review_Required status */}
                {selectedOpportunity.go_no_go === "Review_Required" && !canRequestParecer(selectedOpportunity) && (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        onClick={() => handleSolicitarRelatorio(selectedOpportunity)}
                        disabled={isUpdating === selectedOpportunity.id}
                        className="flex-1"
                      >
                        {isUpdating === selectedOpportunity.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-2" />
                            Solicitar Relatório
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleRejeitarOportunidade(selectedOpportunity)}
                        disabled={isUpdating === selectedOpportunity.id}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Rejeitar
                      </Button>
                    </div>
                    {onRequestParecer && (
                      <Button
                        onClick={() => {
                          onRequestParecer(selectedOpportunity.id, selectedOpportunity.title);
                          setSelectedOpportunity(null);
                        }}
                        variant="outline"
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Abrir Novo Ticket
                      </Button>
                    )}
                    {onShowTickets && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          onShowTickets(selectedOpportunity.id);
                          handleCloseOpportunity();
                        }}
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Ver Tickets desta Oportunidade
                      </Button>
                    )}
                  </div>
                )}

                {/* Status info for Solicitada */}
                {selectedOpportunity.go_no_go === "Solicitada" && (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Aguardando análise da equipe técnica...
                    </p>
                    {onRequestParecer && (
                      <Button
                        onClick={() => {
                          onRequestParecer(selectedOpportunity.id, selectedOpportunity.title);
                          setSelectedOpportunity(null);
                        }}
                        variant="outline"
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Abrir Novo Ticket
                      </Button>
                    )}
                    {onShowTickets && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          onShowTickets(selectedOpportunity.id);
                          handleCloseOpportunity();
                        }}
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Ver Tickets desta Oportunidade
                      </Button>
                    )}
                  </div>
                )}

                {/* Status info for Rejeitada */}
                {selectedOpportunity.go_no_go === "Rejeitada" && (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Oportunidade rejeitada pelo cliente.
                    </p>
                    {onRequestParecer && (
                      <Button
                        onClick={() => {
                          onRequestParecer(selectedOpportunity.id, selectedOpportunity.title);
                          setSelectedOpportunity(null);
                        }}
                        variant="outline"
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Abrir Novo Ticket
                      </Button>
                    )}
                    {onShowTickets && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          onShowTickets(selectedOpportunity.id);
                          handleCloseOpportunity();
                        }}
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Ver Tickets desta Oportunidade
                      </Button>
                    )}
                  </div>
                )}

                {/* Action buttons for Participando - Vitória/Derrota */}
                {selectedOpportunity.go_no_go === "Participando" && (
                  <div className="flex flex-col gap-2">
                    {isAfterClosingDate(selectedOpportunity) ? (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleVitoria(selectedOpportunity)}
                          disabled={isUpdating === selectedOpportunity.id}
                          className="flex-1 border-purple-500 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                        >
                          {isUpdating === selectedOpportunity.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Vitória
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDerrota(selectedOpportunity)}
                          disabled={isUpdating === selectedOpportunity.id}
                          className="flex-1 border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Derrota
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        Os botões de resultado estarão disponíveis após a data limite.
                      </p>
                    )}
                    {onRequestParecer && (
                      <Button
                        onClick={() => {
                          onRequestParecer(selectedOpportunity.id, selectedOpportunity.title);
                          setSelectedOpportunity(null);
                        }}
                        variant="outline"
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Abrir Novo Ticket
                      </Button>
                    )}
                    {onShowTickets && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          onShowTickets(selectedOpportunity.id);
                          handleCloseOpportunity();
                        }}
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Ver Tickets desta Oportunidade
                      </Button>
                    )}
                  </div>
                )}

                {/* Action buttons for Vencida/Perdida (concluded) */}
                {(selectedOpportunity.go_no_go === "Vencida" || selectedOpportunity.go_no_go === "Perdida") && (
                  <div className="flex flex-col gap-2">
                    {/* Disputa Revertida button - only for Perdida with concluded recurso ticket */}
                    {selectedOpportunity.go_no_go === "Perdida" && concludedRecursoByOpportunity.has(selectedOpportunity.id) && (
                      <Button
                        onClick={() => handleDisputaRevertida(selectedOpportunity)}
                        disabled={isUpdating === selectedOpportunity.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isUpdating === selectedOpportunity.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Disputa Revertida
                          </>
                        )}
                      </Button>
                    )}
                    {onRequestParecer && (
                      <Button
                        onClick={() => {
                          onRequestParecer(selectedOpportunity.id, selectedOpportunity.title, selectedOpportunity.go_no_go === "Perdida" ? "recurso" : "defesa");
                          setSelectedOpportunity(null);
                        }}
                        className="bg-primary"
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        {selectedOpportunity.go_no_go === "Perdida" ? "Solicitar Recurso" : "Solicitar Defesa"}
                      </Button>
                    )}
                    {onShowTickets && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          onShowTickets(selectedOpportunity.id);
                          handleCloseOpportunity();
                        }}
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Ver Tickets desta Oportunidade
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lead Capture Modal */}
      <LeadCaptureModal open={showLeadModal} onOpenChange={setShowLeadModal} checkoutUrl={ASAAS_CHECKOUT_URL} />
    </div>
  );
};

export default JornalAuditado;
