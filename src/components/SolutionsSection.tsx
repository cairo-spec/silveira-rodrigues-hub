import { Briefcase, Building2, ShieldCheck, Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const solutions = [
  {
    icon: Briefcase,
    title: "Consultoria de Licitações (BPO)",
    description: "Expertise técnica e peças jurídicas sob demanda. Senioridade quando você precisa, sem custos fixos.",
    features: [
      "Análise de editais",
      "Elaboração de propostas",
      "Impugnações e recursos",
      "Gestão documental",
    ],
  },
  {
    icon: Building2,
    title: "Estruturação de Departamento",
    description: "Autonomia para grandes empresas. Organizamos sua gestão de licitações para escala.",
    features: [
      "Fluxos e processos",
      "Capacitação da equipe",
      "Sistemas e ferramentas",
      "Indicadores de performance",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Plano de Integridade",
    description: "Compliance robusto para competitividade e segurança nas contratações públicas.",
    features: [
      "Código de Ética",
      "Matriz de Riscos de Integridade",
      "Canal de Denúncias",
      "Due Diligence",
      "Políticas de Brindes",
    ],
    highlighted: true,
  },
];

const whatsappNumber = "5531993475792";

const SolutionsSection = () => {
  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("Olá! Vi as soluções corporativas no site e gostaria de agendar um diagnóstico gratuito para minha empresa.");
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
  };

  return (
    <section id="solucoes" className="section-padding bg-background scroll-mt-20">
      <div className="container-custom">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
            Soluções Corporativas
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Consultoria de Alto Impacto
          </h2>
          <p className="text-muted-foreground text-lg">
            Serviços especializados para empresas que buscam excelência em vendas para o governo.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {solutions.map((solution, index) => (
            <Card
              key={index}
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                solution.highlighted
                  ? "border-2 border-primary shadow-lg"
                  : "border border-border"
              }`}
            >
              {solution.highlighted && (
                <div className="absolute top-0 left-0 right-0 h-1 gradient-gold" />
              )}

              <CardHeader className="pt-8 pb-4">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
                    solution.highlighted
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  <solution.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  {solution.title}
                </h3>
                <p className="text-muted-foreground text-sm mt-2">
                  {solution.description}
                </p>
              </CardHeader>

              <CardContent className="pb-8">
                <ul className="space-y-3 mb-6">
                  {solution.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <div
                        className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                          solution.highlighted
                            ? "bg-gold/20"
                            : "bg-primary/10"
                        }`}
                      >
                        <Check
                          className={`w-3 h-3 ${
                            solution.highlighted ? "text-gold" : "text-primary"
                          }`}
                        />
                      </div>
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={handleWhatsAppClick}
                  variant={solution.highlighted ? "default" : "outline"}
                  className={`w-full ${
                    solution.highlighted
                      ? "bg-primary text-primary-foreground hover:bg-deep-green-light"
                      : "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  }`}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Agendar Diagnóstico
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolutionsSection;
