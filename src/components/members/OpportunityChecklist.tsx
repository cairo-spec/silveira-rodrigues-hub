import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  document_name: string;
  order_index: number;
}

interface UserStatus {
  checklist_item_id: string;
  is_completed: boolean;
}

interface OpportunityChecklistProps {
  opportunityId: string;
  readOnly?: boolean;
}

const OpportunityChecklist = ({ opportunityId, readOnly = false }: OpportunityChecklistProps) => {
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [userStatus, setUserStatus] = useState<Map<string, boolean>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchChecklist();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`checklist-${opportunityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'opportunity_checklist_items',
          filter: `opportunity_id=eq.${opportunityId}`
        },
        () => fetchChecklist()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [opportunityId]);

  const fetchChecklist = async () => {
    if (!user) return;

    const { data: checklistItems, error: itemsError } = await supabase
      .from("opportunity_checklist_items")
      .select("*")
      .eq("opportunity_id", opportunityId)
      .order("order_index", { ascending: true });

    if (itemsError) {
      console.error("Error fetching checklist items:", itemsError);
      setIsLoading(false);
      return;
    }

    setItems(checklistItems || []);

    if (checklistItems && checklistItems.length > 0) {
      const { data: statusData } = await supabase
        .from("opportunity_checklist_user_status")
        .select("checklist_item_id, is_completed")
        .eq("user_id", user.id)
        .in("checklist_item_id", checklistItems.map(i => i.id));

      const statusMap = new Map<string, boolean>();
      statusData?.forEach((s) => {
        statusMap.set(s.checklist_item_id, s.is_completed);
      });
      setUserStatus(statusMap);
    }

    setIsLoading(false);
  };

  const handleToggleItem = async (itemId: string) => {
    if (!user || readOnly) return;

    setUpdatingItems(prev => new Set(prev).add(itemId));
    const currentStatus = userStatus.get(itemId) || false;
    const newStatus = !currentStatus;

    // Optimistically update UI
    setUserStatus(prev => new Map(prev).set(itemId, newStatus));

    const { data: existing } = await supabase
      .from("opportunity_checklist_user_status")
      .select("id")
      .eq("checklist_item_id", itemId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("opportunity_checklist_user_status")
        .update({
          is_completed: newStatus,
          completed_at: newStatus ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("opportunity_checklist_user_status")
        .insert({
          checklist_item_id: itemId,
          user_id: user.id,
          is_completed: newStatus,
          completed_at: newStatus ? new Date().toISOString() : null
        });
    }

    setUpdatingItems(prev => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  const completedCount = items.filter(item => userStatus.get(item.id)).length;
  const totalCount = items.length;
  const progressPercentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Checklist de Documentos</h4>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{totalCount} ({progressPercentage}%)
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-1.5">
        <div 
          className="bg-primary h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const isCompleted = userStatus.get(item.id) || false;
          const isUpdating = updatingItems.has(item.id);
          
          return (
            <div 
              key={item.id}
              className={cn(
                "flex items-center gap-3 p-2 rounded-md transition-colors",
                !readOnly && "cursor-pointer hover:bg-muted/50",
                isCompleted && "bg-green-50 dark:bg-green-950/20"
              )}
              onClick={() => !readOnly && handleToggleItem(item.id)}
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
              ) : (
                <Checkbox 
                  checked={isCompleted}
                  disabled={readOnly}
                  className="shrink-0"
                />
              )}
              <Label 
                className={cn(
                  "text-sm cursor-pointer flex-1",
                  isCompleted && "line-through text-muted-foreground"
                )}
              >
                {item.document_name}
              </Label>
              {isCompleted && (
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OpportunityChecklist;