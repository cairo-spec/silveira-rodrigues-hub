import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Lock, Bell, Shield, Loader2, Clock, Timer, Trash2, AlertTriangle, FileText } from "lucide-react";
import { differenceInDays, differenceInHours } from "date-fns";

const SESSION_TIMEOUT_OPTIONS = [
  { value: "30", label: "30 minutos" },
  { value: "60", label: "1 hora" },
  { value: "180", label: "3 horas" },
  { value: "360", label: "6 horas" },
  { value: "720", label: "12 horas" },
];

const SettingsPanel = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [trialInfo, setTrialInfo] = useState<{ active: boolean; expiresAt: string | null } | null>(null);
  
  // Account deletion state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Load settings from localStorage and fetch trial info
  useEffect(() => {
    const savedStayLoggedIn = localStorage.getItem('stayLoggedIn');
    const savedTimeout = localStorage.getItem('sessionTimeout');
    
    if (savedStayLoggedIn !== null) {
      setStayLoggedIn(savedStayLoggedIn === 'true');
    }
    if (savedTimeout) {
      setSessionTimeout(savedTimeout);
    }

    // Fetch trial info
    const fetchTrialInfo = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('trial_active, trial_expires_at')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setTrialInfo({
          active: data.trial_active || false,
          expiresAt: data.trial_expires_at
        });
      }
    };

    fetchTrialInfo();
  }, [user]);

  // Session timeout logic
  useEffect(() => {
    if (stayLoggedIn) return; // Don't timeout if stay logged in is enabled

    let lastActivity = Date.now();
    const timeoutMs = parseInt(sessionTimeout) * 60 * 1000;

    const handleActivity = () => {
      lastActivity = Date.now();
    };

    const checkTimeout = setInterval(() => {
      if (Date.now() - lastActivity > timeoutMs) {
        toast({
          title: "Sessão expirada",
          description: "Você foi desconectado por inatividade",
        });
        signOut();
        window.location.href = "/auth";
      }
    }, 60000); // Check every minute

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      clearInterval(checkTimeout);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [stayLoggedIn, sessionTimeout, signOut, toast]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter no mínimo 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    setIsChangingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      toast({
        title: "Erro ao alterar senha",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Senha alterada",
        description: "Sua senha foi atualizada com sucesso"
      });
      setNewPassword("");
      setConfirmPassword("");
    }

    setIsChangingPassword(false);
  };

  const handleStayLoggedInChange = (checked: boolean) => {
    setStayLoggedIn(checked);
    localStorage.setItem('stayLoggedIn', checked.toString());
  };

  const handleSessionTimeoutChange = (value: string) => {
    setSessionTimeout(value);
    localStorage.setItem('sessionTimeout', value);
  };

  // Calculate trial countdown
  const getTrialCountdown = () => {
    if (!trialInfo?.active || !trialInfo.expiresAt) return null;
    const days = differenceInDays(new Date(trialInfo.expiresAt), new Date());
    const hours = differenceInHours(new Date(trialInfo.expiresAt), new Date()) % 24;
    if (days < 0) return "Expirado";
    return `${days} dias e ${hours} horas`;
  };

  // Handle account deletion (LGPD Art. 18 - Right to deletion)
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "EXCLUIR MINHA CONTA") {
      toast({
        title: "Confirmação incorreta",
        description: "Digite exatamente: EXCLUIR MINHA CONTA",
        variant: "destructive"
      });
      return;
    }

    setIsDeleting(true);

    try {
      const { data, error } = await supabase.functions.invoke('delete-own-account', {
        body: { confirmationCode: deleteConfirmation }
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive"
        });
        setIsDeleting(false);
        return;
      }

      toast({
        title: "Conta excluída",
        description: "Sua conta foi excluída com sucesso. Você será redirecionado."
      });

      // Wait a bit then redirect
      setTimeout(() => {
        signOut();
        navigate("/");
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir a conta",
        variant: "destructive"
      });
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Trial Countdown */}
      {trialInfo?.active && trialInfo.expiresAt && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Timer className="h-5 w-5" />
              Período de Teste
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Tempo restante do seu período de teste:
              </p>
              <span className="text-lg font-bold text-amber-700 dark:text-amber-400">
                {getTrialCountdown()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Alterar Senha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Atualize sua senha de acesso ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme a nova senha"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Alterar Senha
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sessão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Configurações de Sessão
          </CardTitle>
          <CardDescription>
            Configure o comportamento da sua sessão
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Permanecer Logado</Label>
              <p className="text-sm text-muted-foreground">
                Desativa o logout automático por inatividade
              </p>
            </div>
            <Switch
              checked={stayLoggedIn}
              onCheckedChange={handleStayLoggedInChange}
            />
          </div>
          
          {!stayLoggedIn && (
            <div className="space-y-2">
              <Label>Tempo de Inatividade</Label>
              <Select value={sessionTimeout} onValueChange={handleSessionTimeoutChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tempo" />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_TIMEOUT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Você será desconectado após este período sem atividade
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
          <CardDescription>
            Configure suas preferências de notificação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações por E-mail</Label>
              <p className="text-sm text-muted-foreground">
                Receba atualizações sobre seus tickets por e-mail
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Segurança
          </CardTitle>
          <CardDescription>
            Informações de segurança da sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>E-mail da conta</Label>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Último acesso</Label>
            <p className="text-sm text-muted-foreground">
              {user?.last_sign_in_at 
                ? new Date(user.last_sign_in_at).toLocaleString('pt-BR')
                : 'Não disponível'}
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>ID da conta</Label>
            <p className="text-sm text-muted-foreground font-mono text-xs">
              {user?.id}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Seus Direitos LGPD */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Seus Direitos (LGPD)
          </CardTitle>
          <CardDescription>
            Direitos garantidos pela Lei Geral de Proteção de Dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Conforme a LGPD (Lei nº 13.709/2018), você tem direito a:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou desatualizados</li>
              <li>Solicitar a exclusão de seus dados</li>
              <li>Revogar o consentimento a qualquer momento</li>
            </ul>
          </div>
          <Separator />
          <a 
            href="/politica-dados" 
            target="_blank"
            className="text-sm text-primary underline hover:text-primary/80"
          >
            Ver Política de Privacidade completa
          </a>
        </CardContent>
      </Card>

      {/* Zona de Perigo - Exclusão de Conta */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Excluir Minha Conta
          </CardTitle>
          <CardDescription>
            Ação permanente e irreversível
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive mb-1">Atenção!</p>
                <p className="text-muted-foreground">
                  Ao excluir sua conta, todos os seus dados serão permanentemente removidos, 
                  incluindo tickets, mensagens e histórico. Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
          </div>
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Solicitar Exclusão da Conta
          </Button>
        </CardContent>
      </Card>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Exclusão de Conta
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Esta ação é <strong>permanente e irreversível</strong>. Todos os seus dados serão excluídos:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Perfil e informações pessoais</li>
                <li>Tickets e mensagens</li>
                <li>Histórico de chat</li>
                <li>Preferências e configurações</li>
              </ul>
              <div className="pt-4">
                <Label htmlFor="delete-confirmation" className="text-foreground">
                  Para confirmar, digite: <strong>EXCLUIR MINHA CONTA</strong>
                </Label>
                <Input
                  id="delete-confirmation"
                  className="mt-2"
                  placeholder="Digite aqui..."
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirmation !== "EXCLUIR MINHA CONTA"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir Permanentemente"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsPanel;