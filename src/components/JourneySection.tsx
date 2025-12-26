import { 
  UserPlus, 
  Settings2, 
  Newspaper, 
  FileSearch, 
  Gavel, 
  Trophy,
  ArrowRight
} from "lucide-react";

const journeySteps = [
  {
    icon: UserPlus,
    title: "Cadastro",
    description: "Crie sua conta em menos de 2 minutos",
    color: "bg-blue-500",
  },
  {
    icon: Settings2,
    title: "Configuração",
    description: "Defina seus critérios de busca (estados, palavras-chave, valor mínimo)",
    color: "bg-indigo-500",
  },
  {
    icon: Newspaper,
    title: "Jornal Personalizado",
    description: "Receba apenas editais que correspondem ao seu perfil",
    color: "bg-violet-500",
  },
  {
    icon: FileSearch,
    title: "Análise de Risco",
    description: "Solicite pareceres Go/No-Go antes de decidir participar",
    color: "bg-purple-500",
  },
  {
    icon: Gavel,
    title: "Suporte na Disputa",
    description: "Conte com impugnações, recursos e acompanhamento jurídico",
    color: "bg-pink-500",
  },
  {
    icon: Trophy,
    title: "Vitória!",
    description: "Celebre o contrato com a segurança de uma participação bem fundamentada",
    color: "bg-amber-500",
  },
];

interface JourneySectionProps {
  ctaLink?: string;
}

const JourneySection = ({ ctaLink = "/experimente" }: JourneySectionProps) => {
  return (
    <section className="py-20 bg-secondary">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Sua Jornada
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Do Primeiro Acesso ao{" "}
            <span className="text-primary">Contrato Assinado</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Acompanhe como nossos clientes transformam oportunidades em contratos
          </p>
        </div>

        {/* Journey Timeline - Desktop */}
        <div className="hidden lg:block relative">
          {/* Connection Line */}
          <div className="absolute top-16 left-[8%] right-[8%] h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-amber-500 rounded-full" />
          
          <div className="grid grid-cols-6 gap-4">
            {journeySteps.map((step, index) => (
              <div key={step.title} className="relative flex flex-col items-center text-center">
                {/* Icon Circle */}
                <div 
                  className={`w-16 h-16 rounded-full ${step.color} flex items-center justify-center mb-6 relative z-10 shadow-lg`}
                >
                  <step.icon className="h-8 w-8 text-white" />
                </div>
                
                {/* Content */}
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Journey Timeline - Mobile */}
        <div className="lg:hidden space-y-6">
          {journeySteps.map((step, index) => (
            <div key={step.title} className="relative">
              {/* Connector */}
              {index < journeySteps.length - 1 && (
                <div className="absolute left-7 top-16 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 to-primary/20" />
              )}
              
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div 
                  className={`w-14 h-14 rounded-full ${step.color} flex items-center justify-center flex-shrink-0 shadow-lg`}
                >
                  <step.icon className="h-7 w-7 text-white" />
                </div>
                
                {/* Content */}
                <div className="bg-background rounded-xl p-4 border border-border/50 flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <a 
            href={ctaLink}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Começar Minha Jornada
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default JourneySection;
