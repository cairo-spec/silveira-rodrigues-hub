import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Plus, Pencil, Trash2, CalendarIcon, FileText, Upload } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Opportunity {
  id: string;
  title: string;
  opportunity_url: string | null;
  opportunity_abstract: string | null;
  closing_date: string;
  client_organization_id: string;
  agency_name: string;
  go_no_go: "Go" | "No_Go" | "Review_Required";
  audit_report_path: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface Organization {
  client_organization_id: string;
  empresa: string | null;
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
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    opportunity_url: "",
    opportunity_abstract: "",
    closing_date: null as Date | null,
    client_organization_id: "",
    agency_name: "",
    go_no_go: "Review_Required" as "Go" | "No_Go" | "Review_Required",
    audit_report_path: "",
    is_published: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    const [opportunitiesRes, orgsRes] = await Promise.all([
      supabase
        .from("audited_opportunities")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("client_organization_id, empresa")
        .not("client_organization_id", "is", null)
    ]);

    if (opportunitiesRes.data) {
      setOpportunities(opportunitiesRes.data as Opportunity[]);
    }

    // Get unique organizations
    if (orgsRes.data) {
      const uniqueOrgs = orgsRes.data.reduce((acc: Organization[], curr) => {
        if (curr.client_organization_id && !acc.find(o => o.client_organization_id === curr.client_organization_id)) {
          acc.push({
            client_organization_id: curr.client_organization_id,
            empresa: curr.empresa
          });
        }
        return acc;
      }, []);
      setOrganizations(uniqueOrgs);
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
      is_published: false,
    });
    setSelectedFile(null);
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

    // Upload file if selected
    const reportPath = await handleFileUpload();

    const opportunityData = {
      title: formData.title,
      opportunity_url: formData.opportunity_url || null,
      opportunity_abstract: formData.opportunity_abstract || null,
      closing_date: format(formData.closing_date, "yyyy-MM-dd"),
      client_organization_id: formData.client_organization_id,
      agency_name: formData.agency_name,
      go_no_go: formData.go_no_go,
      audit_report_path: reportPath,
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
        toast({ title: "Oportunidade atualizada" });
        setIsModalOpen(false);
        resetForm();
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from("audited_opportunities")
        .insert(opportunityData);

      if (error) {
        toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
      } else {
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
      toast({ title: opportunity.is_published ? "Despublicado" : "Publicado" });
      fetchData();
    }
  };

  const getGoNoGoBadge = (status: string) => {
    switch (status) {
      case "Go":
        return <Badge className="bg-green-600 text-white text-lg px-4 py-1">GO</Badge>;
      case "No_Go":
        return <Badge className="bg-red-600 text-white text-lg px-4 py-1">NO GO</Badge>;
      default:
        return <Badge className="bg-amber-500 text-white text-lg px-4 py-1">ANÁLISE</Badge>;
    }
  };

  const getOrgName = (orgId: string) => {
    const org = organizations.find(o => o.client_organization_id === orgId);
    return org?.empresa || orgId.slice(0, 8) + "...";
  };

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
                    onValueChange={(value: "Go" | "No_Go" | "Review_Required") => setFormData({ ...formData, go_no_go: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Go">GO - Recomendado</SelectItem>
                      <SelectItem value="No_Go">NO GO - Não Recomendado</SelectItem>
                      <SelectItem value="Review_Required">Análise Necessária</SelectItem>
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
                      <SelectItem key={org.client_organization_id} value={org.client_organization_id}>
                        {org.empresa || `Org: ${org.client_organization_id.slice(0, 8)}...`}
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
                  />
                  {formData.audit_report_path && !selectedFile && (
                    <Badge variant="outline" className="whitespace-nowrap">
                      <FileText className="h-3 w-3 mr-1" />
                      Arquivo existente
                    </Badge>
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

      {opportunities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium">Nenhuma oportunidade cadastrada</h3>
            <p className="text-muted-foreground text-sm">Clique em "Nova Oportunidade" para começar</p>
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
                  <TableHead className="text-center">Parecer</TableHead>
                  <TableHead className="text-center">Publicado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunities.map((opp) => (
                  <TableRow key={opp.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{opp.title}</TableCell>
                    <TableCell>{opp.agency_name}</TableCell>
                    <TableCell>{getOrgName(opp.client_organization_id)}</TableCell>
                    <TableCell className="text-center">{getGoNoGoBadge(opp.go_no_go)}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={opp.is_published}
                        onCheckedChange={() => togglePublish(opp)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
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
    </div>
  );
};

export default AdminJornal;
