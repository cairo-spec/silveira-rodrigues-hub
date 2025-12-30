import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import HowItWorksSection from '@/components/HowItWorksSection';
import FeaturesShowcaseSection from '@/components/FeaturesShowcaseSection';
import JourneySection from '@/components/JourneySection';
import ROISection from '@/components/ROISection';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import { 
  Shield, 
  Clock, 
  CheckCircle2, 
  FileSearch, 
  AlertTriangle,
  Sparkles,
  Gift,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';

const TRIAL_SIGNUP_KEY = 'trial_signup_pending';

const Experimente = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { signUp, signInWithGoogle, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if we need to activate trial after OAuth redirect OR if user has stale session
  useEffect(() => {
    const handleUserSession = async () => {
      if (!user) return;

      const pendingTrial = localStorage.getItem(TRIAL_SIGNUP_KEY);

      // Check if user profile exists (handles deleted accounts with stale sessions)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, trial_active, access_authorized, subscription_active, trial_expires_at")
        .eq("user_id", user.id)
        .maybeSingle();

      // If profile doesn't exist, the account was deleted - sign out so they can create fresh
      if (!profile || profileError) {
        console.log("Profile not found for user, signing out stale session");
        localStorage.removeItem(TRIAL_SIGNUP_KEY);
        await supabase.auth.signOut();
        return;
      }

      // If this is a trial signup callback (from Google OAuth or returning user)
      if (pendingTrial === "true") {
        localStorage.removeItem(TRIAL_SIGNUP_KEY);

        // Check if user already has full access
        if (profile.subscription_active || (profile.trial_active && profile.access_authorized)) {
          toast({
            title: "Bem-vindo de volta! 🎉",
            description: profile.subscription_active 
              ? "Você já é um assinante ativo." 
              : "Seu período de teste ainda está ativo.",
          });
          navigate("/membros");
          return;
        }

        // Activate trial via backend function (secure server-side activation)
        // NOTE: We pass the access token explicitly to avoid intermittent missing-auth issues right after OAuth redirects.
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;

        if (!accessToken) {
          toast({
            title: "Sessão não encontrada",
            description: "Faça login novamente para ativar o trial.",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        const { data: trialResult, error: trialError } = await supabase.functions.invoke('activate-trial', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (trialError) {
          console.error("Error activating trial:", trialError);
          toast({
            title: "Erro ao ativar trial",
            description: "Entre em contato com o suporte.",
            variant: "destructive",
          });
        } else if (trialResult?.alreadyActive) {
          toast({
            title: "Bem-vindo de volta! 🎉",
            description: "Seu acesso já está ativo.",
          });
        } else if (trialResult?.alreadyUsed || trialResult?.accountTooOld) {
          // User already had trial or is trying to game the system
          toast({
            title: "Trial não disponível",
            description: "O período de teste gratuito só está disponível para novas contas.",
            variant: "destructive",
          });
        } else if (trialResult?.success) {
          toast({
            title: "Trial ativado! 🎉",
            description: "Você tem 30 dias grátis para explorar todos os recursos.",
          });
        }

        navigate("/membros");
      }
      // If user is logged in but not from trial signup, let them view the page
      // They might be a free user wanting to see/activate the trial offer
    };

    handleUserSession();
  }, [user, navigate, toast]);

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);

    // Mark this as a trial signup before redirecting
    localStorage.setItem(TRIAL_SIGNUP_KEY, "true");

    // IMPORTANT: Redirect back to /experimente so we can activate trial + access after OAuth
    const { error } = await signInWithGoogle("/experimente");

    if (error) {
      localStorage.removeItem(TRIAL_SIGNUP_KEY);
      toast({
        title: "Erro",
        description: "Não foi possível conectar com o Google. Tente novamente.",
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim() || !email.trim() || !password.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, {
        nome,
        telefone,
        trial_signup: true,
      });

      if (error) {
        let errorMessage = "Ocorreu um erro ao criar sua conta.";
        
        if (error.message.includes('already registered')) {
          errorMessage = "Este e-mail já está cadastrado. Tente fazer login.";
        } else if (error.message.includes('Invalid email')) {
          errorMessage = "Por favor, insira um e-mail válido.";
        }
        
        toast({
          title: "Erro no cadastro",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Conta criada com sucesso! 🎉",
        description: "Seu período de 30 dias grátis foi ativado. Verifique seu e-mail para confirmar.",
      });
      
      navigate('/membros');
    } catch {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    {
      icon: FileSearch,
      title: "Oportunidades Auditadas",
      description: "Acesso ao Jornal de Licitações com análises detalhadas de cada edital"
    },
    {
      icon: Shield,
      title: "Proteção Jurídica",
      description: "Consultoria especializada para evitar desclassificações e penalidades"
    },
    {
      icon: Clock,
      title: "Suporte Prioritário",
      description: "Chat direto com nossa equipe de especialistas em licitações"
    },
    {
      icon: CheckCircle2,
      title: "Base de Conhecimento",
      description: "Modelos, guias e materiais exclusivos para sua empresa"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 py-12 lg:py-20 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Benefits */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
                <Gift className="h-4 w-4" />
                <span className="text-sm font-medium">Oferta especial por tempo limitado</span>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight animate-fade-in">
                  <span className="bg-gradient-to-r from-primary via-emerald-500 to-primary bg-[length:200%_auto] animate-[gradient_3s_ease-in-out_infinite] bg-clip-text text-transparent">
                    30 dias grátis
                  </span>
                  <br />
                  <span className="text-foreground">para testar</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg">
                  Experimente todos os recursos do Escritório de Partido sem compromisso. 
                  <span className="text-foreground font-medium"> Sem cartão de crédito. Sem pegadinhas.</span>
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div 
                    key={index}
                    className="flex gap-3 p-4 rounded-xl bg-card/50 backdrop-blur border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <benefit.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{benefit.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Cancele quando quiser</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Sem cobrança automática</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>100% sem risco</span>
                </div>
              </div>
            </div>

            {/* Right Column - Signup Form */}
            <div className="lg:pl-8">
              <Card className="border-2 border-primary/20 shadow-2xl shadow-primary/10 backdrop-blur">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-2xl">Comece seu teste grátis</CardTitle>
                  <CardDescription className="text-base">
                    Acesso imediato a todos os recursos por 30 dias
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome completo *</Label>
                      <Input
                        id="nome"
                        type="text"
                        placeholder="Seu nome"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone (WhatsApp)</Label>
                      <Input
                        id="telefone"
                        type="tel"
                        placeholder="(00) 00000-0000"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Senha *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Mínimo 6 caracteres"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          className="h-11 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      size="lg"
                      className="w-full h-12 text-base font-semibold mt-6"
                      disabled={isLoading || isGoogleLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Criando conta...
                        </>
                      ) : (
                        <>
                          Criar conta grátis
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">ou continue com</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="w-full h-12"
                      onClick={handleGoogleSignup}
                      disabled={isLoading || isGoogleLoading}
                    >
                      {isGoogleLoading ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                      )}
                      {isGoogleLoading ? 'Conectando...' : 'Google'}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground pt-2">
                      Ao criar sua conta, você concorda com nossos{' '}
                      <a href="#" className="text-primary hover:underline">Termos de Uso</a>
                      {' '}e{' '}
                      <a href="#" className="text-primary hover:underline">Política de Privacidade</a>
                    </p>
                  </form>
                </CardContent>
              </Card>

              {/* Additional Info */}
              <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-700 dark:text-amber-400">
                      Oferta por tempo limitado
                    </p>
                    <p className="text-muted-foreground mt-1">
                      Após o período de teste, você decide se quer continuar. 
                      Sem surpresas, sem cobranças automáticas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Sections */}
      <HowItWorksSection />
      <FeaturesShowcaseSection />
      <JourneySection />
      <ROISection />

      {/* Footer */}
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <a href="/auth" className="text-primary hover:underline font-medium">
            Fazer login
          </a>
        </p>
      </div>
      <FloatingWhatsApp />
    </div>
  );
};

export default Experimente;
