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
        .select("subscription_active, trial_active, trial_expires_at, access_authorized")
        .eq("user_id", user.id)
        .maybeSingle();
      
      // Check if trial has expired
      let trialValid = profile?.trial_active || false;
      if (trialValid && profile?.trial_expires_at) {
        const expiresAt = new Date(profile.trial_expires_at);
        if (expiresAt < new Date()) {
          // Trial has expired, deactivate it
          trialValid = false;
          await supabase
            .from("profiles")
            .update({ trial_active: false })
            .eq("user_id", user.id);
        }
      }
      
      // Full access (support chat, premium KB) for subscribers or valid trial users
      const hasFullAccess = profile?.subscription_active || trialValid;
      setIsSubscriber(hasFullAccess);
      
      // Paid subscriber only (for pricing display) - only those with Asaas webhook confirmed
      setIsPaidSubscriber(profile?.subscription_active || false);
      
      // Free user authorization check
      const isFree = !profile?.subscription_active && !trialValid;
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
    const whatsappMessage = encodeURIComponent("Olá! Preciso de suporte para liberar meu acesso à área de membros.");
    const whatsappUrl = `https://wa.me/5531993475792?text=${whatsappMessage}`;
    
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <Lock className="h-16 w-16 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-bold">Acesso Pendente</h2>
            <p className="text-muted-foreground">
              O acesso à área de membros é liberado automaticamente após a confirmação do seu pagamento.
            </p>
            <p className="text-sm text-muted-foreground">
              Se você já realizou o pagamento e ainda não teve o acesso liberado, entre em contato com nosso suporte.
            </p>
            <div className="flex flex-col gap-2 pt-4">
              <Button variant="outline" onClick={() => navigate("/")}>
                Voltar ao Site
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => window.open(whatsappUrl, '_blank')}
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Falar com Suporte
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