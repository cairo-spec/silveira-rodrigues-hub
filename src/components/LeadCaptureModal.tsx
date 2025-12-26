import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import ContractModal from "./ContractModal";
import PricingTableModal from "./PricingTableModal";

const formSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100),
  email: z.string().email("E-mail inválido").max(255),
  telefone: z.string().min(10, "Telefone inválido").max(20),
  lgpdConsent: z.boolean().refine((val) => val === true, {
    message: "Você deve aceitar para continuar",
  }),
  contractConsent: z.boolean().refine((val) => val === true, {
    message: "Você deve aceitar o contrato para continuar",
  }),
});

type FormData = z.infer<typeof formSchema>;

interface LeadCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkoutUrl: string;
}

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xpwrwqkz";

const LeadCaptureModal = ({ open, onOpenChange, checkoutUrl }: LeadCaptureModalProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      lgpdConsent: false,
      contractConsent: false,
    },
  });

  // Handle interaction with contract section when not logged in
  const handleContractInteraction = (e: React.MouseEvent | React.ChangeEvent) => {
    if (!user) {
      e.preventDefault();
      e.stopPropagation();
      setShowLoginPrompt(true);
      return true;
    }
    return false;
  };

  const onSubmit = async (data: FormData) => {
    // If user is not logged in, redirect to auth
    if (!user) {
      onOpenChange(false);
      navigate("/auth");
      return;
    }

    // Validate checkout URL before redirecting
    try {
      // eslint-disable-next-line no-new
      new URL(checkoutUrl);
    } catch {
      toast({
        title: "Link de pagamento inválido",
        description: "Não foi possível abrir o checkout. Tente novamente em alguns instantes.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Não bloqueie o checkout por falha no envio do lead (adblock/CORS etc.)
    try {
      if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
        const payload = new Blob([
          JSON.stringify({
            nome: data.nome,
            email: data.email,
            telefone: data.telefone,
            lgpdConsent: data.lgpdConsent,
            userId: user.id,
            _subject: "Novo Lead - Jornal de Licitações",
          }),
        ], { type: "application/json" });

        navigator.sendBeacon(FORMSPREE_ENDPOINT, payload);
      } else {
        const response = await fetch(FORMSPREE_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            nome: data.nome,
            email: data.email,
            telefone: data.telefone,
            lgpdConsent: data.lgpdConsent,
            userId: user.id,
            _subject: "Novo Lead - Jornal de Licitações",
          }),
        });

        if (!response.ok) {
          toast({
            title: "Aviso",
            description: "Não foi possível registrar o lead, mas vamos continuar para o pagamento.",
          });
        }
      }
    } catch {
      toast({
        title: "Aviso",
        description: "Não foi possível registrar o lead, mas vamos continuar para o pagamento.",
      });
    } finally {
      window.location.assign(checkoutUrl);
    }
  };

  const handleLoginRedirect = () => {
    onOpenChange(false);
    navigate("/auth");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[95vh] overflow-y-auto mx-2 p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg sm:text-2xl font-bold text-center">
            Assine o Jornal de Licitações
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground text-xs sm:text-sm">
            {showLoginPrompt && !user 
              ? "Para aceitar o contrato, você precisa estar logado"
              : "Preencha seus dados para continuar para o pagamento seguro"
            }
          </DialogDescription>
        </DialogHeader>

        {showLoginPrompt && !user ? (
          <div className="space-y-4 mt-4">
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Para aceitar o contrato e acessar a tabela de honorários, 
                é necessário criar uma conta ou fazer login primeiro.
              </p>
              <Button onClick={handleLoginRedirect} className="w-full">
                Criar Conta / Fazer Login
              </Button>
            </div>
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => {
                setShowLoginPrompt(false);
                form.setValue("contractConsent", false);
              }}
            >
              Voltar
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 mt-2">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs sm:text-sm">Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome completo" className="h-9" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs sm:text-sm">E-mail Corporativo</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="seu@empresa.com.br" className="h-9" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs sm:text-sm">Telefone/WhatsApp</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="(00) 00000-0000" className="h-9" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contractConsent"
                render={({ field }) => (
                  <FormItem 
                    className={`flex flex-row items-start space-x-2 space-y-0 rounded-md border p-3 ${!user ? 'opacity-60 cursor-not-allowed' : ''}`}
                    onClick={(e) => {
                      if (!user) {
                        handleContractInteraction(e);
                      }
                    }}
                  >
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          if (!user) {
                            setShowLoginPrompt(true);
                            return;
                          }
                          field.onChange(checked);
                        }}
                        disabled={!user}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className={`text-xs sm:text-sm font-normal leading-relaxed ${user ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                        Li e concordo com o{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            if (!user) {
                              handleContractInteraction(e);
                              return;
                            }
                            setContractModalOpen(true);
                          }}
                          className="text-gold underline underline-offset-2 hover:text-gold/80 font-medium"
                        >
                          Contrato de Serviços Advocatícios de Partido
                        </button>
                        . Declaro estar ciente de que a mensalidade de R$ 997,00 refere-se aos serviços de Monitoramento e Triagem de Risco, e que atuações contenciosas (recursos/ações) serão cobradas conforme{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            if (!user) {
                              handleContractInteraction(e);
                              return;
                            }
                            setPricingModalOpen(true);
                          }}
                          className="text-gold underline underline-offset-2 hover:text-gold/80 font-medium"
                        >
                          Tabela de Honorários
                        </button>{" "}
                        anexa.
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lgpdConsent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-2 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-xs sm:text-sm font-normal cursor-pointer">
                        Aceito receber comunicações estratégicas de RGR e concordo com a Política de Privacidade (LGPD).
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full gradient-gold text-primary font-semibold py-4 sm:py-6 text-sm sm:text-lg hover:opacity-90 transition-opacity mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Continuar para Pagamento"
                )}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>

      <ContractModal open={contractModalOpen} onOpenChange={setContractModalOpen} />
      <PricingTableModal open={pricingModalOpen} onOpenChange={setPricingModalOpen} />
    </Dialog>
  );
};

export default LeadCaptureModal;
