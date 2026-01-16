import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, Circle, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface ChecklistItem {
  id: string;
  document_name: string;
  order_index: number;
}

interface UserChecklistStatus {
  user_id: string;
  user_name: string;
  items: {
    item_id: string;
    is_completed: boolean;
  }[];
  completedCount: number;
  totalCount: number;
}

interface AdminChecklistStatusProps {
  opportunityId: string;
}

const AdminChecklistStatus = ({ opportunityId }: AdminChecklistStatusProps) => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [userStatuses, setUserStatuses] = useState<UserChecklistStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchChecklistStatus();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`admin-checklist-${opportunityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'opportunity_checklist_user_status'
        },
        () => fetchChecklistStatus()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'opportunity_checklist_items',
          filter: `opportunity_id=eq.${opportunityId}`
        },
        () => fetchChecklistStatus()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [opportunityId]);

  const fetchChecklistStatus = async () => {
    // Fetch checklist items
    const { data: checklistItems, error: itemsError } = await supabase
      .from("opportunity_checklist_items")
      .select("*")
      .eq("opportunity_id", opportunityId)
      .order("order_index", { ascending: true });

    if (itemsError || !checklistItems || checklistItems.length === 0) {
      setItems([]);
      setUserStatuses([]);
      setIsLoading(false);
      return;
    }

    setItems(checklistItems);
    const itemIds = checklistItems.map(i => i.id);

    // Fetch all user statuses for these items
    const { data: statusData } = await supabase
      .from("opportunity_checklist_user_status")
      .select("checklist_item_id, user_id, is_completed")
      .in("checklist_item_id", itemIds);

    // Get unique user IDs
    const userIds = [...new Set(statusData?.map(s => s.user_id) || [])];

    if (userIds.length === 0) {
      setUserStatuses([]);
      setIsLoading(false);
      return;
    }

    // Fetch user profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, nome")
      .in("user_id", userIds);

    // Build user status map
    const userStatusMap = new Map<string, UserChecklistStatus>();

    userIds.forEach(userId => {
      const profile = profiles?.find(p => p.user_id === userId);
      userStatusMap.set(userId, {
        user_id: userId,
        user_name: profile?.nome || "Usuário",
        items: [],
        completedCount: 0,
        totalCount: checklistItems.length
      });
    });

    statusData?.forEach(status => {
      const userStatus = userStatusMap.get(status.user_id);
      if (userStatus) {
        userStatus.items.push({
          item_id: status.checklist_item_id,
          is_completed: status.is_completed
        });
        if (status.is_completed) {
          userStatus.completedCount++;
        }
      }
    });

    setUserStatuses(Array.from(userStatusMap.values()));
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Nenhum item no checklist.
      </p>
    );
  }

  if (userStatuses.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Nenhum usuário marcou itens ainda.
        </p>
        <div className="space-y-1">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Circle className="h-3 w-3" />
              <span>{item.document_name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Status por Usuário</span>
      </div>

      {userStatuses.map((userStatus) => {
        const isComplete = userStatus.completedCount === userStatus.totalCount;
        const progressPercentage = Math.round((userStatus.completedCount / userStatus.totalCount) * 100);

        return (
          <Popover key={userStatus.user_id}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-between p-2 h-auto",
                  isComplete && "bg-green-50 dark:bg-green-950/20"
                )}
              >
                <div className="flex items-center gap-2">
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">{userStatus.user_name}</span>
                </div>
                <Badge 
                  variant={isComplete ? "default" : "outline"}
                  className={cn(
                    "text-xs",
                    isComplete && "bg-green-600"
                  )}
                >
                  {userStatus.completedCount}/{userStatus.totalCount} ({progressPercentage}%)
                </Badge>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Checklist - {userStatus.user_name}</h4>
                <div className="space-y-1">
                  {items.map((item) => {
                    const itemStatus = userStatus.items.find(i => i.item_id === item.id);
                    const isChecked = itemStatus?.is_completed || false;
                    
                    return (
                      <div 
                        key={item.id} 
                        className={cn(
                          "flex items-center gap-2 p-1 rounded text-sm",
                          isChecked && "bg-green-50 dark:bg-green-950/20"
                        )}
                      >
                        {isChecked ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className={cn(isChecked && "text-muted-foreground line-through")}>
                          {item.document_name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
};

export default AdminChecklistStatus;
