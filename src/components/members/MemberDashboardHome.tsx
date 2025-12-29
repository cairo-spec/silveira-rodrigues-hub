import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, FileText, MessageCircle, Bell } from "lucide-react";

interface DashboardStats {
  ticketsAbertos: number;
  ticketsTotal: number;
  oportunidadesRecentes: number;
  notificacoesNaoLidas: number;
}

interface MemberDashboardHomeProps {
  onNavigate: (tab: string) => void;
}

const MemberDashboardHome = ({ onNavigate }: MemberDashboardHomeProps) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    ticketsAbertos: 0,
    ticketsTotal: 0,
    oportunidadesRecentes: 0,
    notificacoesNaoLidas: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        // Fetch tickets
        const { data: tickets } = await supabase
          .from("tickets")
          .select("id, status")
          .eq("user_id", user.id);

        const ticketsAbertos = tickets?.filter(t => 
          t.status === "open" || t.status === "in_progress" || t.status === "under_review"
        ).length || 0;
        const ticketsTotal = tickets?.length || 0;

        // Fetch recent opportunities (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { data: opportunities } = await supabase
          .from("audited_opportunities")
          .select("id")
          .gte("created_at", sevenDaysAgo.toISOString());
        const oportunidadesRecentes = opportunities?.length || 0;

        // Skip notifications count - it's shown in NotificationBell
        const notificacoesNaoLidas = 0;

        setStats({
          ticketsAbertos,
          ticketsTotal,
          oportunidadesRecentes,
          notificacoesNaoLidas,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const statCards = [
    {
      title: "Tickets Abertos",
      value: stats.ticketsAbertos,
      description: `${stats.ticketsTotal} tickets no total`,
      icon: Ticket,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Oportunidades Recentes",
      value: stats.oportunidadesRecentes,
      description: "Últimos 7 dias",
      icon: FileText,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Notificações",
      value: stats.notificacoesNaoLidas,
      description: "Não lidas",
      icon: Bell,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Bem-vindo!</h2>
        <p className="text-muted-foreground">
          Aqui está um resumo da sua atividade.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : card.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acesso Rápido</CardTitle>
          <CardDescription>
            Navegue pelas principais funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onNavigate("jornal")}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Jornal Auditado</h3>
                  <p className="text-sm text-muted-foreground">
                    Veja as últimas oportunidades
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onNavigate("tickets")}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Ticket className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Meus Tickets</h3>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe seus pedidos
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onNavigate("suporte")}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Suporte</h3>
                  <p className="text-sm text-muted-foreground">
                    Fale com nossa equipe
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MemberDashboardHome;
