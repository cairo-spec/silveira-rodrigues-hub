import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChecklistItem {
  id: string;
  document_name: string;
  order_index: number;
}

interface OpportunityChecklistEditorProps {
  opportunityId: string;
}

const OpportunityChecklistEditor = ({ opportunityId }: OpportunityChecklistEditorProps) => {
  const { toast } = useToast();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchChecklist();
  }, [opportunityId]);

  const fetchChecklist = async () => {
    const { data, error } = await supabase
      .from("opportunity_checklist_items")
      .select("*")
      .eq("opportunity_id", opportunityId)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Error fetching checklist:", error);
    } else {
      setItems(data || []);
    }
    setIsLoading(false);
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;

    setIsAdding(true);
    const nextOrder = items.length > 0 ? Math.max(...items.map(i => i.order_index)) + 1 : 0;

    const { data, error } = await supabase
      .from("opportunity_checklist_items")
      .insert({
        opportunity_id: opportunityId,
        document_name: newItemName.trim(),
        order_index: nextOrder
      })
      .select()
      .single();

    if (error) {
      toast({ 
        title: "Erro ao adicionar item", 
        description: error.message, 
        variant: "destructive" 
      });
    } else {
      setItems([...items, data]);
      setNewItemName("");
      toast({ title: "Item adicionado" });
    }
    setIsAdding(false);
  };

  const handleDeleteItem = async (itemId: string) => {
    setDeletingId(itemId);

    const { error } = await supabase
      .from("opportunity_checklist_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      toast({ 
        title: "Erro ao remover item", 
        description: error.message, 
        variant: "destructive" 
      });
    } else {
      setItems(items.filter(i => i.id !== itemId));
      toast({ title: "Item removido" });
    }
    setDeletingId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Checklist de Documentos</Label>
      <p className="text-xs text-muted-foreground">
        Adicione os documentos que o cliente precisa providenciar para esta oportunidade.
      </p>
      
      {/* Add new item */}
      <div className="flex gap-2">
        <Input
          placeholder="Nome do documento..."
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddItem();
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          onClick={handleAddItem}
          disabled={isAdding || !newItemName.trim()}
        >
          {isAdding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </>
          )}
        </Button>
      </div>

      {/* Items list */}
      {items.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {items.map((item) => (
            <div 
              key={item.id}
              className="flex items-center gap-2 p-2 bg-muted/50 rounded-md group"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/50" />
              <span className="flex-1 text-sm">{item.document_name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                onClick={() => handleDeleteItem(item.id)}
                disabled={deletingId === item.id}
              >
                {deletingId === item.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3 text-destructive" />
                )}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic py-2">
          Nenhum documento adicionado ao checklist.
        </p>
      )}
    </div>
  );
};

export default OpportunityChecklistEditor;