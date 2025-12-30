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

type GoNoGoStatus = "Go" | "No_Go" | "Review_Required" | "Solicitada" | "Rejeitada" | "Participando" | "Vencida" | "Perdida" | "Confirmada";

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
  winning_bid_value: number | null;
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
  const [concludedContrarrazoesOpportunity, setConcludedContrarrazoesOpportunity] = useState<Set<string>>(new Set());
  const [concludedImpugnacaoByOpportunity, setConcludedImpugnacaoByOpportunity] = useState<Set<string>>(new Set());
  const [activeParecerByOpportunity, setActiveParecerByOpportunity] = useState<Set<string>>(new Set());
  const [activeImpugnacaoByOpportunity, setActiveImpugnacaoByOpportunity] = useState<Set<string>>(new Set());
  const [adjudicatedOpportunities, setAdjudicatedOpportunities] = useState<Set<string>>(new Set());
  const [winningBidInput, setWinningBidInput] = useState<string>("");
  const [criteriaChecked, setCriteriaChecked] = useState(false);

  // Check if user has search criteria on mount
  useEffect(() => {
    const checkCriteria = async () => {
      if (!user || criteriaChecked) return;
      
      const { data: criteria } = await supabase
        .from("user_search_criteria")
        .select("id, keywords, states")
        .eq("user_id", user.id)
        .maybeSingle();
      
      const hasValidCriteria = criteria && (
        (criteria.keywords && criteria.keywords.length > 0) || 
        (criteria.states && criteria.states.length > 0)
      );
      
      if (!hasValidCriteria) {
        toast({
          title: "Critérios de busca não configurados",
          description: "Configure seus critérios para receber oportunidades personalizadas.",
          variant: "destructive",
          action: (
            <Button 
              variant="secondary" 
              size="sm" 
              className="shrink-0"
              onClick={() => setShowCriteriaModal(true)}
            >
              <Settings2 className="h-4 w-4 mr-1" />
              Configurar
            </Button>
          ),
        });
      }
      
      setCriteriaChecked(true);
    };
    
    checkCriteria();
  }, [user, criteriaChecked, toast]);

  // Format currency for display
  const formatCurrencyValue = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    const numericValue = parseInt(numbers, 10) / 100;
    return numericValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Parse currency string to number
  const parseCurrencyValue = (value: string): number | null => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return null;
    return parseInt(numbers, 10) / 100;
  };

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

  // Fetch concluded contrarrazões tickets for opportunities
  const fetchConcludedContrarrazoesTickets = async (opportunityIds: string[]) => {
    if (opportunityIds.length === 0) return;

    // Fetch tickets that are resolved/closed AND have contrarrazoes category
    const { data: tickets } = await supabase
      .from("tickets")
      .select("opportunity_id, service_category, status")
      .in("opportunity_id", opportunityIds)
      .in("status", ["resolved", "closed"]);

    const contrarrazoesSet = new Set<string>();
    tickets?.forEach((ticket) => {
      if (ticket.opportunity_id && ticket.service_category) {
        // Check if service_category contains contrarrazoes (with or without +upgrade)
        const baseCategory = ticket.service_category.replace('+upgrade', '');
        if (baseCategory === 'contrarrazoes') {
          contrarrazoesSet.add(ticket.opportunity_id);
        }
      }
    });
    setConcludedContrarrazoesOpportunity(contrarrazoesSet);
  };

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

  // Fetch concluded impugnacao-edital tickets for opportunities
  const fetchConcludedImpugnacaoTickets = async (opportunityIds: string[]) => {
    if (opportunityIds.length === 0) return;

    // Fetch tickets that are resolved/closed AND have impugnacao-edital category
    const { data: tickets } = await supabase
      .from("tickets")
      .select("opportunity_id, service_category, status")
      .in("opportunity_id", opportunityIds)
      .in("status", ["resolved", "closed"]);

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
    setConcludedImpugnacaoByOpportunity(impugnacaoSet);
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
    setWinningBidInput("");
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
      fetchConcludedContrarrazoesTickets(allOpportunityIds);
      fetchConcludedImpugnacaoTickets(allOpportunityIds);
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

  const handleVitoria = async (opportunity: Opportunity, bidValue?: number | null) => {
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
        go_no_go: "Vencida" as GoNoGoStatus,
        winning_bid_value: bidValue ?? null
      })
      .eq("id", opportunity.id);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível registrar vitória", variant: "destructive" });
    } else {
      notifyAdmins(
        'ticket_status',
        'Vitória registrada!',
        `Cliente registrou VITÓRIA na oportunidade: "${opportunity.title}"${bidValue ? ` - Lance: R$ ${bidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}`,
        opportunity.id,
        user?.id
      );
      
      toast({ title: "Vitória registrada! 🎉" });
      setWinningBidInput("");
      fetchOpportunities();
      setSelectedOpportunity(null);
    }
    setIsUpdating(null);
  };

  const handleDerrota = async (opportunity: Opportunity, bidValue?: number | null) => {
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
        go_no_go: "Perdida" as GoNoGoStatus,
        winning_bid_value: bidValue ?? null
      })
      .eq("id", opportunity.id);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível registrar derrota", variant: "destructive" });
    } else {
      notifyAdmins(
        'ticket_status',
        'Derrota registrada',
        `Cliente registrou DERROTA na oportunidade: "${opportunity.title}"${bidValue ? ` - Lance: R$ ${bidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}`,
        opportunity.id,
        user?.id
      );
      
      toast({ title: "Derrota registrada" });
      setWinningBidInput("");
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

  const handleInabilitado = async (opportunity: Opportunity) => {
    if (!isSubscriber) {
      setShowLeadModal(true);
      return;
    }

    setIsUpdating(opportunity.id);
    
    const { error } = await supabase
      .from("audited_opportunities")
      .update({ 
        go_no_go: "Perdida" as GoNoGoStatus
      })
      .eq("id", opportunity.id);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível registrar inabilitação", variant: "destructive" });
    } else {
      notifyAdmins(
        'ticket_status',
        'Inabilitação registrada',
        `Cliente registrou INABILITAÇÃO na oportunidade: "${opportunity.title}"`,
        opportunity.id,
        user?.id
      );
      
      toast({ title: "Inabilitação registrada", description: "Oportunidade marcada como Perdida" });
      fetchOpportunities();
      setSelectedOpportunity(null);
    }
    setIsUpdating(null);
  };

  const handleAdjudicado = async (opportunity: Opportunity) => {
    if (!isSubscriber) {
      setShowLeadModal(true);
      return;
    }

    setIsUpdating(opportunity.id);
    
    // Update status to Confirmada when client confirms adjudication
    const { error } = await supabase
      .from("audited_opportunities")
      .update({ go_no_go: "Confirmada" as GoNoGoStatus })
      .eq("id", opportunity.id);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível confirmar adjudicação", variant: "destructive" });
    } else {
      notifyAdmins(
        'ticket_status',
        'Adjudicação confirmada!',
        `Cliente confirmou ADJUDICAÇÃO na oportunidade: "${opportunity.title}"`,
        opportunity.id,
        user?.id
      );
      
      // Add to adjudicated set to show congratulations message
      setAdjudicatedOpportunities(prev => new Set(prev).add(opportunity.id));
      toast({ title: "Adjudicação confirmada! 🎉" });
      fetchOpportunities();
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
      case "Confirmada":
        return (
          <Badge variant="outline" className="border-emerald-600 text-emerald-700 text-xs bg-emerald-100">
            CONFIRMADA
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
        return searchFiltered.filter(opp => opp.go_no_go === "Vencida" || opp.go_no_go === "Perdida" || opp.go_no_go === "Confirmada");
      default: // noticias
        return searchFiltered.filter(opp => 
          !["Participando", "Vencida", "Perdida", "Confirmada"].includes(opp.go_no_go)
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
            Notícias ({searchFiltered.filter(o => !["Participando", "Vencida", "Perdida", "Confirmada"].includes(o.go_no_go)).length})
          </TabsTrigger>
          <TabsTrigger value="andamento">
            Em Andamento ({searchFiltered.filter(o => o.go_no_go === "Participando").length})
          </TabsTrigger>
          <TabsTrigger value="concluidas">
            Concluídas ({searchFiltered.filter(o => o.go_no_go === "Vencida" || o.go_no_go === "Perdida" || o.go_no_go === "Confirmada").length})
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
        <DialogContent className="max-w-lg w-[calc(100vw-2rem)] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-base sm:text-lg pr-6 leading-tight">{selectedOpportunity?.title}</DialogTitle>
            <DialogDescription className="flex items-center gap-1 text-sm">
              <Building2 className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{selectedOpportunity?.agency_name}</span>
            </DialogDescription>
          </DialogHeader>

          {selectedOpportunity && (
            <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pr-1">
              <div className="flex flex-wrap items-center justify-center gap-2 py-2 sm:py-4">
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
                <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <p className="text-muted-foreground">Data Limite</p>
                    <p className="font-medium">
                      {format(new Date(selectedOpportunity.closing_date), "dd/MM/yyyy", { locale: ptBR })}
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

              {/* Valor Estimado ou Valor do Lance (para concluídas) */}
              {(selectedOpportunity.go_no_go === "Vencida" || selectedOpportunity.go_no_go === "Perdida" || selectedOpportunity.go_no_go === "Confirmada") ? (
                selectedOpportunity.winning_bid_value && (
                  <div className="text-xs sm:text-sm">
                    <p className="text-muted-foreground">
                      Valor do Lance
                    </p>
                    <p className={`font-medium text-base sm:text-lg ${selectedOpportunity.go_no_go === "Perdida" ? "text-red-600" : "text-green-600"}`}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOpportunity.winning_bid_value)}
                    </p>
                  </div>
                )
              ) : (
                selectedOpportunity.estimated_value && (
                  <div className="text-xs sm:text-sm">
                    <p className="text-muted-foreground">Valor Estimado</p>
                    <p className="font-medium text-base sm:text-lg text-gold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOpportunity.estimated_value)}
                    </p>
                  </div>
                )
              )}

              {selectedOpportunity.opportunity_abstract && (
                <div>
                  <p className="text-muted-foreground text-xs sm:text-sm mb-1">Resumo</p>
                  <p className="text-xs sm:text-sm bg-muted p-2 sm:p-3 rounded-md leading-relaxed">
                    {selectedOpportunity.opportunity_abstract}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2 sm:pt-4">
                {/* Links - for Participando show both edital and portal */}
                {selectedOpportunity.go_no_go === "Participando" ? (
                  <>
                    {selectedOpportunity.opportunity_url && (
                      <Button variant="outline" size="sm" className="text-xs sm:text-sm h-9" asChild>
                        <a href={selectedOpportunity.opportunity_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                          Ver Edital Original
                        </a>
                      </Button>
                    )}
                    {selectedOpportunity.portal_url && (
                      <Button variant="default" size="sm" className="text-xs sm:text-sm h-9" asChild>
                        <a href={selectedOpportunity.portal_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                          Acessar Portal
                        </a>
                      </Button>
                    )}
                  </>
                ) : (
                  selectedOpportunity.opportunity_url && (
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm h-9" asChild>
                      <a href={selectedOpportunity.opportunity_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                        Ver Edital Original
                      </a>
                    </Button>
                  )
                )}

                {/* Download documents - always show petition if available */}
                {selectedOpportunity.petition_path && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs sm:text-sm h-9"
                    onClick={() => handleRequestPetition(selectedOpportunity)}
                    disabled={isDownloadingPetition === selectedOpportunity.id}
                  >
                    {isDownloadingPetition === selectedOpportunity.id ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Baixar Petição
                      </>
                    )}
                  </Button>
                )}
                
                {/* Download report if available */}
                {selectedOpportunity.audit_report_path && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs sm:text-sm h-9"
                    onClick={() => handleRequestReport(selectedOpportunity)}
                    disabled={isDownloading === selectedOpportunity.id}
                  >
                    {isDownloading === selectedOpportunity.id ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Baixar Relatório
                      </>
                    )}
                  </Button>
                )}

                {/* Status-specific actions */}
                {selectedOpportunity.go_no_go !== "Participando" && (
                  <>
                    {/* Actions for Go - Participar or Rejeitar */}
                    {selectedOpportunity.go_no_go === "Go" && (
                      <div className="flex flex-col gap-1.5 sm:gap-2">
                        <div className="flex gap-1.5 sm:gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleParticipar(selectedOpportunity)}
                            disabled={isUpdating === selectedOpportunity.id}
                            className="flex-1 border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 text-xs sm:text-sm h-9"
                          >
                            {isUpdating === selectedOpportunity.id ? (
                              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Participar
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejeitarOportunidade(selectedOpportunity)}
                            disabled={isUpdating === selectedOpportunity.id}
                            className="flex-1 text-xs sm:text-sm h-9"
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
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
                            size="sm"
                            className="text-xs sm:text-sm h-9"
                          >
                            <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                            Abrir Novo Ticket
                          </Button>
                        )}
                        {onShowTickets && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs sm:text-sm h-9"
                            onClick={() => {
                              onShowTickets(selectedOpportunity.id);
                              handleCloseOpportunity();
                            }}
                          >
                            <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                            Ver Tickets
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Actions for No_Go - Solicitar Impugnação or Rejeitar */}
                    {selectedOpportunity.go_no_go === "No_Go" && (
                      <div className="flex flex-col gap-1.5 sm:gap-2">
                        {activeImpugnacaoByOpportunity.has(selectedOpportunity.id) ? (
                          <>
                            <p className="text-xs sm:text-sm text-muted-foreground text-center py-1.5 sm:py-2">
                              Impugnação em andamento...
                            </p>
                            {onShowTickets && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs sm:text-sm h-9"
                                onClick={() => {
                                  onShowTickets(selectedOpportunity.id);
                                  handleCloseOpportunity();
                                }}
                              >
                                <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                                Ver Tickets
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="flex gap-1.5 sm:gap-2">
                              {onRequestParecer && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    onRequestParecer(selectedOpportunity.id, selectedOpportunity.title, "impugnacao");
                                    setSelectedOpportunity(null);
                                  }}
                                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-xs sm:text-sm h-9"
                                >
                                  <FileText className="h-3.5 w-3.5 mr-1" />
                                  Impugnação
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRejeitarOportunidade(selectedOpportunity)}
                                disabled={isUpdating === selectedOpportunity.id}
                                className="flex-1 text-xs sm:text-sm h-9"
                              >
                                <X className="h-3.5 w-3.5 mr-1" />
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
                                size="sm"
                                className="text-xs sm:text-sm h-9"
                              >
                                <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                                Abrir Novo Ticket
                              </Button>
                            )}
                            {onShowTickets && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs sm:text-sm h-9"
                                onClick={() => {
                                  onShowTickets(selectedOpportunity.id);
                                  handleCloseOpportunity();
                                }}
                              >
                                <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                                Ver Tickets
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
                  <div className="flex flex-col gap-1.5 sm:gap-2">
                    {activeParecerByOpportunity.has(selectedOpportunity.id) ? (
                      <Button
                        onClick={() => {
                          if (onShowTickets) {
                            onShowTickets(selectedOpportunity.id);
                            handleCloseOpportunity();
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="text-xs sm:text-sm h-9"
                      >
                        <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                        Ver Tickets
                      </Button>
                    ) : concludedImpugnacaoByOpportunity.has(selectedOpportunity.id) ? (
                      <Button
                        onClick={() => {
                          if (onRequestParecer) {
                            onRequestParecer(selectedOpportunity.id, selectedOpportunity.title, 'recurso-administrativo');
                          }
                          handleCloseOpportunity();
                        }}
                        size="sm"
                        className="bg-primary text-xs sm:text-sm h-9"
                      >
                        <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                        Solicitar Recurso
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleSolicitarParecer(selectedOpportunity)}
                        size="sm"
                        className="bg-primary text-xs sm:text-sm h-9"
                      >
                        <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                        Parecer Go/No Go
                      </Button>
                    )}
                    <div className="flex gap-1.5 sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleParticipar(selectedOpportunity)}
                        disabled={isUpdating === selectedOpportunity.id}
                        className="flex-1 border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 text-xs sm:text-sm h-9"
                      >
                        {isUpdating === selectedOpportunity.id ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Participar
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRejeitarOportunidade(selectedOpportunity)}
                        disabled={isUpdating === selectedOpportunity.id}
                        className="flex-1 text-xs sm:text-sm h-9"
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Action buttons for Review_Required status */}
                {selectedOpportunity.go_no_go === "Review_Required" && !canRequestParecer(selectedOpportunity) && (
                  <div className="flex flex-col gap-1.5 sm:gap-2">
                    <div className="flex gap-1.5 sm:gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleSolicitarRelatorio(selectedOpportunity)}
                        disabled={isUpdating === selectedOpportunity.id}
                        className="flex-1 text-xs sm:text-sm h-9"
                      >
                        {isUpdating === selectedOpportunity.id ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <>
                            <FileText className="h-3.5 w-3.5 mr-1" />
                            Relatório
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRejeitarOportunidade(selectedOpportunity)}
                        disabled={isUpdating === selectedOpportunity.id}
                        className="flex-1 text-xs sm:text-sm h-9"
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
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
                        size="sm"
                        className="text-xs sm:text-sm h-9"
                      >
                        <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                        Novo Ticket
                      </Button>
                    )}
                    {onShowTickets && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs sm:text-sm h-9"
                        onClick={() => {
                          onShowTickets(selectedOpportunity.id);
                          handleCloseOpportunity();
                        }}
                      >
                        <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                        Ver Tickets
                      </Button>
                    )}
                  </div>
                )}

                {/* Status info for Solicitada */}
                {selectedOpportunity.go_no_go === "Solicitada" && (
                  <div className="flex flex-col gap-1.5 sm:gap-2">
                    <p className="text-xs sm:text-sm text-muted-foreground text-center py-1.5 sm:py-2">
                      Aguardando análise...
                    </p>
                    {onRequestParecer && (
                      <Button
                        onClick={() => {
                          onRequestParecer(selectedOpportunity.id, selectedOpportunity.title);
                          setSelectedOpportunity(null);
                        }}
                        variant="outline"
                        size="sm"
                        className="text-xs sm:text-sm h-9"
                      >
                        <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                        Novo Ticket
                      </Button>
                    )}
                    {onShowTickets && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs sm:text-sm h-9"
                        onClick={() => {
                          onShowTickets(selectedOpportunity.id);
                          handleCloseOpportunity();
                        }}
                      >
                        <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                        Ver Tickets
                      </Button>
                    )}
                  </div>
                )}

                {/* Status info for Rejeitada */}
                {selectedOpportunity.go_no_go === "Rejeitada" && (
                  <div className="flex flex-col gap-1.5 sm:gap-2">
                    <p className="text-xs sm:text-sm text-muted-foreground text-center py-1.5 sm:py-2">
                      Oportunidade rejeitada.
                    </p>
                    {onRequestParecer && (
                      <Button
                        onClick={() => {
                          onRequestParecer(selectedOpportunity.id, selectedOpportunity.title);
                          setSelectedOpportunity(null);
                        }}
                        variant="outline"
                        size="sm"
                        className="text-xs sm:text-sm h-9"
                      >
                        <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                        Novo Ticket
                      </Button>
                    )}
                    {onShowTickets && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs sm:text-sm h-9"
                        onClick={() => {
                          onShowTickets(selectedOpportunity.id);
                          handleCloseOpportunity();
                        }}
                      >
                        <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                        Ver Tickets
                      </Button>
                    )}
                  </div>
                )}

                {/* Action buttons for Participando - Vitória/Derrota */}
                {selectedOpportunity.go_no_go === "Participando" && (
                  <div className="flex flex-col gap-1.5 sm:gap-2">
                    {isAfterClosingDate(selectedOpportunity) ? (
                      <>
                        {/* Input para valor do lance - obrigatório */}
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">
                            Valor do Lance <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="text"
                            value={winningBidInput}
                            onChange={(e) => setWinningBidInput(formatCurrencyValue(e.target.value))}
                            placeholder="R$ 0,00"
                            className="h-9 text-sm"
                          />
                          {parseCurrencyValue(winningBidInput) === null && (
                            <p className="text-xs text-muted-foreground">
                              Informe o valor do lance para registrar o resultado
                            </p>
                          )}
                        </div>
                        {/* Botões só aparecem quando há valor preenchido */}
                        {parseCurrencyValue(winningBidInput) !== null && parseCurrencyValue(winningBidInput) > 0 && (
                          <div className="flex gap-1.5 sm:gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVitoria(selectedOpportunity, parseCurrencyValue(winningBidInput))}
                              disabled={isUpdating === selectedOpportunity.id}
                              className="flex-1 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 text-xs sm:text-sm h-9"
                            >
                              {isUpdating === selectedOpportunity.id ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                  Vitória
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDerrota(selectedOpportunity, parseCurrencyValue(winningBidInput))}
                              disabled={isUpdating === selectedOpportunity.id}
                              className="flex-1 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs sm:text-sm h-9"
                            >
                              <X className="h-3.5 w-3.5 mr-1" />
                              Derrota
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs sm:text-sm text-muted-foreground text-center py-1.5">
                        Resultado disponível após data limite.
                      </p>
                    )}
                    {onRequestParecer && (
                      <Button
                        onClick={() => {
                          onRequestParecer(selectedOpportunity.id, selectedOpportunity.title);
                          setSelectedOpportunity(null);
                        }}
                        variant="outline"
                        size="sm"
                        className="text-xs sm:text-sm h-9"
                      >
                        <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                        Novo Ticket
                      </Button>
                    )}
                    {onShowTickets && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs sm:text-sm h-9"
                        onClick={() => {
                          onShowTickets(selectedOpportunity.id);
                          handleCloseOpportunity();
                        }}
                      >
                        <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                        Ver Tickets
                      </Button>
                    )}
                  </div>
                )}

                {/* Action buttons for Vencida/Perdida/Confirmada (concluded) */}
                {(selectedOpportunity.go_no_go === "Vencida" || selectedOpportunity.go_no_go === "Perdida" || selectedOpportunity.go_no_go === "Confirmada") && (
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
                    
                    {/* For Vencida: show Adjudicado/Inabilitado buttons and Solicitar Defesa */}
                    {selectedOpportunity.go_no_go === "Vencida" && (
                      adjudicatedOpportunities.has(selectedOpportunity.id) ? (
                        <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-4 text-center">
                          <div className="text-3xl mb-2">🎉</div>
                          <p className="text-green-800 dark:text-green-200 font-semibold text-lg">Parabéns!</p>
                          <p className="text-green-700 dark:text-green-300 text-sm">Você venceu a licitação!</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleAdjudicado(selectedOpportunity)}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Adjudicado
                            </Button>
                            <Button
                              onClick={() => handleInabilitado(selectedOpportunity)}
                              disabled={isUpdating === selectedOpportunity.id}
                              className="flex-1 bg-red-600 hover:bg-red-700"
                            >
                              {isUpdating === selectedOpportunity.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <>
                                  <X className="h-4 w-4 mr-2" />
                                  Inabilitado
                                </>
                              )}
                            </Button>
                          </div>
                          {onRequestParecer && (
                            <Button
                              onClick={() => {
                                onRequestParecer(selectedOpportunity.id, selectedOpportunity.title, "defesa");
                                setSelectedOpportunity(null);
                              }}
                              className="w-full bg-primary"
                            >
                              <ClipboardList className="h-4 w-4 mr-2" />
                              Solicitar Defesa
                            </Button>
                          )}
                        </div>
                      )
                    )}
                    
                    {/* For Confirmada: show congratulations message and new ticket button */}
                    {selectedOpportunity.go_no_go === "Confirmada" && (
                      <div className="space-y-3">
                        <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-4 text-center">
                          <div className="text-3xl mb-2">🎉</div>
                          <p className="text-green-800 dark:text-green-200 font-semibold text-lg">Parabéns!</p>
                          <p className="text-green-700 dark:text-green-300 text-sm">Você venceu a licitação!</p>
                        </div>
                        {onRequestParecer && (
                          <Button
                            onClick={() => {
                              onRequestParecer(selectedOpportunity.id, selectedOpportunity.title);
                              setSelectedOpportunity(null);
                            }}
                            className="w-full bg-primary"
                          >
                            <ClipboardList className="h-4 w-4 mr-2" />
                            Abrir Novo Ticket
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {/* For Perdida: show Solicitar Recurso button */}
                    {selectedOpportunity.go_no_go === "Perdida" && onRequestParecer && (
                      <Button
                        onClick={() => {
                          onRequestParecer(selectedOpportunity.id, selectedOpportunity.title, "recurso");
                          setSelectedOpportunity(null);
                        }}
                        className="bg-primary"
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Solicitar Recurso
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
