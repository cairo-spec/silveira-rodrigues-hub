import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Ticket, BookOpen, LogOut, User, Settings, Headphones, DollarSign, Lock } from "lucide-react";
import TicketList from "./TicketList";
import KnowledgeBase from "./KnowledgeBase";
import LiveChat from "./LiveChat";
import MemberProfile from "./MemberProfile";
import SettingsPanel from "./SettingsPanel";
import NotificationBell from "./NotificationBell";
import PricingTable from "./PricingTable";

const MemberDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("tickets");
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [isPaidSubscriber, setIsPaidSubscriber] = useState(false);
  const [isFreeAuthorized, setIsFreeAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const lastActivity = useRef(Date.now());

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_active, trial_active, access_authorized")
        .eq("user_id", user.id)
        .maybeSingle();
      
      // Full access (support chat, premium KB) for subscribers or trial users
      const hasFullAccess = profile?.subscription_active || profile?.trial_active || false;
      setIsSubscriber(hasFullAccess);
      
      // Paid subscriber only (for pricing display) - only those with Asaas webhook confirmed
      setIsPaidSubscriber(profile?.subscription_active || false);
      
      // Free user authorization check
      const isFree = !profile?.subscription_active && !profile?.trial_active;
      setIsFreeAuthorized(isFree ? (profile?.access_authorized || false) : true);
      
      setIsLoading(false);
    };

    checkSubscription();
  }, [user]);

  // Activity tracking for session timeout
  useEffect(() => {
    const handleActivity = () => {
      lastActivity.current = Date.now();
    };
    
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('click', handleActivity);
    
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  // Show waiting screen for unauthorized free users
  if (!isLoading && !isFreeAuthorized) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <Lock className="h-16 w-16 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-bold">Aguardando Autorização</h2>
            <p className="text-muted-foreground">
              Sua conta foi criada com sucesso! Por favor, aguarde enquanto um administrador autoriza seu acesso à área de membros.
            </p>
            <p className="text-sm text-muted-foreground">
              Você receberá uma notificação assim que seu acesso for liberado.
            </p>
            <div className="flex gap-2 justify-center pt-4">
              <Button variant="outline" onClick={() => navigate("/")}>
                Voltar ao Site
              </Button>
              <Button variant="destructive" onClick={handleSignOut}>
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/" 
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <span className="font-bold text-lg">Silveira & Rodrigues</span>
              </Link>
              <div className="hidden sm:block h-6 w-px bg-primary-foreground/30" />
              <div>
                <h1 className="text-xl font-bold">Área de Membros</h1>
                <p className="text-sm opacity-80">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell 
                onNotificationClick={(type, refId) => {
                  if (type === 'ticket_message' || type === 'ticket_status') {
                    setActiveTab('tickets');
                  } else if (type === 'chat_message') {
                    setActiveTab('suporte');
                  }
                }}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
                    <User className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('profile')}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Perfil
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('settings')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleSignOut}
                    className="w-full justify-start text-destructive hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-custom py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="tickets" className="gap-2">
              <Ticket className="h-4 w-4" />
              <span className="hidden sm:inline">Tickets</span>
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Ajuda</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Honorários</span>
            </TabsTrigger>
            {/* Support chat available for all authorized users (item 9) */}
            <TabsTrigger value="suporte" className="gap-2">
              <Headphones className="h-4 w-4" />
              <span className="hidden sm:inline">Suporte</span>
            </TabsTrigger>
            {/* Lobby only for subscribers and trial users (item 9) */}
            {isSubscriber && (
              <TabsTrigger value="lobby" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Lobby</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="tickets" className="mt-6">
            <TicketList isPaidSubscriber={isPaidSubscriber} />
          </TabsContent>

          <TabsContent value="knowledge" className="mt-6">
            <KnowledgeBase isSubscriber={isSubscriber} />
          </TabsContent>

          <TabsContent value="pricing" className="mt-6">
            <PricingTable isPaidSubscriber={isPaidSubscriber} />
          </TabsContent>

          <TabsContent value="suporte" className="mt-6">
            <LiveChat roomType="suporte" />
          </TabsContent>

          {isSubscriber && (
            <TabsContent value="lobby" className="mt-6">
              <LiveChat roomType="lobby" />
            </TabsContent>
          )}

          <TabsContent value="profile" className="mt-6">
            <MemberProfile />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <SettingsPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MemberDashboard;