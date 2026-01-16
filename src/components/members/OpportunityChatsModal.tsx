import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, Building2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import OpportunityChat from "./OpportunityChat";

interface Opportunity {
  id: string;
  title: string;
  agency_name: string;
  go_no_go: string;
  closing_date: string;
}

interface OpportunityChatsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OpportunityChatsModal = ({ open, onOpenChange }: OpportunityChatsModalProps) => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  useEffect(() => {
    if (open && user) {
      fetchOpportunities();
    }
  }, [open, user]);

  const fetchOpportunities = async () => {
    setIsLoading(true);
    
    // Fetch opportunities that are not cancelled/rejected (No_Go, Rejeitada, Perdida)
    const { data, error } = await supabase
      .from("audited_opportunities")
      .select("id, title, agency_name, go_no_go, closing_date")
      .eq("is_published", true)
      .not("go_no_go", "in", "(No_Go,Rejeitada,Perdida)")
      .order("closing_date", { ascending: false });

    if (!error && data) {
      setOpportunities(data);
    }
    
    setIsLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Go":
        return <Badge variant="outline" className="border-green-600 text-green-700 text-xs">GO</Badge>;
      case "Participando":
        return <Badge variant="outline" className="border-emerald-500 text-emerald-600 text-xs">PARTICIPANDO</Badge>;
      case "Vencida":
        return <Badge variant="outline" className="border-purple-600 text-purple-700 text-xs bg-purple-50">VENCIDA</Badge>;
      case "Confirmada":
        return <Badge variant="outline" className="border-emerald-600 text-emerald-700 text-xs bg-emerald-100">CONFIRMADA</Badge>;
      case "Em_Execucao":
        return <Badge variant="outline" className="border-cyan-600 text-cyan-700 text-xs bg-cyan-50">EM EXECUÇÃO</Badge>;
      case "Solicitada":
        return <Badge variant="outline" className="border-blue-500 text-blue-600 text-xs">SOLICITADA</Badge>;
      default:
        return <Badge variant="outline" className="border-amber-500 text-amber-600 text-xs">ANÁLISE</Badge>;
    }
  };

  return (
    <>
      <Dialog open={open && !selectedOpportunity} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Chats de Oportunidades
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : opportunities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">Nenhuma oportunidade ativa encontrada.</p>
            </div>
          ) : (
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-2">
                {opportunities.map((opp) => (
                  <button
                    key={opp.id}
                    onClick={() => setSelectedOpportunity(opp)}
                    className="w-full text-left p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-sm line-clamp-2">{opp.title}</h4>
                      {getStatusBadge(opp.go_no_go)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {opp.agency_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(opp.closing_date), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {selectedOpportunity && (
        <OpportunityChat
          opportunityId={selectedOpportunity.id}
          opportunityTitle={selectedOpportunity.title}
          open={!!selectedOpportunity}
          onOpenChange={(open) => !open && setSelectedOpportunity(null)}
        />
      )}
    </>
  );
};

export default OpportunityChatsModal;
