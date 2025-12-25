import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Plus, Loader2, Check } from "lucide-react";
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
  const [newKeyword, setNewKeyword] = useState("");
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
        .select("keywords, states")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setKeywords(data.keywords || []);
        setStates(data.states || []);
      } else {
        setKeywords([]);
        setStates([]);
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

  const handleToggleState = (stateCode: string) => {
    if (states.includes(stateCode)) {
      setStates(states.filter((s) => s !== stateCode));
    } else {
      setStates([...states, stateCode]);
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Meus Critérios de Busca</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col gap-6">
            {/* Keywords Section */}
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
              <ScrollArea className="h-32 rounded-md border p-3">
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
            <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
              <Label className="text-base font-semibold">
                Estados de Atuação ({states.length}/{BRAZILIAN_STATES.length})
              </Label>
              <p className="text-sm text-muted-foreground">
                Selecione os estados onde você deseja atuar.
              </p>
              <ScrollArea className="flex-1 rounded-md border p-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BRAZILIAN_STATES.map((state) => {
                    const isSelected = states.includes(state.code);
                    return (
                      <button
                        key={state.code}
                        type="button"
                        onClick={() => handleToggleState(state.code)}
                        className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                      >
                        <span>{state.code} - {state.name}</span>
                        {isSelected && <Check className="h-4 w-4 ml-2" />}
                      </button>
                    );
                  })}
                </div>
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
        )}
      </DialogContent>
    </Dialog>
  );
}
