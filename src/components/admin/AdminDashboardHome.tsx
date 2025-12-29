import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Users, MessageCircle, FileText, TrendingUp, Clock } from "lucide-react";

interface AdminStats {
  ticketsNovos: number;
  ticketsEmAndamento: number;
  ticketsTotal: number;
  usuariosAtivos: number;
  usuariosTotal: number;
  mensagensHoje: number;
  oportunidadesPublicadas: number;
}

interface AdminDashboardHomeProps {
  onNavigate: (tab: string) => void;
}

const AdminDashboardHome = ({ onNavigate }: AdminDashboardHomeProps) => {
  const [stats, setStats] = useState<AdminStats>({
    ticketsNovos: 0,
    ticketsEmAndamento: 0,
    ticketsTotal: 0,
    usuariosAtivos: 0,
    usuariosTotal: 0,
    mensagensHoje: 0,
    oportunidadesPublicadas: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch new tickets count
        const { count: ticketsNovos } = await supabase
          .from("tickets")
          .select("*", { count: "exact", head: true })
          .eq("status", "open");

        // Fetch in-progress tickets count
        const { count: ticketsEmAndamento } = await supabase
          .from("tickets")
          .select("*", { count: "exact", head: true })
          .eq("status", "in_progress");

        // Fetch total tickets count
        const { count: ticketsTotal } = await supabase
          .from("tickets")
          .select("*", { count: "exact", head: true });

        // Fetch active users (subscription_active or trial_active)
        const { count: usuariosAtivos } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .or("subscription_active.eq.true,trial_active.eq.true");

        // Fetch total users
        const { count: usuariosTotal } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        // Fetch messages today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: mensagensHoje } = await supabase
          .from("chat_messages")
          .select("*", { count: "exact", head: true })
          .gte("created_at", today.toISOString());

        // Fetch published opportunities
        const { count: oportunidadesPublicadas } = await supabase
          .from("audited_opportunities")
          .select("*", { count: "exact", head: true });

        setStats({
          ticketsNovos: ticketsNovos || 0,
          ticketsEmAndamento: ticketsEmAndamento || 0,
          ticketsTotal: ticketsTotal || 0,
          usuariosAtivos: usuariosAtivos || 0,
          usuariosTotal: usuariosTotal || 0,
          mensagensHoje: mensagensHoje || 0,
          oportunidadesPublicadas: oportunidadesPublicadas || 0,
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Tickets Novos",
      value: stats.ticketsNovos,
      description: "Aguardando atendimento",
      icon: Ticket,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Em Andamento",
      value: stats.ticketsEmAndamento,
      description: `${stats.ticketsTotal} tickets no total`,
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Usuários Ativos",
      value: stats.usuariosAtivos,
      description: `${stats.usuariosTotal} usuários no total`,
      icon: Users,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Mensagens Hoje",
      value: stats.mensagensHoje,
      description: "No chat de suporte",
      icon: MessageCircle,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Oportunidades",
      value: stats.oportunidadesPublicadas,
      description: "Publicadas no jornal",
      icon: FileText,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard Administrativo</h2>
        <p className="text-muted-foreground">
          Visão geral do sistema
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ações Rápidas
            </CardTitle>
            <CardDescription>
              Acesse as principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div 
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
              onClick={() => onNavigate("tickets")}
            >
              <Ticket className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Gerenciar Tickets</p>
                <p className="text-sm text-muted-foreground">
                  {stats.ticketsNovos} tickets aguardando atendimento
                </p>
              </div>
            </div>
            <div 
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
              onClick={() => onNavigate("chats")}
            >
              <MessageCircle className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Chat de Suporte</p>
                <p className="text-sm text-muted-foreground">
                  Responda às mensagens dos usuários
                </p>
              </div>
            </div>
            <div 
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
              onClick={() => onNavigate("jornal")}
            >
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Publicar Oportunidade</p>
                <p className="text-sm text-muted-foreground">
                  Adicione novas oportunidades ao jornal
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Resumo de Usuários
            </CardTitle>
            <CardDescription>
              Status dos usuários cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Usuários ativos</span>
                <span className="font-medium">{isLoading ? "..." : stats.usuariosAtivos}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ 
                    width: stats.usuariosTotal > 0 
                      ? `${(stats.usuariosAtivos / stats.usuariosTotal) * 100}%` 
                      : "0%" 
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total de usuários</span>
                <span className="font-medium">{isLoading ? "..." : stats.usuariosTotal}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardHome;
