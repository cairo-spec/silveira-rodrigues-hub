import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, ShieldCheck, User, Clock, CreditCard, UserCheck, UserX, Timer } from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  empresa: string | null;
  subscription_active: boolean | null;
  trial_active: boolean | null;
  trial_expires_at: string | null;
  access_authorized: boolean | null;
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

  const toggleTrial = async (profile: Profile) => {
    const newTrialStatus = !profile.trial_active;
    
    // Set expiration date to 30 days from now when activating trial
    const trialExpiresAt = newTrialStatus ? addDays(new Date(), 30).toISOString() : null;
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        trial_active: newTrialStatus,
        trial_expires_at: trialExpiresAt
      })
      .eq('user_id', profile.user_id);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível atualizar o trial", variant: "destructive" });
    } else {
      toast({ title: newTrialStatus ? "Período de teste ativado (30 dias)" : "Período de teste revogado" });
      fetchData();
    }
  };

  // Calculate days remaining for trial
  const getTrialDaysRemaining = (expiresAt: string | null): number | null => {
    if (!expiresAt) return null;
    const days = differenceInDays(new Date(expiresAt), new Date());
    return days >= 0 ? days : 0;
  };

  const toggleAccess = async (profile: Profile) => {
    const newAccessStatus = !profile.access_authorized;
    
    const { error } = await supabase
      .from('profiles')
      .update({ access_authorized: newAccessStatus })
      .eq('user_id', profile.user_id);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível atualizar o acesso", variant: "destructive" });
    } else {
      toast({ title: newAccessStatus ? "Acesso autorizado" : "Acesso revogado" });
      fetchData();
    }
  };

  // Check if email is from the office domain
  const isOfficeDomain = (email: string) => {
    return email.toLowerCase().endsWith('@silveiraerodrigues.adv.br');
  };

  // Check if user is a free user (not subscriber, not trial, not admin)
  const isFreeUser = (profile: Profile) => {
    return !profile.subscription_active && !profile.trial_active && !isAdmin(profile.user_id);
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
            const isOffice = isOfficeDomain(profile.email);
            const isFree = isFreeUser(profile);
            
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
                      <div className="flex gap-2 flex-wrap justify-end">
                        <Badge variant={userIsAdmin ? "default" : "secondary"}>
                          {userIsAdmin ? "Admin" : "Usuário"}
                        </Badge>
                        {profile.subscription_active && (
                          <Badge variant="default" className="bg-green-600">
                            <CreditCard className="h-3 w-3 mr-1" />
                            Assinante
                          </Badge>
                        )}
                        {profile.trial_active && !profile.subscription_active && (
                          <Badge variant="outline" className="border-amber-500 text-amber-600">
                            <Clock className="h-3 w-3 mr-1" />
                            Trial
                            {profile.trial_expires_at && (
                              <span className="ml-1 font-bold">
                                ({getTrialDaysRemaining(profile.trial_expires_at)}d)
                              </span>
                            )}
                          </Badge>
                        )}
                        {isFree && profile.access_authorized && (
                          <Badge variant="outline" className="border-blue-500 text-blue-600">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Acesso Autorizado
                          </Badge>
                        )}
                        {isFree && !profile.access_authorized && (
                          <Badge variant="outline" className="border-red-500 text-red-600">
                            <UserX className="h-3 w-3 mr-1" />
                            Aguardando Autorização
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap justify-end">
                        {/* Show Admin button only for office domain users */}
                        {isOffice && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => toggleAdminRole(profile.user_id, userIsAdmin)}
                          >
                            {userIsAdmin ? "Remover Admin" : "Tornar Admin"}
                          </Button>
                        )}
                        
                        {/* Show Trial and Access buttons only for non-office domain users */}
                        {!isOffice && (
                          <>
                            {!profile.subscription_active && (
                              <Button 
                                variant={profile.trial_active ? "destructive" : "secondary"}
                                size="sm"
                                onClick={() => toggleTrial(profile)}
                              >
                                {profile.trial_active ? "Revogar Trial" : "Conceder Trial"}
                              </Button>
                            )}
                            {isFree && (
                              <Button 
                                variant={profile.access_authorized ? "destructive" : "default"}
                                size="sm"
                                onClick={() => toggleAccess(profile)}
                              >
                                {profile.access_authorized ? (
                                  <>
                                    <UserX className="h-4 w-4 mr-1" />
                                    Kick
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-1" />
                                    Autorizar Acesso
                                  </>
                                )}
                              </Button>
                            )}
                          </>
                        )}
                      </div>
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