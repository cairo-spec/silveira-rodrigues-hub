import { 
  FileText, 
  Shield, 
  MessageCircle, 
  BarChart3, 
  Clock, 
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const FeaturesShowcaseSection = () => {
  return (
    <section className="py-20 bg-background overflow-hidden">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Conheça a Plataforma
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Tudo que Você Precisa em{" "}
            <span className="text-primary">Um Só Lugar</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Interface moderna e intuitiva para gerenciar suas participações em licitações
          </p>
        </div>

        {/* Feature 1: Jornal de Editais */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
          <div className="order-2 lg:order-1">
            {/* Mockup - Jornal de Editais */}
            <div className="bg-secondary rounded-2xl p-6 border border-border/50 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-4 text-sm text-muted-foreground">Jornal de Editais Auditados</span>
              </div>
              
              <div className="space-y-3">
                {/* Mock Table Header */}
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-3 py-2 bg-background/50 rounded-lg">
                  <div className="col-span-5">Título</div>
                  <div className="col-span-3">Órgão</div>
                  <div className="col-span-2">Prazo</div>
                  <div className="col-span-2">Status</div>
                </div>
                
                {/* Mock Row 1 */}
                <div className="grid grid-cols-12 gap-2 items-center px-3 py-3 bg-background rounded-lg border border-border/30 hover:border-primary/30 transition-colors cursor-pointer">
                  <div className="col-span-5">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground truncate">PE 45/2024 - TI Corporativo</span>
                    </div>
                  </div>
                  <div className="col-span-3 flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate">Min. Saúde</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">5 dias</span>
                  </div>
                  <div className="col-span-2">
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                      Go
                    </Badge>
                  </div>
                </div>
                
                {/* Mock Row 2 */}
                <div className="grid grid-cols-12 gap-2 items-center px-3 py-3 bg-background rounded-lg border border-border/30">
                  <div className="col-span-5">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground truncate">CC 12/2024 - Infraestrutura</span>
                    </div>
                  </div>
                  <div className="col-span-3 flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate">Pref. BH</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-amber-600">2 dias</span>
                  </div>
                  <div className="col-span-2">
                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
                      Revisão
                    </Badge>
                  </div>
                </div>
                
                {/* Mock Row 3 */}
                <div className="grid grid-cols-12 gap-2 items-center px-3 py-3 bg-background rounded-lg border border-border/30">
                  <div className="col-span-5">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground truncate">PE 89/2024 - Consultoria</span>
                    </div>
                  </div>
                  <div className="col-span-3 flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate">UFMG</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">12 dias</span>
                  </div>
                  <div className="col-span-2">
                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs">
                      Participando
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="order-1 lg:order-2 space-y-6">
            <Badge variant="outline" className="border-primary/30 text-primary">
              <FileText className="h-3 w-3 mr-1" />
              Jornal de Editais
            </Badge>
            <h3 className="text-2xl lg:text-3xl font-bold text-foreground">
              Editais Auditados e Classificados por <span className="text-primary">Viabilidade</span>
            </h3>
            <p className="text-muted-foreground text-lg">
              Visualize todas as oportunidades filtradas para seu perfil, com análise prévia de risco 
              e classificação Go/No-Go para tomada de decisão rápida e segura.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">Filtros personalizados por estado e palavra-chave</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">Classificação automática de viabilidade</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">Acesso a relatórios detalhados de análise</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Feature 2: Suporte e Tickets */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
          <div className="space-y-6">
            <Badge variant="outline" className="border-primary/30 text-primary">
              <MessageCircle className="h-3 w-3 mr-1" />
              Suporte Especializado
            </Badge>
            <h3 className="text-2xl lg:text-3xl font-bold text-foreground">
              Chat em Tempo Real e <span className="text-primary">Tickets de Serviço</span>
            </h3>
            <p className="text-muted-foreground text-lg">
              Conecte-se diretamente com nossos especialistas para tirar dúvidas, 
              solicitar impugnações, recursos ou qualquer serviço jurídico relacionado às suas licitações.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">Chat ao vivo com tempo de resposta rápido</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">Sistema de tickets com acompanhamento completo</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">Histórico de todas as interações e documentos</span>
              </li>
            </ul>
          </div>
          
          <div>
            {/* Mockup - Ticket System */}
            <div className="bg-secondary rounded-2xl p-6 border border-border/50 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-4 text-sm text-muted-foreground">Sistema de Tickets</span>
              </div>
              
              <div className="space-y-3">
                {/* Mock Ticket Card 1 */}
                <div className="bg-background rounded-lg p-4 border border-border/30">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Impugnação de Edital</p>
                        <p className="text-xs text-muted-foreground">PE 45/2024 - Min. Saúde</p>
                      </div>
                    </div>
                    <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-xs">
                      Em andamento
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Prazo: 3 dias
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      5 mensagens
                    </span>
                  </div>
                </div>
                
                {/* Mock Ticket Card 2 */}
                <div className="bg-background rounded-lg p-4 border border-border/30">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Parecer Go/No-Go</p>
                        <p className="text-xs text-muted-foreground">CC 12/2024 - Pref. BH</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                      Concluído
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Entregue em 24h
                    </span>
                  </div>
                </div>
                
                {/* Mock Ticket Card 3 */}
                <div className="bg-background rounded-lg p-4 border border-border/30">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Recurso Administrativo</p>
                        <p className="text-xs text-muted-foreground">PE 89/2024 - UFMG</p>
                      </div>
                    </div>
                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs">
                      Aberto
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Aguardando início
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3: Acompanhamento */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            {/* Mockup - Dashboard Stats */}
            <div className="bg-secondary rounded-2xl p-6 border border-border/50 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-4 text-sm text-muted-foreground">Painel de Resultados</span>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-background rounded-lg p-4 border border-border/30">
                  <p className="text-xs text-muted-foreground mb-1">Oportunidades Analisadas</p>
                  <p className="text-2xl font-bold text-foreground">127</p>
                  <p className="text-xs text-emerald-600">+23 este mês</p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-border/30">
                  <p className="text-xs text-muted-foreground mb-1">Participações Ativas</p>
                  <p className="text-2xl font-bold text-foreground">8</p>
                  <p className="text-xs text-blue-600">3 em fase final</p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-border/30">
                  <p className="text-xs text-muted-foreground mb-1">Taxa de Vitória</p>
                  <p className="text-2xl font-bold text-emerald-600">67%</p>
                  <p className="text-xs text-muted-foreground">Acima da média</p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-border/30">
                  <p className="text-xs text-muted-foreground mb-1">Valor Contratado</p>
                  <p className="text-2xl font-bold text-primary">R$ 2.4M</p>
                  <p className="text-xs text-emerald-600">+180% vs. ano anterior</p>
                </div>
              </div>
              
              {/* Mini Progress */}
              <div className="bg-background rounded-lg p-4 border border-border/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">Classificação de Oportunidades</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden flex">
                    <div className="w-[60%] bg-emerald-500" />
                    <div className="w-[25%] bg-amber-500" />
                    <div className="w-[15%] bg-red-400" />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Go (60%)</span>
                  <span>Revisão (25%)</span>
                  <span>No-Go (15%)</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="order-1 lg:order-2 space-y-6">
            <Badge variant="outline" className="border-primary/30 text-primary">
              <BarChart3 className="h-3 w-3 mr-1" />
              Painel de Resultados
            </Badge>
            <h3 className="text-2xl lg:text-3xl font-bold text-foreground">
              Métricas e Acompanhamento <span className="text-primary">em Tempo Real</span>
            </h3>
            <p className="text-muted-foreground text-lg">
              Visualize suas estatísticas de participação, taxa de sucesso e valor contratado. 
              Tome decisões baseadas em dados para maximizar seus resultados.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">Dashboard com indicadores de desempenho</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">Histórico completo de participações</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">Relatórios exportáveis para análise</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesShowcaseSection;
