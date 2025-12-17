import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, FileText, Search, ExternalLink, Download, Calendar, Building2, X, ClipboardList, CheckCircle } from "lucide-react";
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
  is_published: boolean;
  created_at: string;
  report_requested_at: string | null;
}

interface JornalAuditadoProps {
  isSubscriber: boolean;
  onRequestParecer?: (opportunityTitle: string) => void;
  selectedOpportunityId?: string;
  onOpportunityClose?: () => void;
}

const JornalAuditado = ({ 
  isSubscriber, 
  onRequestParecer, 
  selectedOpportunityId,
  onOpportunityClose 
}: JornalAuditadoProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

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

    return () => {
      supabase.removeChannel(channel);
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
        opportunity.id
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
        opportunity.id
      );
      
      toast({ title: "Oportunidade rejeitada" });
      fetchOpportunities();
      setSelectedOpportunity(null);
    }
    setIsUpdating(null);
  };

  const handleSolicitarParecer = (opportunity: Opportunity) => {
    if (onRequestParecer) {
      onRequestParecer(opportunity.title);
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
      .update({ go_no_go: "Participando" as GoNoGoStatus })
      .eq("id", opportunity.id);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível confirmar participação", variant: "destructive" });
    } else {
      notifyAdmins(
        'ticket_status',
        'Participação confirmada',
        `Cliente confirmou participação na oportunidade: "${opportunity.title}"`,
        opportunity.id
      );
      
      toast({ title: "Participação confirmada!" });
      fetchOpportunities();
      setSelectedOpportunity(null);
    }
    setIsUpdating(null);
  };

  const downloadReport = async (opportunity: Opportunity) => {
    if (!opportunity.audit_report_path) {
      return;
    }

    setIsDownloading(opportunity.id);

    const { data, error } = await supabase.storage
      .from("audit-reports")
      .createSignedUrl(opportunity.audit_report_path, 60);

    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }

    setIsDownloading(null);
  };

  // Check if opportunity was requested and now has a report attached (eligible for "Solicitar Parecer")
  const canRequestParecer = (opp: Opportunity): boolean => {
    return opp.report_requested_at !== null && 
           opp.audit_report_path !== null && 
           opp.go_no_go === "Review_Required";
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

  const filteredOpportunities = opportunities.filter((opp) =>
    opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opp.agency_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Jornal Auditado</h2>
        <p className="text-muted-foreground">Oportunidades de licitação analisadas pela nossa equipe</p>
      </div>

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

      {filteredOpportunities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium">Nenhuma oportunidade encontrada</h3>
            <p className="text-muted-foreground text-sm">
              {searchTerm ? "Tente buscar com outros termos" : "Aguarde novas publicações"}
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
                    <TableHead className="text-center">Data Limite</TableHead>
                    <TableHead className="text-center">Parecer</TableHead>
                    <TableHead className="text-center">Relatório</TableHead>
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
                        <Badge variant="outline" className="whitespace-nowrap">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(opp.closing_date), "dd/MM/yyyy")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {getGoNoGoBadge(opp.go_no_go)}
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
                    {getGoNoGoBadge(opp.go_no_go)}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(opp.closing_date), "dd/MM/yyyy")}
                    </Badge>
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

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
              <div className="flex items-center justify-center py-4">
                {getGoNoGoBadge(selectedOpportunity.go_no_go)}
              </div>

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

              {selectedOpportunity.opportunity_abstract && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Resumo</p>
                  <p className="text-sm bg-muted p-3 rounded-md">
                    {selectedOpportunity.opportunity_abstract}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-4">
                {selectedOpportunity.opportunity_url && (
                  <Button variant="outline" asChild>
                    <a href={selectedOpportunity.opportunity_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Edital Original
                    </a>
                  </Button>
                )}

                {/* Download report if available */}
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

                {/* Solicitar Parecer e Participar - when report was requested and attached */}
                {canRequestParecer(selectedOpportunity) && isSubscriber && (
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleSolicitarParecer(selectedOpportunity)}
                      className="bg-primary"
                    >
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Solicitar Parecer Go/No Go
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleParticipar(selectedOpportunity)}
                      disabled={isUpdating === selectedOpportunity.id}
                      className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
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
                  </div>
                )}

                {/* Action buttons for Review_Required status */}
                {selectedOpportunity.go_no_go === "Review_Required" && !canRequestParecer(selectedOpportunity) && (
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
                )}

                {/* Status info for Solicitada */}
                {selectedOpportunity.go_no_go === "Solicitada" && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Aguardando análise da equipe técnica...
                  </p>
                )}

                {/* Status info for Rejeitada */}
                {selectedOpportunity.go_no_go === "Rejeitada" && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Oportunidade rejeitada pelo cliente.
                  </p>
                )}

                {/* Status info for Participando */}
                {selectedOpportunity.go_no_go === "Participando" && (
                  <p className="text-sm text-emerald-600 text-center py-2 font-medium">
                    Participação confirmada na licitação.
                  </p>
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
