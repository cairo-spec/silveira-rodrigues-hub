import { useState } from "react";
import { Check, Newspaper, Bell, FileText, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import LeadCaptureModal from "./LeadCaptureModal";
const benefits = [{
  icon: Bell,
  text: "Licitações curadas via Painel de Gestão",
  highlight: false
}, {
  icon: FileText,
  text: "Relatório de Risco (Metodologia COSO ERM)",
  highlight: false
}, {
  icon: FileText,
  text: "Tabela de Honorários de Assinantes",
  highlight: false
}, {
  icon: Percent,
  text: "100% reembolsável no serviço de BPO",
  highlight: true
}];

const whatsappNumber = "5531993475792";
const whatsappMessage = encodeURIComponent("Olá! Vi as soluções corporativas no site e gostaria de agendar um diagnóstico gratuito para minha empresa.");
const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

const PricingSection = () => {
  return <section id="jornal" className="section-padding bg-background scroll-mt-20">
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
              <h3 className="text-2xl font-bold text-foreground">Jornal de Editais Auditados</h3>
              <p className="text-muted-foreground mt-2">Oportunidades selecionadas para o seu segmento</p>
            </CardHeader>

            <CardContent className="pb-10">
              <ul className="space-y-4 mb-8">
                {benefits.map((benefit, index) => (
                  <li 
                    key={index} 
                    className={`flex items-start gap-3 ${
                      benefit.highlight 
                        ? "bg-gold/10 -mx-4 px-4 py-3 rounded-lg border border-gold/20" 
                        : ""
                    }`}
                  >
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                      benefit.highlight ? "bg-gold" : "bg-gold/10"
                    }`}>
                      <Check className={`w-4 h-4 ${benefit.highlight ? "text-primary" : "text-gold"}`} />
                    </div>
                    <span className={`${benefit.highlight ? "text-foreground font-semibold" : "text-foreground"}`}>
                      {benefit.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Button asChild size="lg" className="w-full gradient-gold text-primary font-semibold py-6 text-lg hover:opacity-90 transition-opacity">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  Entre em Contato
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      
    </section>;
};
export default PricingSection;