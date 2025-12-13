import { AlertTriangle, ShieldAlert, TrendingDown } from "lucide-react";
const EducationalSection = () => {
  return <section className="section-padding bg-secondary">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text Content */}
          <div className="order-2 lg:order-1">
            <span className="inline-block px-4 py-1.5 rounded-full bg-destructive/10 text-destructive font-medium text-sm mb-4">
              Atenção Estratégica
            </span>
            
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              O Risco da{" "}
              <span className="text-destructive">Vitória Tóxica</span>
            </h2>
            
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Vencer uma licitação sem analisar a <strong className="text-foreground">Os Riscos de Aplicação</strong> da Lei 14.133/2021 
              pode transformar seu contrato em prejuízo. Custos subestimados, prazos irrealistas e cláusulas 
              onerosas são armadilhas invisíveis para quem não tem assessoria especializada.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-background border border-border">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Desequilíbrio Contratual</h4>
                  <p className="text-sm text-muted-foreground">
                    Aceitar riscos que você não pode suportar gera perdas financeiras significativas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg bg-background border border-border">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Sanções e Multas</h4>
                  <p className="text-sm text-muted-foreground">
                    A inobservância da NLL pode resultar em penalidades e exclusão de futuras licitações.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-5 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-foreground font-medium">
                💡 A consultoria atua como seu <span className="text-primary font-bold">Seguro de Lucratividade</span>, 
                garantindo que você só participe de certames lucrativos e executáveis.
              </p>
            </div>
          </div>

          {/* Visual Element */}
          <div className="order-1 lg:order-2 flex justify-center">
            <div className="relative w-full max-w-md">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-primary/5 rounded-3xl transform rotate-3" />
              
              {/* Main card */}
              <div className="relative bg-background rounded-2xl shadow-xl p-8 border border-border">
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-2xl bg-destructive/10">
                  <AlertTriangle className="w-10 h-10 text-destructive" />
                </div>
                
                <h3 className="text-xl font-bold text-center text-foreground mb-4">
                  Lei 14.133/2021
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-2 h-2 rounded-full bg-destructive" />
                    <span className="text-muted-foreground">Matriz de Riscos </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-2 h-2 rounded-full bg-destructive" />
                    <span className="text-muted-foreground">Estudo Técnico Preliminar</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-2 h-2 rounded-full bg-destructive" />
                    <span className="text-muted-foreground">Governança Rigorosa</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-2 h-2 rounded-full bg-destructive" />
                    <span className="text-muted-foreground">Segregação de Funções</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border text-center">
                  <p className="text-xs text-muted-foreground">
                    Complexidade que exige expertise especializada
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default EducationalSection;