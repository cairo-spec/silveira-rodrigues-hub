import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, FileText, Shield, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import LeadCaptureModal from "@/components/LeadCaptureModal";
import { useState } from "react";
const ASAAS_CHECKOUT_URL = "https://www.asaas.com/c/g8pj49zuijh6swzc";
const JornalSalesPage = () => {
  const [showLeadModal, setShowLeadModal] = useState(false);
  const benefits = [{
    icon: FileText,
    title: "Oportunidades Auditadas",
    description: "Receba oportunidades de licitação já analisadas pela nossa equipe de especialistas"
  }, {
    icon: Shield,
    title: "Parecer Go/No Go",
    description: "Saiba quais licitações participar com nossa análise de risco e viabilidade"
  }, {
    icon: Clock,
    title: "Economia de Tempo",
    description: "Não perca tempo analisando editais. Nossa equipe faz isso por você"
  }, {
    icon: TrendingUp,
    title: "Aumente suas Chances",
    description: "Participe apenas de licitações com boas chances de sucesso"
  }];
  const features = ["Acesso a oportunidades de licitação auditadas", "Relatórios técnicos detalhados", "Parecer Go/No Go para cada oportunidade", "Petições e documentos prontos para uso", "Suporte especializado via chat", "Acesso à base de conhecimento premium", "Sistema de tickets para dúvidas", "Notificações em tempo real"];
  return <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-8 px-4 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-gold/5 border border-primary/10">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20 animate-pulse">
            🔥 Jornal Auditado
          </Badge>
          <Badge variant="destructive" className="bg-red-500/90 text-white border-red-600 animate-pulse">
            ⏰ Vagas Limitadas
          </Badge>
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
          <span className="block text-foreground">Pare de Perder Dinheiro</span>
          <span className="block mt-2 bg-gradient-to-r from-primary via-emerald-600 to-primary bg-clip-text text-transparent animate-pulse">
            em Licitações Erradas
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          <span className="font-semibold text-foreground">Empresas perdem milhões</span> por licitação mal escolhida. 
          Nossas oportunidades auditadas mitigam esse risco.
        </p>
        
        <div className="flex items-center justify-center gap-2 text-sm text-primary font-medium">
          <Clock className="h-4 w-4" />
          <span>
            Ainda não é assinante?{" "}
            <a href="/experimente" className="underline hover:text-primary/80 transition-colors">
              Teste grátis por 30 dias
            </a>
          </span>
        </div>
      </div>

      {/* Warning Card */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="flex items-start gap-4 pt-6">
          <AlertTriangle className="h-8 w-8 text-amber-500 shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-700 dark:text-amber-400">
              Você sabia que participar da licitação errada pode custar caro?
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              A "vitória tóxica" acontece quando você ganha uma licitação que não deveria ter participado. 
              Contratos problemáticos, preços apertados e riscos ocultos podem transformar uma aparente 
              vitória em um grande prejuízo.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benefits.map((benefit, index) => <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <benefit.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            </CardContent>
          </Card>)}
      </div>

      {/* CTA Card */}
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Assine o Jornal Auditado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => <div key={index} className="flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-400 shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>)}
          </div>

          <div className="text-center space-y-4 pt-4 border-t border-primary-foreground/20">
            <div>
              <p className="text-sm opacity-80">A partir de</p>
              <p className="text-4xl font-bold">R$ 997<span className="text-lg font-normal">/mês</span></p>
            </div>
            <Button size="lg" variant="secondary" className="w-full md:w-auto px-8" onClick={() => setShowLeadModal(true)}>
              Quero Assinar Agora
            </Button>
            <p className="text-xs opacity-70">
              Sem fidelidade. Cancele quando quiser.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Lead Capture Modal */}
      <LeadCaptureModal open={showLeadModal} onOpenChange={setShowLeadModal} checkoutUrl={ASAAS_CHECKOUT_URL} />
    </div>;
};
export default JornalSalesPage;