import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Ticket, BookOpen, MessageCircle, LogOut, Users, Settings, DollarSign, User, PenTool, Key } from "lucide-react";
import AdminTickets from "./AdminTickets";
import AdminKnowledgeBase from "./AdminKnowledgeBase";
import AdminChats from "./AdminChats";
import AdminUsers from "./AdminUsers";
import AdminPricingTable from "./AdminPricingTable";
import AdminJornal from "./AdminJornal";
import { AdminSearchCriteria } from "./AdminSearchCriteria";
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
        <div className="container-custom py-3 sm:py-4 px-2 sm:px-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Link 
                to="/" 
                className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
              >
                <span className="font-bold text-sm sm:text-lg">S&R</span>
              </Link>
              <div className="hidden sm:block h-6 w-px bg-primary-foreground/30" />
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold truncate">Admin</h1>
                <p className="text-xs sm:text-sm opacity-80 truncate hidden sm:block">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
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

      <main className="container-custom py-4 sm:py-8 px-2 sm:px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto -mx-2 px-2">
            <TabsList className="inline-flex w-auto min-w-full sm:min-w-0 sm:w-auto gap-1">
              <TabsTrigger value="tickets" className="gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm">
                <Ticket className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">Tickets</span>
              </TabsTrigger>
              <TabsTrigger value="chats" className="gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">Chats</span>
              </TabsTrigger>
              <TabsTrigger value="jornal" className="gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm">
                <PenTool className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">Publicar</span>
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm">
                <BookOpen className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">Base</span>
              </TabsTrigger>
              <TabsTrigger value="pricing" className="gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm">
                <DollarSign className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">Honor.</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm">
                <Users className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="chaves" className="gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm">
                <Key className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">Chaves</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="tickets"><AdminTickets /></TabsContent>
          <TabsContent value="chats"><AdminChats onMentionClick={handleMentionClick} /></TabsContent>
          <TabsContent value="jornal"><AdminJornal /></TabsContent>
          <TabsContent value="knowledge"><AdminKnowledgeBase /></TabsContent>
          <TabsContent value="pricing"><AdminPricingTable /></TabsContent>
          <TabsContent value="users"><AdminUsers /></TabsContent>
          <TabsContent value="chaves"><AdminSearchCriteria /></TabsContent>
          <TabsContent value="profile"><MemberProfile /></TabsContent>
          <TabsContent value="settings"><SettingsPanel /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;