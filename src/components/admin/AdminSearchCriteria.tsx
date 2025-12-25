import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, Search, Key, MapPin, ChevronDown, Building2, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UserCriteria {
  id: string;
  user_id: string;
  keywords: string[];
  states: string[];
  company_presentation: string | null;
  minimum_value: number | null;
  updated_at: string;
  profile?: {
    nome: string;
    email: string;
    empresa: string | null;
  };
}

export function AdminSearchCriteria() {
  const [criteria, setCriteria] = useState<UserCriteria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCriteria();
  }, []);

  const loadCriteria = async () => {
    try {
      // First get all criteria
      const { data: criteriaData, error: criteriaError } = await supabase
        .from("user_search_criteria")
        .select("*")
        .order("updated_at", { ascending: false });

      if (criteriaError) throw criteriaError;

      // Then get profiles for those users
      if (criteriaData && criteriaData.length > 0) {
        const userIds = criteriaData.map((c) => c.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, nome, email, empresa")
          .in("user_id", userIds);

        if (profilesError) throw profilesError;

        // Merge data
        const merged = criteriaData.map((c) => ({
          ...c,
          profile: profilesData?.find((p) => p.user_id === c.user_id),
        }));

        setCriteria(merged);
      } else {
        setCriteria([]);
      }
    } catch (error) {
      console.error("Error loading criteria:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const filteredCriteria = criteria.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.profile?.nome?.toLowerCase().includes(term) ||
      c.profile?.email?.toLowerCase().includes(term) ||
      c.profile?.empresa?.toLowerCase().includes(term) ||
      c.keywords.some((k) => k.toLowerCase().includes(term)) ||
      c.states.some((s) => s.toLowerCase().includes(term)) ||
      c.company_presentation?.toLowerCase().includes(term)
    );
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Critérios de Busca dos Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, empresa, palavra-chave ou estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredCriteria.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? "Nenhum resultado encontrado" : "Nenhum usuário configurou critérios ainda"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Valor Mínimo</TableHead>
                    <TableHead>Palavras-chave</TableHead>
                    <TableHead>Estados</TableHead>
                    <TableHead className="w-[140px]">Atualizado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCriteria.map((item) => (
                    <Collapsible key={item.id} asChild open={expandedRows.has(item.id)}>
                      <>
                        <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleRow(item.id)}>
                          <TableCell>
                            <CollapsibleTrigger asChild>
                              <ChevronDown 
                                className={`h-4 w-4 transition-transform ${expandedRows.has(item.id) ? 'rotate-180' : ''}`} 
                              />
                            </CollapsibleTrigger>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.profile?.nome || "N/A"}</div>
                              <div className="text-sm text-muted-foreground">{item.profile?.email}</div>
                              {item.profile?.empresa && (
                                <div className="text-xs text-muted-foreground">{item.profile.empresa}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.minimum_value ? (
                              <div className="flex items-center gap-1 text-sm font-medium text-primary">
                                <DollarSign className="h-3 w-3" />
                                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.minimum_value)}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Não definido</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <ScrollArea className="h-24">
                              <div className="flex flex-wrap gap-1">
                                {item.keywords.length === 0 ? (
                                  <span className="text-muted-foreground text-sm">Nenhuma</span>
                                ) : (
                                  item.keywords.map((keyword) => (
                                    <Badge key={keyword} variant="secondary" className="text-xs">
                                      {keyword}
                                    </Badge>
                                  ))
                                )}
                              </div>
                            </ScrollArea>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {item.states.length === 0 ? (
                                <span className="text-muted-foreground text-sm">Nenhum</span>
                              ) : (
                                item.states.map((state) => (
                                  <Badge key={state} variant="outline" className="text-xs">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {state}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(item.updated_at).toLocaleDateString("pt-BR")}
                          </TableCell>
                        </TableRow>
                        <CollapsibleContent asChild>
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={6}>
                              <div className="py-3 px-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium text-sm">Apresentação da Empresa</span>
                                </div>
                                {item.company_presentation ? (
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-6">
                                    {item.company_presentation}
                                  </p>
                                ) : (
                                  <p className="text-sm text-muted-foreground italic pl-6">
                                    Nenhuma apresentação cadastrada
                                  </p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        </CollapsibleContent>
                      </>
                    </Collapsible>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
