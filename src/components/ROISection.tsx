import { 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  DollarSign,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Calculator,
  Target,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ROISectionProps {
  showTrialButton?: boolean;
}

const ROISection = ({ showTrialButton = true }: ROISectionProps) => {
  const scrollToJornal = () => {
    const element = document.getElementById("jornal");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
      
      <div className="container-custom relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium mb-4 backdrop-blur-sm">
            <TrendingUp className="h-4 w-4 inline mr-2" />
            Potencial de Ganho
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Gestão de Risco é{" "}
            <span className="text-amber-300">Dinheiro no Bolso</span>
          </h2>
          <p className="text-lg text-white/80 max-w-3xl mx-auto">
            Empresas que participam de licitações sem análise prévia perdem, em média, 
            <strong className="text-white"> 3x mais recursos</strong> com participações fracassadas 
            do que aquelas que investem em gestão de risco.
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Without Risk Management */}
          <div className="bg-red-950/30 backdrop-blur-sm rounded-2xl p-8 border border-red-500/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-red-300">Sem Gestão de Risco</h3>
            </div>
            
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-white">Participações às cegas</p>
                  <p className="text-sm text-white/60">Gasto de recursos em editais inviáveis ou com cláusulas abusivas</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-white">Vitórias tóxicas</p>
                  <p className="text-sm text-white/60">Contratos com margens negativas ou riscos ocultos</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-white">Custos de impugnações tardias</p>
                  <p className="text-sm text-white/60">Perda de prazos e valores gastos com advogados de emergência</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-white">Sanções e multas</p>
                  <p className="text-sm text-white/60">Descumprimento contratual por falta de análise prévia</p>
                </div>
              </li>
            </ul>
            
            <div className="mt-8 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
              <p className="text-sm text-red-300">
                <strong>Impacto típico:</strong> Empresas perdem até <span className="text-white font-bold">R$ 150 mil/ano</span> em 
                participações frustradas e contratos problemáticos
              </p>
            </div>
          </div>

          {/* With Risk Management */}
          <div className="bg-emerald-950/30 backdrop-blur-sm rounded-2xl p-8 border border-emerald-500/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Shield className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-emerald-300">Com Gestão de Risco</h3>
            </div>
            
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-white">Participações estratégicas</p>
                  <p className="text-sm text-white/60">Foco apenas em editais com alta probabilidade de sucesso</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-white">Contratos saudáveis</p>
                  <p className="text-sm text-white/60">Análise prévia garante margens positivas e riscos controlados</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-white">Impugnações preventivas</p>
                  <p className="text-sm text-white/60">Correção de editais antes da disputa, com custo controlado</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-white">Execução segura</p>
                  <p className="text-sm text-white/60">Contratos bem analisados são executados sem surpresas</p>
                </div>
              </li>
            </ul>
            
            <div className="mt-8 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <p className="text-sm text-emerald-300">
                <strong>Retorno típico:</strong> Faturamento aumenta em mais de <span className="text-white font-bold">R$ 200 mil</span> com 
                contratos mais rentáveis e menor desperdício
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        {showTrialButton && (
          <div className="text-center">
            <p className="text-white/80 mb-6 max-w-2xl mx-auto">
              Não deixe que a falta de gestão de risco consuma seus lucros. 
              Experimente nossa plataforma gratuitamente por 30 dias.
            </p>
            <a 
              href="/experimente"
              className="inline-flex items-center gap-2 px-8 py-4 bg-amber-400 text-primary rounded-xl font-bold hover:bg-amber-300 transition-colors shadow-lg hover:shadow-xl"
            >
              <TrendingUp className="h-5 w-5" />
              Teste Grátis por 30 Dias
            </a>
          </div>
        )}
      </div>
    </section>
  );
};

export default ROISection;
