import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface PricingTableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

const PricingTableModal = ({ open, onOpenChange }: PricingTableModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Tabela de Honorários
          </DialogTitle>
          <p className="text-center text-sm text-muted-foreground mt-1">
            Preços especiais para assinantes do Jornal de Licitações
          </p>
        </DialogHeader>

        <ScrollArea className="h-[70vh]">
          <div className="space-y-6 pr-4">
            {pricingData.map((category, idx) => (
              <div key={idx} className="border rounded-lg overflow-hidden">
                <div className="bg-primary px-4 py-3">
                  <h3 className="font-semibold text-primary-foreground text-sm">
                    {category.category}
                  </h3>
                </div>
                <div className="divide-y">
                  {category.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground text-sm">
                            {item.service}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        </div>
                        {category.category.includes("ÊXITO") ? (
                          <div className="flex justify-center lg:w-[420px]">
                            <div className="text-center">
                              <p className="text-[10px] uppercase text-muted-foreground mb-1">Taxa de Êxito</p>
                              <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20 text-xs font-semibold">
                                {item.successFee}
                              </Badge>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2 lg:flex-nowrap lg:gap-4 lg:shrink-0">
                            <div className="text-center w-[120px]">
                              <p className="text-[10px] uppercase text-muted-foreground mb-1">Avulso</p>
                              <p className="text-xs font-medium text-muted-foreground line-through">
                                {item.priceRegular}
                              </p>
                            </div>
                            <div className="text-center w-[160px]">
                              <p className="text-[10px] uppercase text-muted-foreground mb-1">Assinante</p>
                              <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20 text-xs font-semibold">
                                {item.priceSubscriber}
                              </Badge>
                            </div>
                            <div className="text-center w-[140px]">
                              <p className="text-[10px] uppercase text-muted-foreground mb-1">Êxito</p>
                              <p className="text-xs font-medium text-foreground">
                                {item.successFee !== "N/A" ? item.successFee : "—"}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PricingTableModal;
