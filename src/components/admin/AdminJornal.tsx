import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Plus, Pencil, Trash2, CalendarIcon, FileText, Upload, Download, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type GoNoGoStatus = "Go" | "No_Go" | "Review_Required" | "Solicitada" | "Rejeitada" | "Participando" | "Vencida" | "Perdida";

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
}

interface Organization {
  id: string;
  name: string;
}

const AdminJornal = () => {
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPetitionFile, setSelectedPetitionFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingPetition, setIsUploadingPetition] = useState(false);
  const [isDeletingFile, setIsDeletingFile] = useState(false);
  const [isDeletingPetition, setIsDeletingPetition] = useState(false);
  const [isDownloadingFile, setIsDownloadingFile] = useState(false);
  const [isDownloadingPetition, setIsDownloadingPetition] = useState(false);
  const [isReopening, setIsReopening] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"noticias" | "andamento" | "concluidas">("noticias");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    opportunity_url: "",
    opportunity_abstract: "",
    closing_date: null as Date | null,
    client_organization_id: "",
    agency_name: "",
    go_no_go: "Review_Required" as GoNoGoStatus,
    audit_report_path: "",
    petition_path: "",
    is_published: false,
  });

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

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
      setOpportunities(opportunitiesRes.data as Opportunity[]);
    }

    if (orgsRes.data) {
      setOrganizations(orgsRes.data);
    }

    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      opportunity_url: "",
      opportunity_abstract: "",
      closing_date: null,
      client_organization_id: "",
      agency_name: "",
      go_no_go: "Review_Required",
      audit_report_path: "",
      petition_path: "",
      is_published: false,
    });
    setSelectedFile(null);
    setSelectedPetitionFile(null);
    setEditingOpportunity(null);
  };

  const openEditModal = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity);
    setFormData({
      title: opportunity.title,
      opportunity_url: opportunity.opportunity_url || "",
      opportunity_abstract: opportunity.opportunity_abstract || "",
      closing_date: opportunity.closing_date ? new Date(opportunity.closing_date) : null,
      client_organization_id: opportunity.client_organization_id,
      agency_name: opportunity.agency_name,
      go_no_go: opportunity.go_no_go,
      audit_report_path: opportunity.audit_report_path || "",
      petition_path: opportunity.petition_path || "",
      is_published: opportunity.is_published,
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = async (): Promise<string | null> => {
    if (!selectedFile) return formData.audit_report_path || null;

    setIsUploading(true);
    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("audit-reports")
      .upload(fileName, selectedFile);

    setIsUploading(false);

    if (error) {
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar o arquivo",
        variant: "destructive"
      });
      return null;
    }

    return data.path;
  };

  const handleDeleteFile = async () => {
    if (!formData.audit_report_path) return;
    
    setIsDeletingFile(true);
    
    // Remove file from storage
    const { error: storageError } = await supabase.storage
      .from("audit-reports")
      .remove([formData.audit_report_path]);
    
    if (storageError) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o arquivo",
        variant: "destructive"
      });
      setIsDeletingFile(false);
      return;
    }
    
    // If editing an existing opportunity, update database immediately
    if (editingOpportunity) {
      const { error: dbError } = await supabase
        .from("audited_opportunities")
        .update({ audit_report_path: null })
        .eq("id", editingOpportunity.id);
      
      if (dbError) {
        toast({
          title: "Erro ao atualizar",
          description: "Arquivo removido mas não foi possível atualizar a oportunidade",
          variant: "destructive"
        });
      } else {
        toast({ title: "Arquivo excluído e oportunidade atualizada" });
        fetchData();
      }
    } else {
      toast({ title: "Arquivo excluído" });
    }
    
    setFormData({ ...formData, audit_report_path: "" });
    setIsDeletingFile(false);
  };

  const handleDownloadFile = async () => {
    if (!formData.audit_report_path) return;
    
    setIsDownloadingFile(true);
    
    const { data, error } = await supabase.storage
      .from("audit-reports")
      .createSignedUrl(formData.audit_report_path, 60);
    
    if (error) {
      toast({
        title: "Erro ao baixar",
        description: "Não foi possível gerar link de download",
        variant: "destructive"
      });
    } else if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
    
    setIsDownloadingFile(false);
  };

  // Petition handlers
  const handlePetitionUpload = async (): Promise<string | null> => {
    if (!selectedPetitionFile) return formData.petition_path || null;

    setIsUploadingPetition(true);
    const fileExt = selectedPetitionFile.name.split('.').pop();
    const fileName = `petition_${crypto.randomUUID()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("audit-reports")
      .upload(fileName, selectedPetitionFile);

    setIsUploadingPetition(false);

    if (error) {
      toast({
        title: "Erro no upload da petição",
        description: "Não foi possível enviar o arquivo",
        variant: "destructive"
      });
      return null;
    }

    return data.path;
  };

  const handleDeletePetition = async () => {
    if (!formData.petition_path) return;
    
    setIsDeletingPetition(true);
    
    const { error: storageError } = await supabase.storage
      .from("audit-reports")
      .remove([formData.petition_path]);
    
    if (storageError) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a petição",
        variant: "destructive"
      });
      setIsDeletingPetition(false);
      return;
    }
    
    if (editingOpportunity) {
      const { error: dbError } = await supabase
        .from("audited_opportunities")
        .update({ petition_path: null })
        .eq("id", editingOpportunity.id);
      
      if (dbError) {
        toast({
          title: "Erro ao atualizar",
          description: "Arquivo removido mas não foi possível atualizar a oportunidade",
          variant: "destructive"
        });
      } else {
        toast({ title: "Petição excluída e oportunidade atualizada" });
        fetchData();
      }
    } else {
      toast({ title: "Petição excluída" });
    }
    
    setFormData({ ...formData, petition_path: "" });
    setIsDeletingPetition(false);
  };

  const handleDownloadPetition = async () => {
    if (!formData.petition_path) return;
    
    setIsDownloadingPetition(true);
    
    const { data, error } = await supabase.storage
      .from("audit-reports")
      .createSignedUrl(formData.petition_path, 60);
    
    if (error) {
      toast({
        title: "Erro ao baixar",
        description: "Não foi possível gerar link de download",
        variant: "destructive"
      });
    } else if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
    
    setIsDownloadingPetition(false);
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

    // Upload files if selected
    const reportPath = await handleFileUpload();
    const petitionPath = await handlePetitionUpload();

    // Auto-revert status to Review_Required if attaching report to a "Solicitada" opportunity
    let finalGoNoGo = formData.go_no_go;
    if (editingOpportunity && 
        editingOpportunity.go_no_go === "Solicitada" && 
        selectedFile && 
        reportPath) {
      finalGoNoGo = "Review_Required";
    }

    const opportunityData = {
      title: formData.title,
      opportunity_url: formData.opportunity_url || null,
      opportunity_abstract: formData.opportunity_abstract || null,
      closing_date: format(formData.closing_date, "yyyy-MM-dd"),
      client_organization_id: formData.client_organization_id,
      agency_name: formData.agency_name,
      go_no_go: finalGoNoGo,
      audit_report_path: reportPath,
      petition_path: petitionPath,
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
        // Notify users if report was attached to a Solicitada opportunity
        if (editingOpportunity.go_no_go === "Solicitada" && selectedFile && reportPath) {
          notifyOrganizationUsers(
            formData.client_organization_id,
            'ticket_status',
            'Relatório disponível',
            `O relatório de auditoria para "${formData.title}" está disponível para download.`,
            editingOpportunity.id
          );
        }
        
        // Notify if status changed to Go or No_Go
        if ((finalGoNoGo === "Go" || finalGoNoGo === "No_Go") && 
            editingOpportunity.go_no_go !== finalGoNoGo) {
          notifyOrganizationUsers(
            formData.client_organization_id,
            'ticket_status',
            `Parecer atualizado: ${finalGoNoGo === "Go" ? "GO" : "NO GO"}`,
            `A oportunidade "${formData.title}" recebeu parecer: ${finalGoNoGo === "Go" ? "GO - Recomendado" : "NO GO - Não Recomendado"}`,
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
      case "concluidas":
        return opportunities.filter(opp => opp.go_no_go === "Vencida" || opp.go_no_go === "Perdida");
      default: // noticias
        return opportunities.filter(opp => 
          !["Participando", "Vencida", "Perdida"].includes(opp.go_no_go)
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
        <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
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
                      <SelectItem value="Go">GO - Recomendado</SelectItem>
                      <SelectItem value="No_Go">NO GO - Não Recomendado</SelectItem>
                      <SelectItem value="Review_Required">Análise Necessária</SelectItem>
                      <SelectItem value="Vencida">VENCIDA - Licitação Ganha</SelectItem>
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
                <Label htmlFor="report">Relatório de Auditoria (PDF)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="report"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  {formData.audit_report_path && !selectedFile && (
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="whitespace-nowrap">
                        <FileText className="h-3 w-3 mr-1" />
                        Arquivo existente
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
                        onClick={handleDownloadFile}
                        disabled={isDownloadingFile}
                        title="Baixar arquivo"
                      >
                        {isDownloadingFile ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleDeleteFile}
                        disabled={isDeletingFile}
                        title="Excluir arquivo"
                      >
                        {isDeletingFile ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="petition">Petição (PDF)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="petition"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSelectedPetitionFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  {formData.petition_path && !selectedPetitionFile && (
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="whitespace-nowrap">
                        <FileText className="h-3 w-3 mr-1" />
                        Petição existente
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
                        onClick={handleDownloadPetition}
                        disabled={isDownloadingPetition}
                        title="Baixar petição"
                      >
                        {isDownloadingPetition ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleDeletePetition}
                        disabled={isDeletingPetition}
                        title="Excluir petição"
                      >
                        {isDeletingPetition ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label>Publicar imediatamente</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || isUploading}>
                {(isSubmitting || isUploading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingOpportunity ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="noticias">
            Notícias ({opportunities.filter(o => !["Participando", "Vencida", "Perdida"].includes(o.go_no_go)).length})
          </TabsTrigger>
          <TabsTrigger value="andamento">
            Em Andamento ({opportunities.filter(o => o.go_no_go === "Participando").length})
          </TabsTrigger>
          <TabsTrigger value="concluidas">
            Concluídas ({opportunities.filter(o => o.go_no_go === "Vencida" || o.go_no_go === "Perdida").length})
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
                      <TableHead className="text-center">Publicado</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOpportunities.map((opp) => (
                      <TableRow key={opp.id}>
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
                        <TableCell className="text-center">
                          <Switch
                            checked={opp.is_published}
                            onCheckedChange={() => togglePublish(opp)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
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
                            <Button variant="ghost" size="icon" onClick={() => openEditModal(opp)}>
                              <Pencil className="h-4 w-4" />
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
