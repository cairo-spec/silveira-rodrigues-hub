import { ArrowDown, Shield, TrendingUp, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBackgroundTeam from "@/assets/hero-background-team.png";

const HeroSection = () => {
  const scrollToJornal = () => {
    const element = document.querySelector("#jornal");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center bg-primary overflow-hidden">
      {/* Team background image with transparency */}
      <div 
        className="absolute inset-0 bg-no-repeat bg-bottom bg-contain md:bg-right-bottom opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url(${heroBackgroundTeam})`,
        }}
      />

      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-32 h-32 md:w-64 md:h-64 rounded-full bg-gold/5 blur-3xl" />
      <div className="absolute bottom-20 left-10 w-40 h-40 md:w-80 md:h-80 rounded-full bg-gold/5 blur-3xl" />

      <div className="container-custom relative z-10 pt-24 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary-foreground/20 mb-8 animate-fade-up">
            <Shield className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium text-primary-foreground/80">
              Especialistas em Lei 14.133/2021
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6 animate-fade-up animation-delay-100">
            Venda para o Governo com a{" "}
            <span className="relative inline-block">
              Segurança
              <span className="absolute -bottom-1 left-0 w-full h-1 bg-gold/60 rounded-full" />
            </span>
            {" "}de um Especialista
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10 animate-fade-up animation-delay-200">
            Inteligência de mercado e blindagem jurídica para licitações. 
            Assine o Jornal de Oportunidades e comece agora.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up animation-delay-300">
            <Button
              size="lg"
              onClick={scrollToJornal}
              className="gradient-gold text-primary font-semibold px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Assinar Jornal de Oportunidades
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 mt-16 animate-fade-up animation-delay-400">
            <div className="flex items-center gap-2 text-primary-foreground/70">
              <CheckCircle className="w-5 h-5 text-gold" />
              <span className="text-sm">Conformidade NLL</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/70">
              <TrendingUp className="w-5 h-5 text-gold" />
              <span className="text-sm">ROI Comprovado</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/70">
              <Shield className="w-5 h-5 text-gold" />
              <span className="text-sm">Blindagem Jurídica</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <ArrowDown className="w-6 h-6 text-primary-foreground/50" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
