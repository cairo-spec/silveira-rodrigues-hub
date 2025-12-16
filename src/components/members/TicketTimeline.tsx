import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CheckCircle, 
  Clock, 
  MessageSquare, 
  UserPlus, 
  AlertCircle,
  RefreshCw,
  XCircle,
  FileText,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketEvent {
  id: string;
  ticket_id: string;
  user_id: string;
  event_type: string;
  old_value: string | null;
  new_value: string | null;
  metadata: unknown;
  created_at: string;
}

interface TicketTimelineProps {
  ticketId: string;
  ticketCreatedAt: string;
}

const eventConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  created: { 
    icon: <FileText className="h-4 w-4" />, 
    label: "Ticket criado", 
    color: "bg-blue-500" 
  },
  status_changed: { 
    icon: <RefreshCw className="h-4 w-4" />, 
    label: "Status alterado", 
    color: "bg-amber-500" 
  },
  comment: { 
    icon: <MessageSquare className="h-4 w-4" />, 
    label: "Comentário adicionado", 
    color: "bg-primary" 
  },
  assigned: { 
    icon: <UserPlus className="h-4 w-4" />, 
    label: "Ticket atribuído", 
    color: "bg-purple-500" 
  },
  closed: { 
    icon: <CheckCircle className="h-4 w-4" />, 
    label: "Ticket fechado", 
    color: "bg-green-500" 
  },
  reopened: { 
    icon: <AlertCircle className="h-4 w-4" />, 
    label: "Ticket reaberto", 
    color: "bg-orange-500" 
  },
  cancelled: { 
    icon: <XCircle className="h-4 w-4" />, 
    label: "Ticket cancelado", 
    color: "bg-destructive" 
  },
};

const statusLabels: Record<string, string> = {
  open: "Aberto",
  in_progress: "Em andamento",
  resolved: "Resolvido",
  closed: "Fechado",
};

const TicketTimeline = ({ ticketId, ticketCreatedAt }: TicketTimelineProps) => {
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEvents();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`ticket-events-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_events',
          filter: `ticket_id=eq.${ticketId}`
        },
        (payload) => {
          setEvents((prev) => [...prev, payload.new as TicketEvent]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('ticket_events')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setEvents(data);
    }
    setIsLoading(false);
  };

  // Add creation event at the start
  const allEvents = [
    {
      id: 'creation',
      ticket_id: ticketId,
      user_id: '',
      event_type: 'created',
      old_value: null,
      new_value: null,
      metadata: null,
      created_at: ticketCreatedAt,
    },
    ...events,
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <h4 className="text-sm font-semibold text-foreground mb-3">Timeline de Eventos</h4>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-border" />
        
        <div className="space-y-4">
          {allEvents.map((event, index) => {
            const config = eventConfig[event.event_type] || eventConfig.comment;
            const isLast = index === allEvents.length - 1;
            
            return (
              <div key={event.id} className="relative flex gap-3">
                {/* Icon circle */}
                <div className={cn(
                  "relative z-10 flex items-center justify-center w-6 h-6 rounded-full text-white shrink-0",
                  config.color
                )}>
                  {config.icon}
                </div>
                
                {/* Content */}
                <div className={cn("flex-1 pb-2", !isLast && "border-b border-border/50")}>
                  <p className="text-sm font-medium text-foreground">
                    {config.label}
                    {event.event_type === 'status_changed' && event.new_value && (
                      <span className="text-muted-foreground font-normal">
                        {' → '}{statusLabels[event.new_value] || event.new_value}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(event.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TicketTimeline;
