import { AlertTriangle, ShieldAlert, TrendingDown, FileWarning, Scale, Users, ClipboardCheck } from "lucide-react";

const EducationalSection = () => {
  const riskItems = [
    { icon: FileWarning, label: "Matriz de Riscos", delay: "0" },
    { icon: ClipboardCheck, label: "Estudo Técnico Preliminar", delay: "100" },
    { icon: Scale, label: "Governança Rigorosa", delay: "200" },
    { icon: Users, label: "Segregação de Funções", delay: "300" },
  ];

  return (
    <section className="section-padding bg-secondary">
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
              Vencer uma licitação sem analisar os <span className="text-primary font-bold">Riscos de Aplicação</span> da Lei 14.133/2021 pode transformar seu contrato em prejuízo. Custos subestimados, prazos irrealistas e cláusulas onerosas são armadilhas invisíveis para quem não tem assessoria especializada.
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

          {/* Visual Element - Redesigned */}
          <div className="order-1 lg:order-2 flex justify-center">
            <div className="relative w-full max-w-md">
              {/* Animated background glow */}
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-transparent to-destructive/20 rounded-[2rem] blur-2xl opacity-60" />
              
              {/* Main container */}
              <div className="relative">
                {/* Header card */}
                <div className="bg-primary rounded-t-2xl p-6 relative overflow-hidden">
                  {/* Decorative pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-32 h-32 border-8 border-white rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 border-4 border-white rounded-full translate-y-1/2 -translate-x-1/2" />
                  </div>
                  
                  <div className="relative flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                      <AlertTriangle className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="text-white/70 text-xs font-medium tracking-wider uppercase">Nova Lei de Licitações</p>
                      <h3 className="text-2xl font-bold text-white">Lei 14.133/2021</h3>
                    </div>
                  </div>
                </div>

                {/* Content card */}
                <div className="bg-background rounded-b-2xl shadow-2xl border border-border border-t-0">
                  {/* Risk items grid */}
                  <div className="p-6 grid grid-cols-2 gap-3">
                    {riskItems.map((item, index) => (
                      <div 
                        key={index}
                        className="group relative p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                      >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-[3rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                            <item.icon className="w-5 h-5 text-primary" />
                          </div>
                          <p className="text-sm font-medium text-foreground leading-tight">
                            {item.label}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="px-6 pb-6">
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-destructive/5 via-destructive/10 to-destructive/5 p-4 border border-destructive/10">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDAsMCwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
                      <div className="relative flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                          <span className="text-destructive text-lg">⚠</span>
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          Complexidade que exige <span className="text-destructive font-bold">expertise especializada</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EducationalSection;