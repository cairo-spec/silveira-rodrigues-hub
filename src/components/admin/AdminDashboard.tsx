import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Ticket, BookOpen, MessageCircle, LogOut, Users, Settings, DollarSign, User, PenTool } from "lucide-react";
import AdminTickets from "./AdminTickets";
import AdminKnowledgeBase from "./AdminKnowledgeBase";
import AdminChats from "./AdminChats";
import AdminUsers from "./AdminUsers";
import AdminPricingTable from "./AdminPricingTable";
import AdminJornal from "./AdminJornal";
import SettingsPanel from "../members/SettingsPanel";
import MemberProfile from "../members/MemberProfile";
import NotificationBell from "../members/NotificationBell";

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("tickets");
  const lastActivity = useRef(Date.now());

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  const handleMentionClick = (opportunityId: string) => {
    // Navigate to jornal tab - the admin can find the opportunity there
    setActiveTab("jornal");
  };

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

  return (
    <div className="min-h-screen bg-secondary">
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
                <h1 className="text-xl font-bold">Painel Administrativo</h1>
                <p className="text-sm opacity-80">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell 
                onNotificationClick={(type) => {
                  if (type === 'ticket_message' || type === 'new_ticket') {
                    setActiveTab('tickets');
                  } else if (type === 'chat_message') {
                    setActiveTab('chats');
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

      <main className="container-custom py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="tickets" className="gap-2">
              <Ticket className="h-4 w-4" />
              <span className="hidden sm:inline">Tickets</span>
            </TabsTrigger>
            <TabsTrigger value="chats" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Chats</span>
            </TabsTrigger>
            <TabsTrigger value="jornal" className="gap-2">
              <PenTool className="h-4 w-4" />
              <span className="hidden sm:inline">Publicar</span>
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Base</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Honorários</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tickets"><AdminTickets /></TabsContent>
          <TabsContent value="chats"><AdminChats onMentionClick={handleMentionClick} /></TabsContent>
          <TabsContent value="jornal"><AdminJornal /></TabsContent>
          <TabsContent value="knowledge"><AdminKnowledgeBase /></TabsContent>
          <TabsContent value="pricing"><AdminPricingTable /></TabsContent>
          <TabsContent value="users"><AdminUsers /></TabsContent>
          <TabsContent value="profile"><MemberProfile /></TabsContent>
          <TabsContent value="settings"><SettingsPanel /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;