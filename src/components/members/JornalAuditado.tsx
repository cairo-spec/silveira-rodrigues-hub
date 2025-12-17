import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, FileText, Search, ExternalLink, Download, Calendar, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import LeadCaptureModal from "@/components/LeadCaptureModal";

const ASAAS_CHECKOUT_URL = "https://www.asaas.com/c/g8pj49zuijh6swzc";

interface Opportunity {
  id: string;
  title: string;
  opportunity_url: string | null;
  opportunity_abstract: string | null;
  closing_date: string;
  agency_name: string;
  go_no_go: "Go" | "No_Go" | "Review_Required";
  audit_report_path: string | null;
  is_published: boolean;
  created_at: string;
}

interface JornalAuditadoProps {
  isSubscriber: boolean;
}

const JornalAuditado = ({ isSubscriber }: JornalAuditadoProps) => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchOpportunities();
  }, [user]);

  const fetchOpportunities = async () => {
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from("audited_opportunities")
      .select("*")
      .eq("is_published", true)
      .order("closing_date", { ascending: true });

    if (data) {
      setOpportunities(data as Opportunity[]);
    }

    setIsLoading(false);
  };

  const handleRequestReport = (opportunity: Opportunity) => {
    if (!isSubscriber) {
      setShowLeadModal(true);
    } else {
      downloadReport(opportunity);
    }
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

  const getGoNoGoBadge = (status: string) => {
    switch (status) {
      case "Go":
        return (
          <Badge className="bg-green-600 hover:bg-green-700 text-white text-xl font-bold px-6 py-2 shadow-lg">
            GO
          </Badge>
        );
      case "No_Go":
        return (
          <Badge className="bg-red-600 hover:bg-red-700 text-white text-xl font-bold px-6 py-2 shadow-lg">
            NO GO
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xl font-bold px-6 py-2 shadow-lg">
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
      <Dialog open={!!selectedOpportunity} onOpenChange={() => setSelectedOpportunity(null)}>
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

                <Button
                  onClick={() => handleRequestReport(selectedOpportunity)}
                  disabled={!selectedOpportunity.audit_report_path || isDownloading === selectedOpportunity.id}
                >
                  {isDownloading === selectedOpportunity.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : isSubscriber ? (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Relatório de Auditoria
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Solicitar Relatório
                    </>
                  )}
                </Button>
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
