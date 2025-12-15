import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, ShieldCheck, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  empresa: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

const AdminUsers = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('*')
    ]);

    setProfiles(profilesRes.data || []);
    setRoles(rolesRes.data || []);
    setIsLoading(false);
  };

  const toggleAdminRole = async (userId: string, isCurrentlyAdmin: boolean) => {
    if (isCurrentlyAdmin) {
      // Remove admin role
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (error) {
        toast({ title: "Erro", description: "Não foi possível remover admin", variant: "destructive" });
      } else {
        toast({ title: "Admin removido" });
        fetchData();
      }
    } else {
      // Add admin role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });

      if (error) {
        toast({ title: "Erro", description: "Não foi possível adicionar admin", variant: "destructive" });
      } else {
        toast({ title: "Admin adicionado" });
        fetchData();
      }
    }
  };

  const isAdmin = (userId: string) => {
    return roles.some((r) => r.user_id === userId && r.role === 'admin');
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Usuários</h2>
        <p className="text-muted-foreground">Gerencie os usuários do sistema</p>
      </div>

      {profiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium">Nenhum usuário cadastrado</h3>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {profiles.map((profile) => {
            const userIsAdmin = isAdmin(profile.user_id);
            return (
              <Card key={profile.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        userIsAdmin ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}>
                        {userIsAdmin ? <ShieldCheck className="h-6 w-6" /> : <User className="h-6 w-6" />}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{profile.nome}</CardTitle>
                        <CardDescription>{profile.email}</CardDescription>
                        {profile.telefone && (
                          <p className="text-sm text-muted-foreground">{profile.telefone}</p>
                        )}
                        {profile.empresa && (
                          <p className="text-sm text-muted-foreground">{profile.empresa}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={userIsAdmin ? "default" : "secondary"}>
                        {userIsAdmin ? "Admin" : "Usuário"}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleAdminRole(profile.user_id, userIsAdmin)}
                      >
                        {userIsAdmin ? "Remover Admin" : "Tornar Admin"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">
                    Cadastrado em {format(new Date(profile.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
