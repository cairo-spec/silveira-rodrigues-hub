import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ticket, BookOpen, MessageCircle, LogOut, User, Settings, Home } from "lucide-react";
import TicketList from "./TicketList";
import KnowledgeBase from "./KnowledgeBase";
import LiveChat from "./LiveChat";
import MemberProfile from "./MemberProfile";
import SettingsPanel from "./SettingsPanel";

const MemberDashboard = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("chat");
  const [isSubscriber, setIsSubscriber] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_active")
        .eq("user_id", user.id)
        .maybeSingle();
      
      setIsSubscriber(profile?.subscription_active || false);
      
      // If subscriber, default to tickets tab
      if (profile?.subscription_active) {
        setActiveTab("tickets");
      }
    };

    checkSubscription();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

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
                <Home className="h-5 w-5" />
                <span className="font-bold text-lg hidden sm:inline">Silveira & Rodrigues</span>
              </Link>
              <div className="hidden sm:block h-6 w-px bg-primary-foreground/30" />
              <div>
                <h1 className="text-xl font-bold">Área de Membros</h1>
                <p className="text-sm opacity-80">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleSignOut}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-custom py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${isSubscriber ? 'grid-cols-5' : 'grid-cols-4'} lg:w-auto lg:inline-grid`}>
            {isSubscriber && (
              <TabsTrigger value="tickets" className="gap-2">
                <Ticket className="h-4 w-4" />
                <span className="hidden sm:inline">Tickets</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="knowledge" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Ajuda</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
          </TabsList>

          {isSubscriber && (
            <TabsContent value="tickets" className="mt-6">
              <TicketList />
            </TabsContent>
          )}

          <TabsContent value="knowledge" className="mt-6">
            <KnowledgeBase isSubscriber={isSubscriber} />
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            <LiveChat isSubscriber={isSubscriber} />
          </TabsContent>

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
