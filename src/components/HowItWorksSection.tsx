import { Newspaper, FileCheck, MessageSquare, TrendingUp } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Newspaper,
    title: "Receba Oportunidades Filtradas",
    description:
      "Nosso sistema busca editais em todo o Brasil e filtra apenas as oportunidades relevantes para o seu negócio, economizando horas de pesquisa manual.",
  },
  {
    number: "02",
    icon: FileCheck,
    title: "Análise de Viabilidade (Go/No-Go)",
    description:
      "Cada edital passa por uma análise técnica completa, identificando riscos contratuais, cláusulas abusivas e viabilidade econômica antes de você decidir participar.",
  },
  {
    number: "03",
    icon: MessageSquare,
    title: "Suporte Especializado",
    description:
      "Tire dúvidas em tempo real com nossa equipe de especialistas. Desde impugnações de edital até recursos administrativos, você conta com apoio jurídico completo.",
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Acompanhamento e Resultados",
    description:
      "Monitore suas participações, vitórias e oportunidades em andamento. Tenha controle total sobre sua estratégia de vendas ao governo.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-20 bg-secondary">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Como Funciona
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Do Edital à Vitória em{" "}
            <span className="text-primary">4 Passos</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Uma plataforma completa para transformar licitações em oportunidades
            reais de negócio, com gestão de risco e suporte especializado.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative group"
            >
              {/* Connector Line (hidden on last item and mobile) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
              )}
              
              <div className="bg-background rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                {/* Step Number */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl font-bold text-primary/20 group-hover:text-primary/40 transition-colors">
                    {step.number}
                  </span>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                    <step.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
