import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ticket, BookOpen, MessageCircle, LogOut, Users, Settings, Home, DollarSign } from "lucide-react";
import AdminTickets from "./AdminTickets";
import AdminKnowledgeBase from "./AdminKnowledgeBase";
import AdminChats from "./AdminChats";
import AdminUsers from "./AdminUsers";
import AdminPricingTable from "./AdminPricingTable";
import SettingsPanel from "../members/SettingsPanel";

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("tickets");

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

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
                <Home className="h-5 w-5" />
                <span className="font-bold text-lg hidden sm:inline">Silveira & Rodrigues</span>
              </Link>
              <div className="hidden sm:block h-6 w-px bg-primary-foreground/30" />
              <div>
                <h1 className="text-xl font-bold">Painel Administrativo</h1>
                <p className="text-sm opacity-80">{user?.email}</p>
              </div>
            </div>
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
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tickets"><AdminTickets /></TabsContent>
          <TabsContent value="chats"><AdminChats /></TabsContent>
          <TabsContent value="knowledge"><AdminKnowledgeBase /></TabsContent>
          <TabsContent value="pricing"><AdminPricingTable /></TabsContent>
          <TabsContent value="users"><AdminUsers /></TabsContent>
          <TabsContent value="settings"><SettingsPanel /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
