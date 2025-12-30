import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Loader2, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BRAZILIAN_STATES = [
  { code: "AC", name: "Acre" },
  { code: "AL", name: "Alagoas" },
  { code: "AP", name: "Amapá" },
  { code: "AM", name: "Amazonas" },
  { code: "BA", name: "Bahia" },
  { code: "CE", name: "Ceará" },
  { code: "DF", name: "Distrito Federal" },
  { code: "ES", name: "Espírito Santo" },
  { code: "GO", name: "Goiás" },
  { code: "MA", name: "Maranhão" },
  { code: "MT", name: "Mato Grosso" },
  { code: "MS", name: "Mato Grosso do Sul" },
  { code: "MG", name: "Minas Gerais" },
  { code: "PA", name: "Pará" },
  { code: "PB", name: "Paraíba" },
  { code: "PR", name: "Paraná" },
  { code: "PE", name: "Pernambuco" },
  { code: "PI", name: "Piauí" },
  { code: "RJ", name: "Rio de Janeiro" },
  { code: "RN", name: "Rio Grande do Norte" },
  { code: "RS", name: "Rio Grande do Sul" },
  { code: "RO", name: "Rondônia" },
  { code: "RR", name: "Roraima" },
  { code: "SC", name: "Santa Catarina" },
  { code: "SP", name: "São Paulo" },
  { code: "SE", name: "Sergipe" },
  { code: "TO", name: "Tocantins" },
];

interface SearchCriteriaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchCriteriaModal({ open, onOpenChange }: SearchCriteriaModalProps) {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [companyPresentation, setCompanyPresentation] = useState("");
  const [capabilities, setCapabilities] = useState("");
  const [minimumValue, setMinimumValue] = useState<string>("");
  const [newKeyword, setNewKeyword] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadCriteria();
    }
  }, [open]);

  const loadCriteria = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_search_criteria")
        .select("keywords, states, company_presentation, capabilities, minimum_value")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setKeywords(data.keywords || []);
        setStates(data.states || []);
        setCompanyPresentation(data.company_presentation || "");
        setCapabilities(data.capabilities || "");
        setMinimumValue(data.minimum_value ? String(data.minimum_value) : "");
      } else {
        setKeywords([]);
        setStates([]);
        setCompanyPresentation("");
        setCapabilities("");
        setMinimumValue("");
      }
    } catch (error) {
      console.error("Error loading criteria:", error);
      toast.error("Erro ao carregar critérios");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim();
    if (!trimmed) return;
    if (trimmed.length > 100) {
      toast.error("Palavra-chave deve ter no máximo 100 caracteres");
      return;
    }
    if (keywords.length >= 50) {
      toast.error("Limite de 50 palavras-chave atingido");
      return;
    }
    if (keywords.includes(trimmed)) {
      toast.error("Palavra-chave já adicionada");
      return;
    }
    setKeywords([...keywords, trimmed]);
    setNewKeyword("");
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const handleAddState = () => {
    if (!selectedState) return;
    if (states.includes(selectedState)) {
      toast.error("Estado já adicionado");
      return;
    }
    setStates([...states, selectedState]);
    setSelectedState("");
  };

  const handleRemoveState = (stateCode: string) => {
    setStates(states.filter((s) => s !== stateCode));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("user_search_criteria")
        .upsert({
          user_id: user.id,
          keywords,
          states,
          company_presentation: companyPresentation,
          capabilities,
          minimum_value: minimumValue ? parseFloat(minimumValue) : null,
        }, { onConflict: "user_id" });

      if (error) throw error;

      toast.success("Critérios salvos com sucesso");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving criteria:", error);
      toast.error("Erro ao salvar critérios");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const availableStates = BRAZILIAN_STATES.filter(
    (state) => !states.includes(state.code)
  );

  const getStateName = (code: string) => {
    return BRAZILIAN_STATES.find((s) => s.code === code)?.name || code;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Meus Critérios de Busca</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 max-h-[calc(85vh-100px)]">
            <div className="flex flex-col gap-6 pb-4">
              {/* Company Presentation Section */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Apresentação da Empresa
                </Label>
                <p className="text-sm text-muted-foreground">
                  Descreva sua empresa em até 1200 caracteres.
                </p>
                <Textarea
                  placeholder="Descreva sua empresa, área de atuação, experiência, diferenciais..."
                  value={companyPresentation}
                  onChange={(e) => setCompanyPresentation(e.target.value.slice(0, 1200))}
                  className="min-h-[120px] resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {companyPresentation.length}/1200 caracteres
                </p>
              </div>

              {/* Capabilities Section */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Capacidades
                </Label>
                <p className="text-sm text-muted-foreground">
                  Descreva os atestados de capacidade técnica que sua empresa possui.
                </p>
                <Textarea
                  placeholder="Ex: Atestado de manutenção predial para órgão público, Atestado de fornecimento de equipamentos de TI..."
                  value={capabilities}
                  onChange={(e) => setCapabilities(e.target.value.slice(0, 2000))}
                  className="min-h-[120px] resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {capabilities.length}/2000 caracteres
                </p>
              </div>

              {/* Minimum Value Section */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Valor Mínimo da Oportunidade
                </Label>
                <p className="text-sm text-muted-foreground">
                  Defina o valor mínimo das oportunidades que deseja receber.
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    R$
                  </span>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={minimumValue}
                    onChange={(e) => setMinimumValue(e.target.value)}
                    className="pl-10"
                    min="0"
                    step="0.01"
                  />
                </div>
                {minimumValue && parseFloat(minimumValue) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Mínimo: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parseFloat(minimumValue))}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Palavras-chave ({keywords.length}/50)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Adicione termos que serão usados para buscar oportunidades relevantes.
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite uma palavra-chave..."
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    maxLength={100}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddKeyword}
                    disabled={!newKeyword.trim() || keywords.length >= 50}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <ScrollArea className="h-[100px] rounded-md border p-3">
                  {keywords.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma palavra-chave adicionada
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((keyword) => (
                        <Badge
                          key={keyword}
                          variant="secondary"
                          className="flex items-center gap-1 pr-1"
                        >
                          {keyword}
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyword(keyword)}
                            className="ml-1 hover:bg-muted rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* States Section */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Estados de Atuação ({states.length}/27)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Selecione os estados onde você deseja atuar.
                </p>
                <div className="flex gap-2">
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione um estado..." />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      {availableStates.map((state) => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.code} - {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddState}
                    disabled={!selectedState || states.length >= 27}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <ScrollArea className="h-[100px] rounded-md border p-3">
                  {states.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum estado selecionado
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {states.map((stateCode) => (
                        <Badge
                          key={stateCode}
                          variant="outline"
                          className="flex items-center gap-1 pr-1"
                        >
                          {stateCode} - {getStateName(stateCode)}
                          <button
                            type="button"
                            onClick={() => handleRemoveState(stateCode)}
                            className="ml-1 hover:bg-muted rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar Critérios
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
