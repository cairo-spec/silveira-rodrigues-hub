import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Plus, Pencil, Trash2, CalendarIcon, FileText, Upload, Download, RotateCcw, Headphones, ClipboardList } from "lucide-react";
import OpportunityChecklistEditor from "./OpportunityChecklistEditor";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type GoNoGoStatus = "Go" | "No_Go" | "Review_Required" | "Solicitada" | "Rejeitada" | "Participando" | "Vencida" | "Perdida" | "Confirmada" | "Em_Execucao";

type FormData = {
  title: string;
  opportunity_url: string;
  portal_url: string;
  opportunity_abstract: string;
  closing_date: Date | null;
  client_organization_id: string;
  agency_name: string;
  go_no_go: GoNoGoStatus;
  audit_report_path: string;
  petition_path: string;
  estimated_value: string;
  winning_bid_value: string;
  contract_url: string;
  is_published: boolean;
};

// Notify all users in an organization
const notifyOrganizationUsers = async (
  organizationId: string, 
  type: string, 
  title: string, 
  message: string, 
  referenceId?: string
) => {
  try {
    // Get all users from this organization
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("client_organization_id", organizationId);
    
    if (profiles && profiles.length > 0) {
      const notifications = profiles.map(profile => ({
        user_id: profile.user_id,
        type,
        title,
        message,
        reference_id: referenceId || null
      }));
      
      await supabase.from("notifications").insert(notifications);
    }
  } catch (err) {
    console.error("Error notifying organization users:", err);
  }
};

interface Opportunity {
  id: string;
  title: string;
  opportunity_url: string | null;
  opportunity_abstract: string | null;
  closing_date: string;
  client_organization_id: string;
  agency_name: string;
  go_no_go: GoNoGoStatus;
  audit_report_path: string | null;
  petition_path: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  report_requested_at: string | null;
  contract_url: string | null;
  defeat_confirmed: boolean;
}

interface Organization {
  id: string;
  name: string;
}

interface AdminJornalProps {
  onShowTickets?: (opportunityId: string) => void;
  editOpportunityId?: string | null;
  onClearEditOpportunity?: () => void;
}

const AdminJornal = ({ onShowTickets, editOpportunityId, onClearEditOpportunity }: AdminJornalProps) => {
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReopening, setIsReopening] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"noticias" | "andamento" | "execucao" | "concluidas">("noticias");
  const [activeTicketsByOpportunity, setActiveTicketsByOpportunity] = useState<Map<string, number>>(new Map());

  // Form state
  const initialFormData: FormData = {
    title: "",
    opportunity_url: "",
    portal_url: "",
    opportunity_abstract: "",
    closing_date: null,
    client_organization_id: "",
    agency_name: "",
    go_no_go: "Review_Required",
    audit_report_path: "",
    petition_path: "",
    estimated_value: "",
    winning_bid_value: "",
    contract_url: "",
    is_published: false,
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [originalFormData, setOriginalFormData] = useState<FormData>(initialFormData);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);

  // Check if form has unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    return (
      formData.title !== originalFormData.title ||
      formData.opportunity_url !== originalFormData.opportunity_url ||
      formData.portal_url !== originalFormData.portal_url ||
      formData.opportunity_abstract !== originalFormData.opportunity_abstract ||
      formData.closing_date?.getTime() !== originalFormData.closing_date?.getTime() ||
      formData.client_organization_id !== originalFormData.client_organization_id ||
      formData.agency_name !== originalFormData.agency_name ||
      formData.go_no_go !== originalFormData.go_no_go ||
      formData.audit_report_path !== originalFormData.audit_report_path ||
      formData.petition_path !== originalFormData.petition_path ||
      formData.estimated_value !== originalFormData.estimated_value ||
      formData.winning_bid_value !== originalFormData.winning_bid_value ||
      formData.contract_url !== originalFormData.contract_url ||
      formData.is_published !== originalFormData.is_published
    );
  }, [formData, originalFormData]);

  // Handle modal close with unsaved changes check
  const handleModalClose = useCallback((open: boolean) => {
    if (!open && hasUnsavedChanges()) {
      setShowUnsavedAlert(true);
    } else if (!open) {
      setIsModalOpen(false);
      resetForm();
    } else {
      setIsModalOpen(open);
    }
  }, [hasUnsavedChanges]);

  const confirmCloseWithoutSaving = () => {
    setShowUnsavedAlert(false);
    setIsModalOpen(false);
    resetForm();
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

  useEffect(() => {
    fetchData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('admin-opportunities-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audited_opportunities'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    // Subscribe to ticket updates
    const ticketChannel = supabase
      .channel('admin-tickets-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets'
        },
        () => {
          // Refetch all data to get updated ticket counts
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(ticketChannel);
    };
  }, []);

  // Open edit modal when editOpportunityId is provided
  useEffect(() => {
    if (editOpportunityId && opportunities.length > 0) {
      const opportunity = opportunities.find(o => o.id === editOpportunityId);
      if (opportunity) {
        openEditModal(opportunity);
        onClearEditOpportunity?.();
      }
    }
  }, [editOpportunityId, opportunities]);

  const fetchData = async () => {
    setIsLoading(true);
    
    const [opportunitiesRes, orgsRes] = await Promise.all([
      supabase
        .from("audited_opportunities")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("organizations")
        .select("id, name")
    ]);

    if (opportunitiesRes.data) {
      const opps = opportunitiesRes.data as Opportunity[];
      setOpportunities(opps);
      
      // Fetch active tickets for "Participando" and "Em_Execucao" opportunities
      const activeIds = opps
        .filter(o => o.go_no_go === "Participando" || o.go_no_go === "Em_Execucao")
        .map(o => o.id);
      fetchActiveTickets(activeIds);
    }

    if (orgsRes.data) {
      setOrganizations(orgsRes.data);
    }

    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setOriginalFormData(initialFormData);
    setEditingOpportunity(null);
  };

  const openEditModal = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity);
    const editFormData: FormData = {
      title: opportunity.title,
      opportunity_url: opportunity.opportunity_url || "",
      portal_url: (opportunity as any).portal_url || "",
      opportunity_abstract: opportunity.opportunity_abstract || "",
      closing_date: opportunity.closing_date ? new Date(opportunity.closing_date) : null,
      client_organization_id: opportunity.client_organization_id,
      agency_name: opportunity.agency_name,
      go_no_go: opportunity.go_no_go,
      audit_report_path: opportunity.audit_report_path || "",
      petition_path: opportunity.petition_path || "",
      estimated_value: (opportunity as any).estimated_value != null ? formatCurrencyValue((opportunity as any).estimated_value) : "",
      winning_bid_value: (opportunity as any).winning_bid_value != null ? formatCurrencyValue((opportunity as any).winning_bid_value) : "",
      contract_url: opportunity.contract_url || "",
      is_published: opportunity.is_published,
    };
    setFormData(editFormData);
    setOriginalFormData(editFormData);
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Parse currency input
  const parseCurrencyValue = (value: string): number | null => {
    if (!value) return null;
    // Remove R$, dots (thousands) and replace comma with dot for decimals
    const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  // Format currency for display
  const formatCurrencyValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.closing_date || !formData.client_organization_id || !formData.agency_name) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (formData.opportunity_abstract && formData.opportunity_abstract.length > 900) {
      toast({
        title: "Resumo muito longo",
        description: "O resumo deve ter no máximo 900 caracteres",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // Parse estimated value
    const estimatedValue = parseCurrencyValue(formData.estimated_value);
    const winningBidValue = parseCurrencyValue(formData.winning_bid_value);

    // Automatically change status from Solicitada to Review_Required when report is attached
    // BUT only if the user didn't manually change the status
    let finalStatus = formData.go_no_go;
    if (
      editingOpportunity?.go_no_go === "Solicitada" &&
      formData.go_no_go === "Solicitada" && // Only auto-change if user didn't manually select another status
      formData.audit_report_path &&
      !editingOpportunity.audit_report_path
    ) {
      finalStatus = "Review_Required";
    }

    const opportunityData = {
      title: formData.title,
      opportunity_url: formData.opportunity_url || null,
      portal_url: formData.portal_url || null,
      opportunity_abstract: formData.opportunity_abstract || null,
      closing_date: format(formData.closing_date, "yyyy-MM-dd"),
      client_organization_id: formData.client_organization_id,
      agency_name: formData.agency_name,
      go_no_go: finalStatus,
      audit_report_path: formData.audit_report_path || null,
      petition_path: formData.petition_path || null,
      estimated_value: estimatedValue,
      winning_bid_value: winningBidValue,
      contract_url: formData.contract_url || null,
      is_published: formData.is_published,
    };

    if (editingOpportunity) {
      const { error } = await supabase
        .from("audited_opportunities")
        .update(opportunityData)
        .eq("id", editingOpportunity.id);

      if (error) {
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      } else {
        // If petition_path was added, auto-conclude associated recurso/impugnacao tickets
        // (these service_category values may include suffixes like "+upgrade")
        if (formData.petition_path && !editingOpportunity.petition_path) {
          const { data: relatedTickets } = await supabase
            .from("tickets")
            .select("id, user_id, status, service_category")
            .eq("opportunity_id", editingOpportunity.id)
            .or(
              "service_category.ilike.recurso-administrativo%,service_category.ilike.impugnacao%"
            )
            .neq("status", "resolved");

          if (relatedTickets && relatedTickets.length > 0) {
            for (const ticket of relatedTickets) {
              await supabase.from("tickets").update({ status: "resolved" }).eq("id", ticket.id);

              // Record event for the ticket with proper event_type
              await supabase.from("ticket_events").insert({
                ticket_id: ticket.id,
                user_id: ticket.user_id,
                event_type: "status_changed",
                old_value: ticket.status,
                new_value: "resolved",
              });
            }
          }
        }

        
        // Notify users if report link was added to a Solicitada opportunity
        if (editingOpportunity.go_no_go === "Solicitada" && 
            formData.audit_report_path && 
            !editingOpportunity.audit_report_path) {
          notifyOrganizationUsers(
            formData.client_organization_id,
            'ticket_status',
            'Relatório disponível',
            `O relatório de auditoria para "${formData.title}" está disponível.`,
            editingOpportunity.id
          );
        }
        
        // Notify if status changed to Go or No_Go
        if ((formData.go_no_go === "Go" || formData.go_no_go === "No_Go") && 
            editingOpportunity.go_no_go !== formData.go_no_go) {
          notifyOrganizationUsers(
            formData.client_organization_id,
            'ticket_status',
            `Parecer atualizado: ${formData.go_no_go === "Go" ? "GO" : "NO GO"}`,
            `A oportunidade "${formData.title}" recebeu parecer: ${formData.go_no_go === "Go" ? "GO - Recomendado" : "NO GO - Não Recomendado"}`,
            editingOpportunity.id
          );
        }
        
        toast({ title: "Oportunidade atualizada" });
        setIsModalOpen(false);
        resetForm();
        fetchData();
      }
    } else {
      const { data: newOpp, error } = await supabase
        .from("audited_opportunities")
        .insert(opportunityData)
        .select()
        .single();

      if (error) {
        toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
      } else {
        // Notify users in the organization about new opportunity
        if (formData.is_published && newOpp) {
          notifyOrganizationUsers(
            formData.client_organization_id,
            'new_ticket',
            'Nova oportunidade disponível',
            `Uma nova oportunidade foi publicada: "${formData.title}" - ${formData.agency_name}`,
            newOpp.id
          );
        }
        
        toast({ title: "Oportunidade criada" });
        setIsModalOpen(false);
        resetForm();
        fetchData();
      }
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("audited_opportunities")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Oportunidade excluída" });
      fetchData();
    }
  };

  const togglePublish = async (opportunity: Opportunity) => {
    const { error } = await supabase
      .from("audited_opportunities")
      .update({ is_published: !opportunity.is_published })
      .eq("id", opportunity.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      // Notify users when publishing
      if (!opportunity.is_published) {
        notifyOrganizationUsers(
          opportunity.client_organization_id,
          'new_ticket',
          'Nova oportunidade disponível',
          `Uma nova oportunidade foi publicada: "${opportunity.title}" - ${opportunity.agency_name}`,
          opportunity.id
        );
      }
      
      toast({ title: opportunity.is_published ? "Despublicado" : "Publicado" });
      fetchData();
    }
  };

  const handleReopenOpportunity = async (opportunity: Opportunity) => {
    setIsReopening(opportunity.id);
    
    const { error } = await supabase
      .from("audited_opportunities")
      .update({ go_no_go: "Review_Required" })
      .eq("id", opportunity.id);

    if (error) {
      toast({ title: "Erro ao reabrir", description: error.message, variant: "destructive" });
    } else {
      notifyOrganizationUsers(
        opportunity.client_organization_id,
        'ticket_status',
        'Oportunidade reaberta',
        `A oportunidade "${opportunity.title}" foi reaberta para análise.`,
        opportunity.id
      );
      toast({ title: "Oportunidade reaberta para análise" });
      fetchData();
    }
    
    setIsReopening(null);
  };

  const getGoNoGoBadge = (status: GoNoGoStatus) => {
    switch (status) {
      case "Go":
        return <Badge variant="outline" className="border-green-600 text-green-700 text-xs">GO</Badge>;
      case "No_Go":
        return <Badge variant="outline" className="border-red-600 text-red-700 text-xs">NO GO</Badge>;
      case "Solicitada":
        return <Badge variant="outline" className="border-blue-500 text-blue-600 text-xs">SOLICITADA</Badge>;
      case "Rejeitada":
        return <Badge variant="outline" className="border-gray-500 text-gray-600 text-xs">REJEITADA</Badge>;
      case "Participando":
        return <Badge variant="outline" className="border-emerald-500 text-emerald-600 text-xs">PARTICIPANDO</Badge>;
      case "Vencida":
        return <Badge variant="outline" className="border-purple-600 text-purple-700 text-xs bg-purple-50">VENCIDA</Badge>;
      case "Confirmada":
        return <Badge variant="outline" className="border-emerald-600 text-emerald-700 text-xs bg-emerald-100">CONFIRMADA</Badge>;
      case "Em_Execucao":
        return <Badge variant="outline" className="border-cyan-600 text-cyan-700 text-xs bg-cyan-50">EM EXECUÇÃO</Badge>;
      case "Perdida":
        return <Badge variant="outline" className="border-orange-600 text-orange-700 text-xs bg-orange-50">PERDIDA</Badge>;
      default:
        return <Badge variant="outline" className="border-amber-500 text-amber-600 text-xs">ANÁLISE</Badge>;
    }
  };

  const getOrgName = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    return org?.name || orgId.slice(0, 8) + "...";
  };

  // Filter opportunities by tab
  const getFilteredOpportunities = () => {
    switch (activeTab) {
      case "andamento":
        return opportunities.filter(opp => opp.go_no_go === "Participando");
      case "execucao":
        return opportunities.filter(opp => opp.go_no_go === "Em_Execucao");
      case "concluidas":
        return opportunities.filter(opp => opp.go_no_go === "Vencida" || opp.go_no_go === "Perdida" || opp.go_no_go === "Confirmada");
      default: // noticias
        return opportunities.filter(opp => 
          !["Participando", "Vencida", "Perdida", "Confirmada", "Em_Execucao"].includes(opp.go_no_go)
        );
    }
  };

  const filteredOpportunities = getFilteredOpportunities();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Oportunidades</h2>
          <p className="text-muted-foreground">Publique e gerencie oportunidades do Jornal Auditado</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
          <DialogTrigger asChild>
            <Button onClick={openNewModal}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Oportunidade
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingOpportunity ? "Editar Oportunidade" : "Nova Oportunidade"}</DialogTitle>
              <DialogDescription>
                Preencha os dados da oportunidade para publicação no Jornal Auditado
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título da oportunidade/edital"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="agency">Agência Licitante *</Label>
                <Input
                  id="agency"
                  value={formData.agency_name}
                  onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })}
                  placeholder="Nome da agência"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Data Limite *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !formData.closing_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.closing_date ? format(formData.closing_date, "dd/MM/yyyy") : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.closing_date || undefined}
                        onSelect={(date) => setFormData({ ...formData, closing_date: date || null })}
                        locale={ptBR}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid gap-2">
                  <Label>Parecer *</Label>
                  <Select
                    value={formData.go_no_go}
                    onValueChange={(value: GoNoGoStatus) => setFormData({ ...formData, go_no_go: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Review_Required">Análise Necessária</SelectItem>
                      <SelectItem value="Solicitada">SOLICITADA - Aguardando Relatório</SelectItem>
                      <SelectItem value="Go">GO - Recomendado</SelectItem>
                      <SelectItem value="No_Go">NO GO - Não Recomendado</SelectItem>
                      <SelectItem value="Rejeitada">REJEITADA - Cliente Rejeitou</SelectItem>
                      <SelectItem value="Participando">PARTICIPANDO - Em Disputa</SelectItem>
                      <SelectItem value="Vencida">VENCIDA - Licitação Ganha</SelectItem>
                      <SelectItem value="Confirmada">CONFIRMADA - Adjudicação</SelectItem>
                      <SelectItem value="Em_Execucao">EM EXECUÇÃO - Contrato Ativo</SelectItem>
                      <SelectItem value="Perdida">PERDIDA - Licitação Perdida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Cliente *</Label>
                <Select
                  value={formData.client_organization_id}
                  onValueChange={(value) => setFormData({ ...formData, client_organization_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a organização" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="estimated_value">Valor Estimado</Label>
                <Input
                  id="estimated_value"
                  type="text"
                  value={formData.estimated_value}
                  onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                  placeholder="R$ 0,00"
                />
                <p className="text-xs text-muted-foreground">
                  Digite o valor estimado da licitação (até R$ 10 bilhões)
                </p>
              </div>

              {(formData.go_no_go === "Vencida" || formData.go_no_go === "Confirmada" || formData.go_no_go === "Em_Execucao" || formData.go_no_go === "Perdida") && (
                <div className="grid gap-2">
                  <Label 
                    htmlFor="winning_bid_value"
                    className={formData.go_no_go === "Perdida" ? "text-red-600" : "text-green-600"}
                  >
                    {formData.go_no_go === "Perdida" ? "Valor do Lance Perdedor" : "Valor do Lance Vencedor"}
                  </Label>
                  <Input
                    id="winning_bid_value"
                    type="text"
                    value={formData.winning_bid_value}
                    onChange={(e) => setFormData({ ...formData, winning_bid_value: e.target.value })}
                    placeholder="R$ 0,00"
                    className={formData.go_no_go === "Perdida" 
                      ? "border-red-300 focus-visible:ring-red-500" 
                      : "border-green-300 focus-visible:ring-green-500"
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.go_no_go === "Perdida" 
                      ? "Valor do lance que perdeu a licitação" 
                      : "Valor do lance que venceu a licitação"
                    }
                  </p>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="url">URL do Edital</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.opportunity_url}
                  onChange={(e) => setFormData({ ...formData, opportunity_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="portal_url">URL do Portal (para acompanhamento)</Label>
                <Input
                  id="portal_url"
                  type="url"
                  value={formData.portal_url}
                  onChange={(e) => setFormData({ ...formData, portal_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="abstract">Resumo (máx. 900 caracteres)</Label>
                <Textarea
                  id="abstract"
                  value={formData.opportunity_abstract}
                  onChange={(e) => setFormData({ ...formData, opportunity_abstract: e.target.value })}
                  placeholder="Resumo da oportunidade..."
                  maxLength={900}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.opportunity_abstract.length}/900
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="report">Link do Relatório de Auditoria (Google Drive)</Label>
                <Input
                  id="report"
                  type="url"
                  value={formData.audit_report_path}
                  onChange={(e) => setFormData({ ...formData, audit_report_path: e.target.value })}
                  placeholder="https://drive.google.com/..."
                />
                {formData.audit_report_path && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <FileText className="h-3 w-3 mr-1" />
                      Link configurado
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(formData.audit_report_path, "_blank")}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Abrir
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="petition">Link da Petição (Google Drive)</Label>
                <Input
                  id="petition"
                  type="url"
                  value={formData.petition_path}
                  onChange={(e) => setFormData({ ...formData, petition_path: e.target.value })}
                  placeholder="https://drive.google.com/..."
                />
                {formData.petition_path && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-emerald-600 border-emerald-600">
                      <FileText className="h-3 w-3 mr-1" />
                      Link configurado
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(formData.petition_path, "_blank")}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Abrir
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contract_url">Link do Contrato (para execução)</Label>
                <Input
                  id="contract_url"
                  type="url"
                  value={formData.contract_url}
                  onChange={(e) => setFormData({ ...formData, contract_url: e.target.value })}
                  placeholder="https://..."
                />
                {formData.contract_url && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-indigo-600 border-indigo-600">
                      <FileText className="h-3 w-3 mr-1" />
                      Link configurado
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(formData.contract_url, "_blank")}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Abrir
                    </Button>
                  </div>
                )}
              </div>

              {/* Checklist editor - show when Go, Participando, Em_Execucao, or impugnacao concluded */}
              {editingOpportunity && (
                formData.go_no_go === "Go" || 
                formData.go_no_go === "Participando" ||
                formData.go_no_go === "Em_Execucao" ||
                formData.go_no_go === "Vencida" ||
                formData.go_no_go === "Confirmada"
              ) && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <OpportunityChecklistEditor opportunityId={editingOpportunity.id} />
                </div>
              )}

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label>Publicar imediatamente</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleModalClose(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingOpportunity ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Alert for unsaved changes */}
        <AlertDialog open={showUnsavedAlert} onOpenChange={setShowUnsavedAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Alterações não salvas</AlertDialogTitle>
              <AlertDialogDescription>
                Você tem alterações não salvas. Deseja sair sem salvar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continuar editando</AlertDialogCancel>
              <AlertDialogAction onClick={confirmCloseWithoutSaving}>
                Sair sem salvar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="noticias">
            Notícias ({opportunities.filter(o => !["Participando", "Vencida", "Perdida", "Confirmada", "Em_Execucao"].includes(o.go_no_go)).length})
          </TabsTrigger>
          <TabsTrigger value="andamento">
            Em Andamento ({opportunities.filter(o => o.go_no_go === "Participando").length})
          </TabsTrigger>
          <TabsTrigger value="concluidas">
            Concluídas ({opportunities.filter(o => o.go_no_go === "Vencida" || o.go_no_go === "Perdida" || o.go_no_go === "Confirmada").length})
          </TabsTrigger>
          <TabsTrigger value="execucao">
            Execução ({opportunities.filter(o => o.go_no_go === "Em_Execucao").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredOpportunities.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium">Nenhuma oportunidade nesta categoria</h3>
                <p className="text-muted-foreground text-sm">
                  {activeTab === "noticias" && "Clique em \"Nova Oportunidade\" para começar"}
                  {activeTab === "andamento" && "Oportunidades com status \"Participando\" aparecerão aqui"}
                  {activeTab === "execucao" && "Contratos em execução aparecerão aqui"}
                  {activeTab === "concluidas" && "Oportunidades \"Vencidas\" ou \"Perdidas\" aparecerão aqui"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Agência</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-center">Docs</TableHead>
                      <TableHead className="text-center">Parecer</TableHead>
                      {(activeTab === "andamento" || activeTab === "execucao") && (
                        <TableHead className="text-center">Atendimento</TableHead>
                      )}
                      <TableHead className="text-center">Publicado</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOpportunities.map((opp) => (
                      <TableRow 
                        key={opp.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openEditModal(opp)}
                      >
                        <TableCell className="font-medium max-w-[200px] truncate">{opp.title}</TableCell>
                        <TableCell>{opp.agency_name}</TableCell>
                        <TableCell>{getOrgName(opp.client_organization_id)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {opp.audit_report_path && (
                              <Badge variant="outline" className="text-[10px] px-1">
                                <FileText className="h-3 w-3 mr-0.5" />
                                Rel
                              </Badge>
                            )}
                            {opp.petition_path && (
                              <Badge variant="outline" className="text-[10px] px-1 border-emerald-500 text-emerald-600">
                                <FileText className="h-3 w-3 mr-0.5" />
                                Pet
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{getGoNoGoBadge(opp.go_no_go)}</TableCell>
                        {(activeTab === "andamento" || activeTab === "execucao") && (
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
                        )}
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <Switch
                            checked={opp.is_published}
                            onCheckedChange={() => togglePublish(opp)}
                          />
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {(opp.go_no_go === "Rejeitada" || opp.go_no_go === "Participando" || opp.go_no_go === "Vencida" || opp.go_no_go === "Perdida") && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                onClick={() => handleReopenOpportunity(opp)}
                                disabled={isReopening === opp.id}
                                title="Reabrir para análise"
                              >
                                {isReopening === opp.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
                              onClick={() => onShowTickets?.(opp.id)}
                              title="Ver tickets"
                            >
                              <Headphones className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(opp.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminJornal;
