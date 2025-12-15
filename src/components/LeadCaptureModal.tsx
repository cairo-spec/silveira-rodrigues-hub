import { useState } from "react";
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

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xpwrwqkz"; // Substitua pelo seu endpoint Formspree

const LeadCaptureModal = ({ open, onOpenChange, checkoutUrl }: LeadCaptureModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);

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

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
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
          _subject: "Novo Lead - Jornal de Licitações",
        }),
      });

      if (response.ok) {
        // Redirect to Asaas checkout
        window.location.href = checkoutUrl;
      } else {
        console.error("Form submission failed");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Assine o Jornal de Licitações
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Preencha seus dados para continuar para o pagamento seguro
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Seu nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail Corporativo</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="seu@empresa.com.br" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone/WhatsApp</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="(00) 00000-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contractConsent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal cursor-pointer leading-relaxed">
                      Li e concordo com o{" "}
                      <button
                        type="button"
                        onClick={() => setContractModalOpen(true)}
                        className="text-gold underline underline-offset-2 hover:text-gold/80 font-medium"
                      >
                        Contrato de Serviços Advocatícios de Partido
                      </button>
                      . Declaro estar ciente de que a mensalidade de R$ 997,00 refere-se aos serviços de Monitoramento e Triagem de Risco, e que atuações contenciosas (recursos/ações) serão cobradas conforme{" "}
                      <button
                        type="button"
                        onClick={() => setPricingModalOpen(true)}
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
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal cursor-pointer">
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
              className="w-full gradient-gold text-primary font-semibold py-6 text-lg hover:opacity-90 transition-opacity"
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
      </DialogContent>

      <ContractModal open={contractModalOpen} onOpenChange={setContractModalOpen} />
      <PricingTableModal open={pricingModalOpen} onOpenChange={setPricingModalOpen} />
    </Dialog>
  );
};

export default LeadCaptureModal;
