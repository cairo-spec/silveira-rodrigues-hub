import { Linkedin, Shield, Award, BookOpen, Scale, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import cairoPhoto from "@/assets/cairo-rodrigues.jpg";
import leoniPhoto from "@/assets/leoni-silveira.jpg";

const AuthoritySection = () => {
  return (
    <section id="quem-somos" className="section-padding bg-background scroll-mt-20">
      <div className="container-custom space-y-20 lg:space-y-28">

        {/* — Cairo Rodrigues — imagem à esquerda */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image Side */}
          <div className="flex justify-center lg:justify-start">
            <div className="relative">
              <div className="absolute inset-0 rounded-full border-2 border-primary/10 transform scale-110" />
              <div className="absolute inset-0 rounded-full border-2 border-gold/10 transform scale-125" />
              <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 border-4 border-background shadow-2xl">
                <img
                  src={cairoPhoto}
                  alt="Cairo Rodrigues - Analista de Controle Interno"
                  className="w-full h-full object-cover object-[center_15%]" />

              </div>
              <div className="absolute -bottom-4 -right-4 bg-background rounded-xl shadow-lg p-3 border border-border">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                    <Award className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Experiência</p>
                    <p className="text-sm font-semibold text-foreground">Controle Interno</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Side */}
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
              Quem Somos
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Cairo Rodrigues</h2>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold/10 border border-gold/20 mb-6">
              <Shield className="w-4 h-4 text-gold" />
              <span className="text-sm font-semibold text-foreground">
                Analista de Controle Interno de Carreira
              </span>
            </div>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Aplicamos a <strong className="text-foreground">Jurisprudência Defensiva</strong>.
              Nossa abordagem única combina a visão de auditor para blindar sua empresa contra riscos
              que muitos nem sequer percebem existir.
            </p>
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Expertise em Lei 14.133/2021</h4>
                  <p className="text-sm text-muted-foreground">
                    Conhecimento profundo da Nova Lei de Licitações e suas implicações práticas.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Visão de Auditor</h4>
                  <p className="text-sm text-muted-foreground">
                    Antecipamos os pontos que fiscalizadores irão questionar em seus contratos.
                  </p>
                </div>
              </div>
            </div>
            <Button
              asChild
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">

              <a
                href="https://www.linkedin.com/in/cairo-rodrigues-026188147/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2">

                <Linkedin className="w-4 h-4" />
                Conectar no LinkedIn
              </a>
            </Button>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-border" />

        {/* — Segundo Sócio — imagem à direita (espelhado) */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content Side (left on desktop) */}
          <div className="order-2 lg:order-1">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
              Quem Somos
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Leoni Silveira
            </h2>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold/10 border border-gold/20 mb-6">
              <Scale className="w-4 h-4 text-gold" />
              <span className="text-sm font-semibold text-foreground">Sucesso do Cliente / Operações

              </span>
            </div>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">Gerimos com Zelo Profissional a sua carteira de oportunidades, garantindo que os documentos estejam sempre em dia e as capacidades sejam devidamente comprovadas


            </p>
            <Button asChild
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">

              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2">

                <Linkedin className="w-4 h-4" />
                Conectar no LinkedIn
              </a>
            </Button>
          </div>

          {/* Image Side (right on desktop) */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute inset-0 rounded-full border-2 border-primary/10 transform scale-110" />
              <div className="absolute inset-0 rounded-full border-2 border-gold/10 transform scale-125" />
              <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 border-4 border-background shadow-2xl">
                <img
                  src={leoniPhoto}
                  alt="Leoni Silveira - Sucesso do Cliente / Operações"
                  className="w-full h-full object-cover object-[center_15%] scale-x-[-1]" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-background rounded-xl shadow-lg p-3 border border-border">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                    <Award className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Advogado</p>
                    <p className="text-sm font-semibold text-foreground">Executivo de Operações</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>);

};

export default AuthoritySection;