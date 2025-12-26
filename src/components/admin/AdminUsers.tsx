import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Users, ShieldCheck, User, Clock, CreditCard, UserCheck, UserX, Building2, Trash2 } from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  empresa: string | null;
  client_organization_id: string | null;
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

interface Organization {
  id: string;
  name: string;
}

const AdminUsers = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [organizationInput, setOrganizationInput] = useState("");
  const [newOrgName, setNewOrgName] = useState("");
  const [existingOrgs, setExistingOrgs] = useState<Organization[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [deletingUser, setDeletingUser] = useState<Profile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [profilesRes, rolesRes, orgsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('*'),
      supabase.from('organizations').select('id, name')
    ]);

    setProfiles(profilesRes.data || []);
    setRoles(rolesRes.data || []);

    // Use organizations table for names
    if (orgsRes.data) {
      setExistingOrgs(orgsRes.data);
    }

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

  const openEditModal = (profile: Profile) => {
    setEditingProfile(profile);
    setOrganizationInput(profile.client_organization_id || "");
    setNewOrgName("");
    setIsCreatingOrg(false);
  };

  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) {
      toast({ title: "Erro", description: "Digite o nome da organização", variant: "destructive" });
      return;
    }

    setIsUpdating(true);

    // Create new organization
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: newOrgName.trim() })
      .select('id, name')
      .single();

    if (orgError || !newOrg) {
      toast({ title: "Erro", description: "Não foi possível criar a organização", variant: "destructive" });
      setIsUpdating(false);
      return;
    }

    // Set the new org as selected
    setOrganizationInput(newOrg.id);
    setExistingOrgs([...existingOrgs, newOrg]);
    setNewOrgName("");
    setIsCreatingOrg(false);
    toast({ title: "Organização criada", description: newOrg.name });
    setIsUpdating(false);
  };

  const handleUpdateOrganization = async () => {
    if (!editingProfile) return;

    setIsUpdating(true);

    // Handle special "none" value
    const newOrgId = organizationInput === "__none__" || !organizationInput.trim() ? null : organizationInput.trim();

    const { error } = await supabase
      .from('profiles')
      .update({ client_organization_id: newOrgId })
      .eq('user_id', editingProfile.user_id);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível atualizar a organização", variant: "destructive" });
    } else {
      toast({ title: "Organização atualizada" });
      setEditingProfile(null);
      fetchData();
    }

    setIsUpdating(false);
  };

  const isOfficeDomain = (email: string) => {
    return email.toLowerCase().endsWith('@silveiraerodrigues.adv.br');
  };

  const isFreeUser = (profile: Profile) => {
    return !profile.subscription_active && !profile.trial_active && !isAdmin(profile.user_id);
  };

  const getOrgName = (orgId: string | null) => {
    if (!orgId) return null;
    const org = existingOrgs.find(o => o.id === orgId);
    return org?.name || `Org ${orgId.slice(0, 8)}...`;
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    
    setIsDeleting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('delete-user', {
        body: { userId: deletingUser.user_id }
      });

      if (response.error) {
        toast({ 
          title: "Erro", 
          description: response.error.message || "Não foi possível excluir o usuário", 
          variant: "destructive" 
        });
      } else {
        toast({ title: "Usuário excluído com sucesso" });
        setDeletingUser(null);
        fetchData();
      }
    } catch (error) {
      toast({ 
        title: "Erro", 
        description: "Erro ao excluir usuário", 
        variant: "destructive" 
      });
    }
    
    setIsDeleting(false);
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
                        {profile.client_organization_id ? (
                          <Badge variant="outline" className="mt-1 text-xs">
                            <Building2 className="h-3 w-3 mr-1" />
                            {getOrgName(profile.client_organization_id)}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="mt-1 text-xs text-muted-foreground">
                            Sem organização
                          </Badge>
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
                        {/* Edit Organization button for non-office users */}
                        {!isOffice && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(profile)}
                          >
                            <Building2 className="h-4 w-4 mr-1" />
                            Organização
                          </Button>
                        )}

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
                            <Button 
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeletingUser(profile)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

      {/* Edit Organization Modal */}
      <Dialog open={!!editingProfile} onOpenChange={() => setEditingProfile(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Organização</DialogTitle>
            <DialogDescription>
              Defina a organização do usuário <strong>{editingProfile?.nome}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Selecionar Organização Existente</Label>
              <Select
                value={organizationInput || "__none__"}
                onValueChange={(val) => setOrganizationInput(val === "__none__" ? "" : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolher organização..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhuma</SelectItem>
                  {existingOrgs.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou criar nova</span>
              </div>
            </div>

            {isCreatingOrg ? (
              <div className="space-y-2">
                <Label>Nome da Nova Organização</Label>
                <div className="flex gap-2">
                  <Input
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="Ex: Empresa ABC Ltda"
                  />
                  <Button
                    type="button"
                    onClick={handleCreateOrganization}
                    disabled={isUpdating || !newOrgName.trim()}
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar"}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreatingOrg(false)}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setIsCreatingOrg(true)}
              >
                + Criar Nova Organização
              </Button>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProfile(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateOrganization} disabled={isUpdating}>
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O usuário <strong>{deletingUser?.nome}</strong> ({deletingUser?.email}) será permanentemente removido do sistema, incluindo todos os seus dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;