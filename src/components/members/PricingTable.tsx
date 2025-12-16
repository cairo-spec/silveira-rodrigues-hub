import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Info } from "lucide-react";

const pricingData = [
  {
    category: "1. INTELIGÊNCIA",
    items: [
      { service: "Assinatura Mensal", description: "Jornal de Oportunidades 2x por semana e Relatórios de Risco (RGR) ilimitados.", priceRegular: "—", priceSubscriber: "R$ 997,00 /mês", successFee: "N/A" },
      { service: "Consulta", description: "Solução de dúvidas e perguntas.", priceRegular: "R$ 516,47", priceSubscriber: "Incluso (até 4/mês)", successFee: "N/A" },
      { service: "Parecer \"Go/No Go\"", description: "Auditoria rápida para decidir se disputa ou não (Evita multa).", priceRegular: "R$ 516,47", priceSubscriber: "Incluso (até 2/mês)", successFee: "N/A" },
    ]
  },
  {
    category: "2. ADMINISTRATIVO",
    items: [
      { service: "Onboarding / Cadastramento no portal", description: "Cadastro da empresa no portal de compras onde ocorrerá o certame.", priceRegular: "R$ 997,00", priceSubscriber: "Incluso até 4/mês", successFee: "N/A" },
      { service: "Pedido de Esclarecimento", description: "Tirar dúvidas formais ou forçar interpretação favorável.", priceRegular: "R$ 997,00", priceSubscriber: "Incluso até 2/mês", successFee: "N/A" },
      { service: "Sessão de Lances", description: "Acompanhamento da fase de lances e interações com o pregoeiro.", priceRegular: "R$ 997,00", priceSubscriber: "R$ 498,00", successFee: "N/A" },
      { service: "Gestão de Documentos", description: "Garantir que o envelope de proposta está formalmente correto.", priceRegular: "R$ 997,00", priceSubscriber: "R$ 498,00", successFee: "N/A" },
      { service: "Atestado de Capacidade Técnica", description: "Auxílio da obtenção ou formalização de atestado.", priceRegular: "R$ 2.000,00", priceSubscriber: "R$ 997,00", successFee: "N/A" },
      { service: "Elaboração de Proposta", description: "Conformar a tabela de custos às formalidades técnicas do edital.", priceRegular: "de R$ 2.000,00 a R$ 8.000,00", priceSubscriber: "de R$ 997,00 a R$ 5.000,00", successFee: "N/A" },
    ]
  },
  {
    category: "3. EXECUÇÃO",
    items: [
      { service: "Acompanhamento de Execução Contratual", description: "Entregar documentos exigidos ou interagir com o fiscal do contrato (por intervenção).", priceRegular: "R$ 1.500,00", priceSubscriber: "R$ 498,00", successFee: "N/A" },
      { service: "Termo Aditivo", description: "Renegociar condições ou prazos.", priceRegular: "R$ 2.500,00", priceSubscriber: "R$ 1.000,00", successFee: "N/A" },
    ]
  },
  {
    category: "4. TÉCNICO",
    items: [
      { service: "Impugnação ao Edital", description: "Ataque Preventivo. Derrubar barreiras ilegais no edital.", priceRegular: "R$ 1.500,00", priceSubscriber: "R$ 1.200,00", successFee: "Taxa Base" },
      { service: "Recurso Administrativo", description: "A Briga. Reverter inabilitação ou derrubar concorrente.", priceRegular: "R$ 2.500,00", priceSubscriber: "R$ 1.800,00", successFee: "TB + incremento de 0,5%" },
      { service: "Contrarrazões", description: "Defesa. Garantir a vitória contra recursos de terceiros.", priceRegular: "R$ 2.000,00", priceSubscriber: "R$ 1.500,00", successFee: "Taxa Base" },
    ]
  },
  {
    category: "5. UPGRADE",
    items: [
      { service: "Inclui o sócio no fluxo do pipeline", description: "Upgrade de peça técnica para o nível estratégico da empresa.", priceRegular: "R$ 2.500,00", priceSubscriber: "R$ 1.000,00", successFee: "N/A" },
    ]
  },
  {
    category: "6. ESTRATÉGICO",
    items: [
      { service: "Defesa contra aplicação de penalidade", description: "Fundamentos para se proteger de multas e sanções.", priceRegular: "R$ 9.987,04", priceSubscriber: "R$ 5.000,00", successFee: "10% a 20% sobre a penalidade" },
      { service: "Representação (Controle Interno/Ouvidoria)", description: "Aciona os donos da caneta para mudar uma decisão.", priceRegular: "R$ 4.000,00", priceSubscriber: "R$ 3.000,00", successFee: "TB + incremento de 1%" },
      { service: "Pedido de Reequilíbrio Econômico-Financeiro", description: "Recuperação de margem de lucro.", priceRegular: "R$ 5.000,00", priceSubscriber: "R$ 3.500,00", successFee: "10% a 20% sobre o retroativo" },
      { service: "Plano de Integridade", description: "Documentos que são diferencial para sua empresa.", priceRegular: "A combinar", priceSubscriber: "A combinar", successFee: "N/A" },
      { service: "Formação de Consórcios", description: "União de empresas parceiras para vencer um objeto complexo.", priceRegular: "A combinar", priceSubscriber: "A combinar", successFee: "TB + incremento de 1%" },
    ]
  },
  {
    category: "7. CONTROLE / JUDICIAL",
    items: [
      { service: "Atuação em Matéria de Tribunal de Contas (Denúncia/Defesa)", description: "Nuclear. Denúncia/Defesa externa.", priceRegular: "R$ 15.812,79", priceSubscriber: "R$ 11.000,00", successFee: "TB + incremento de 1,5%" },
      { service: "Atuação em Matéria de Tribunal de Contas (Reequilíbrio)", description: "Nuclear. Reequilíbrio Econômico.", priceRegular: "R$ 15.812,79", priceSubscriber: "R$ 11.000,00", successFee: "12,5% a 25% sobre o retroativo" },
      { service: "Reequilíbrio Econômico Pelo Rito Comum", description: "Ação judicial para recuperar margem de lucro.", priceRegular: "R$ 16.645,05", priceSubscriber: "R$ 12.000,00", successFee: "15 a 30% sobre o retroativo" },
      { service: "Mandado de Segurança", description: "Ação judicial para garantir direito líquido e certo.", priceRegular: "R$ 6.658,02", priceSubscriber: "R$ 5.000,00", successFee: "3% a 5% do valor da causa" },
    ]
  },
  {
    category: "8. ÊXITO (Taxa Base)",
    items: [
      { service: "Contratos até R$ 1M", description: "Comissão base (sobre o valor do contrato) para vitória confirmadas.", priceRegular: "N/A", priceSubscriber: "N/A", successFee: "2,5%" },
      { service: "Contratos R$ 1M - R$ 5M", description: "Comissão base (sobre o valor do contrato) para vitória confirmadas.", priceRegular: "N/A", priceSubscriber: "N/A", successFee: "2%" },
      { service: "Contratos Acima de R$ 5M", description: "Comissão base (sobre o valor do contrato) para vitória confirmadas.", priceRegular: "N/A", priceSubscriber: "N/A", successFee: "1,5%" },
      { service: "Contratos Acima de R$ 20M", description: "Comissão base (sobre o valor do contrato) para vitória confirmadas.", priceRegular: "N/A", priceSubscriber: "N/A", successFee: "1%" },
      { service: "Contratos Acima de R$ 50M", description: "Comissão base (sobre o valor do contrato) para vitória confirmadas.", priceRegular: "N/A", priceSubscriber: "N/A", successFee: "0,5%" },
    ]
  },
];

interface PricingTableProps {
  isPaidSubscriber?: boolean;
}

const PricingTable = ({ isPaidSubscriber = false }: PricingTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-gold" />
          Tabela de Honorários
        </CardTitle>
        <CardDescription>
          {isPaidSubscriber 
            ? "Você tem acesso aos preços especiais de assinante" 
            : "Assine o Jornal de Licitações e tenha acesso a preços especiais"}
        </CardDescription>
        {!isPaidSubscriber && (
          <div className="flex items-center gap-2 text-xs text-primary bg-primary/5 p-2 rounded-md mt-2">
            <Info className="h-4 w-4 shrink-0" />
            <span>Usuários padrão pagam o valor avulso. Assine para economizar!</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-6 pr-4">
            {pricingData.map((category, idx) => (
              <div key={idx} className="border rounded-lg overflow-hidden">
                <div className="bg-primary px-4 py-3">
                  <h3 className="font-semibold text-primary-foreground text-sm">
                    {category.category}
                  </h3>
                </div>
                
                {/* Desktop: Table layout */}
                <div className="hidden md:block divide-y">
                  {category.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground text-sm">
                            {item.service}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        </div>
                        {category.category.includes("ÊXITO") ? (
                          <div className="flex justify-center lg:w-[420px]">
                            <div className="text-center">
                              <p className="text-[10px] uppercase text-muted-foreground font-medium mb-1">Taxa de Êxito</p>
                              <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20 text-xs font-semibold">
                                {item.successFee}
                              </Badge>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2 lg:flex lg:flex-nowrap lg:gap-4 lg:shrink-0 w-full lg:w-auto">
                            <div className="text-center lg:w-[120px]">
                              <p className="text-[10px] uppercase text-muted-foreground font-medium mb-1">Avulso</p>
                              <p className={`text-[10px] sm:text-xs font-semibold ${isPaidSubscriber ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                {item.priceRegular}
                              </p>
                            </div>
                            <div className="text-center lg:w-[160px]">
                              <p className="text-[10px] uppercase text-muted-foreground font-medium mb-1">Assinante</p>
                              <Badge 
                                variant="secondary" 
                                className={`text-[10px] sm:text-xs font-semibold ${isPaidSubscriber ? 'bg-gold/10 text-gold border-gold/20' : 'bg-muted text-muted-foreground'}`}
                              >
                                {item.priceSubscriber}
                              </Badge>
                            </div>
                            <div className="text-center lg:w-[140px]">
                              <p className="text-[10px] uppercase text-muted-foreground font-medium mb-1">Êxito</p>
                              <p className="text-[10px] sm:text-xs font-semibold text-foreground">
                                {item.successFee !== "N/A" ? item.successFee : "—"}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mobile: Card layout */}
                <div className="md:hidden divide-y">
                  {category.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="p-4 space-y-3">
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">
                          {item.service}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.description}
                        </p>
                      </div>
                      
                      {category.category.includes("ÊXITO") ? (
                        <div className="bg-gold/5 rounded-lg p-3 text-center">
                          <p className="text-[10px] uppercase text-muted-foreground font-medium mb-1">Taxa de Êxito</p>
                          <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20 text-sm font-semibold">
                            {item.successFee}
                          </Badge>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-muted/50 rounded-lg p-2 text-center">
                            <p className="text-[10px] uppercase text-muted-foreground font-medium mb-1">Avulso</p>
                            <p className={`text-xs font-semibold ${isPaidSubscriber ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                              {item.priceRegular}
                            </p>
                          </div>
                          <div className={`rounded-lg p-2 text-center ${isPaidSubscriber ? 'bg-gold/10' : 'bg-muted/50'}`}>
                            <p className="text-[10px] uppercase text-muted-foreground font-medium mb-1">Assinante</p>
                            <p className={`text-xs font-semibold ${isPaidSubscriber ? 'text-gold' : 'text-foreground'}`}>
                              {item.priceSubscriber}
                            </p>
                          </div>
                          {item.successFee !== "N/A" && (
                            <div className="col-span-2 bg-primary/5 rounded-lg p-2 text-center">
                              <p className="text-[10px] uppercase text-muted-foreground font-medium mb-1">Honorários de Êxito</p>
                              <p className="text-xs font-semibold text-primary">
                                {item.successFee}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PricingTable;
