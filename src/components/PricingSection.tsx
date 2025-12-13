import { Check, Newspaper, Bell, FileText, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const benefits = [
  {
    icon: Bell,
    text: "Oportunidades curadas entregues via Zendesk",
  },
  {
    icon: FileText,
    text: "Relatório de Risco Parametrizado (Metodologia COSO ERM)",
  },
  {
    icon: Percent,
    text: "Descontos progressivos na Consultoria Técnica",
  },
];

const PricingSection = () => {
  return (
    <section id="jornal" className="section-padding bg-background scroll-mt-20">
      <div className="container-custom">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold-light font-medium text-sm mb-4">
            Produto de Entrada
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Comece com Inteligência
          </h2>
          <p className="text-muted-foreground text-lg">
            Receba as melhores oportunidades de licitação filtradas para seu negócio.
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          <Card className="relative overflow-hidden border-2 border-primary shadow-xl">
            {/* Highlight bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 gradient-gold" />
            
            <CardHeader className="text-center pt-10 pb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Newspaper className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                Jornal de Licitações
              </h3>
              <p className="text-muted-foreground mt-2">
                Oportunidades selecionadas para o seu segmento
              </p>
            </CardHeader>

            <CardContent className="pb-10">
              <ul className="space-y-4 mb-8">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center mt-0.5">
                      <Check className="w-4 h-4 text-gold" />
                    </div>
                    <span className="text-foreground">{benefit.text}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                size="lg"
                className="w-full gradient-gold text-primary font-semibold py-6 text-lg hover:opacity-90 transition-opacity"
              >
                <a href="#" target="_blank" rel="noopener noreferrer">
                  Assinar Agora
                </a>
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-4">
                Você será redirecionado para a plataforma de pagamento segura
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
