// Pricing categories for ticket creation (excluding subscription)
export interface ServiceCategory {
  id: string;
  category: string;
  service: string;
  description: string;
  priceRegular: string;
  priceSubscriber: string;
  successFee: string;
}

export const serviceCategories: ServiceCategory[] = [
  // INTELIGÊNCIA
  { id: "consulta", category: "Inteligência", service: "Consulta", description: "Solução de dúvidas e perguntas.", priceRegular: "R$ 516,47", priceSubscriber: "Incluso (até 4/mês)", successFee: "N/A" },
  { id: "parecer-go-no-go", category: "Inteligência", service: "Parecer \"Go/No Go\"", description: "Auditoria rápida para decidir se disputa ou não (Evita multa).", priceRegular: "R$ 516,47", priceSubscriber: "Incluso (até 2/mês)", successFee: "N/A" },
  
  // ADMINISTRATIVO
  { id: "onboarding-cadastramento", category: "Administrativo", service: "Onboarding / Cadastramento no portal", description: "Cadastro da empresa no portal de compras onde ocorrerá o certame.", priceRegular: "R$ 997,00", priceSubscriber: "Incluso até 4/mês", successFee: "N/A" },
  { id: "pedido-esclarecimento", category: "Administrativo", service: "Pedido de Esclarecimento", description: "Tirar dúvidas formais ou forçar interpretação favorável.", priceRegular: "R$ 997,00", priceSubscriber: "Incluso até 2/mês", successFee: "N/A" },
  { id: "sessao-lances", category: "Administrativo", service: "Sessão de Lances", description: "Acompanhamento da fase de lances e interações com o pregoeiro.", priceRegular: "R$ 997,00", priceSubscriber: "R$ 498,00", successFee: "N/A" },
  { id: "gestao-documentos", category: "Administrativo", service: "Gestão de Documentos", description: "Garantir que o envelope de proposta está formalmente correto.", priceRegular: "R$ 997,00", priceSubscriber: "R$ 498,00", successFee: "N/A" },
  { id: "atestado-capacidade", category: "Administrativo", service: "Atestado de Capacidade Técnica", description: "Auxílio da obtenção ou formalização de atestado.", priceRegular: "R$ 2.000,00", priceSubscriber: "R$ 997,00", successFee: "N/A" },
  { id: "elaboracao-proposta", category: "Administrativo", service: "Elaboração de Proposta", description: "Conformar a tabela de custos às formalidades técnicas do edital.", priceRegular: "de R$ 2.000,00 a R$ 8.000,00", priceSubscriber: "de R$ 997,00 a R$ 5.000,00", successFee: "N/A" },
  
  // EXECUÇÃO
  { id: "acompanhamento-execucao", category: "Execução", service: "Acompanhamento de Execução Contratual", description: "Entregar documentos exigidos ou interagir com o fiscal do contrato (por intervenção).", priceRegular: "R$ 1.500,00", priceSubscriber: "R$ 498,00", successFee: "N/A" },
  { id: "termo-aditivo", category: "Execução", service: "Termo Aditivo", description: "Renegociar condições ou prazos.", priceRegular: "R$ 2.500,00", priceSubscriber: "R$ 1.000,00", successFee: "N/A" },
  
  // TÉCNICO
  { id: "impugnacao-edital", category: "Técnico", service: "Impugnação ao Edital", description: "Ataque Preventivo. Derrubar barreiras ilegais no edital.", priceRegular: "R$ 1.500,00", priceSubscriber: "R$ 1.200,00", successFee: "Taxa Base" },
  { id: "recurso-administrativo", category: "Técnico", service: "Recurso Administrativo", description: "A Briga. Reverter inabilitação ou derrubar concorrente.", priceRegular: "R$ 2.500,00", priceSubscriber: "R$ 1.800,00", successFee: "TB + incremento de 0,5%" },
  { id: "contrarrazoes", category: "Técnico", service: "Contrarrazões", description: "Defesa. Garantir a vitória contra recursos de terceiros.", priceRegular: "R$ 2.000,00", priceSubscriber: "R$ 1.500,00", successFee: "Taxa Base" },
  
  // UPGRADE
  { id: "inclui-socio", category: "Upgrade", service: "Inclui o sócio no fluxo do pipeline", description: "Upgrade de peça técnica para o nível estratégico da empresa.", priceRegular: "R$ 2.500,00", priceSubscriber: "R$ 1.000,00", successFee: "N/A" },
  
  // ESTRATÉGICO
  { id: "defesa-penalidade", category: "Estratégico", service: "Defesa contra aplicação de penalidade", description: "Fundamentos para se proteger de multas e sanções.", priceRegular: "R$ 9.987,04", priceSubscriber: "R$ 5.000,00", successFee: "10% a 20% sobre a penalidade" },
  { id: "representacao", category: "Estratégico", service: "Representação (Controle Interno/Ouvidoria)", description: "Aciona os donos da caneta para mudar uma decisão.", priceRegular: "R$ 4.000,00", priceSubscriber: "R$ 3.000,00", successFee: "TB + incremento de 1%" },
  { id: "reequilibrio", category: "Estratégico", service: "Pedido de Reequilíbrio Econômico-Financeiro", description: "Recuperação de margem de lucro.", priceRegular: "R$ 5.000,00", priceSubscriber: "R$ 3.500,00", successFee: "10% a 20% sobre o retroativo" },
  { id: "plano-integridade", category: "Estratégico", service: "Plano de Integridade", description: "Documentos que são diferencial para sua empresa.", priceRegular: "A combinar", priceSubscriber: "A combinar", successFee: "N/A" },
  { id: "formacao-consorcios", category: "Estratégico", service: "Formação de Consórcios", description: "União de empresas parceiras para vencer um objeto complexo.", priceRegular: "A combinar", priceSubscriber: "A combinar", successFee: "TB + incremento de 1%" },
  
  // CONTROLE / JUDICIAL
  { id: "tc-denuncia-defesa", category: "Controle / Judicial", service: "Atuação em Matéria de Tribunal de Contas (Denúncia/Defesa)", description: "Nuclear. Denúncia/Defesa externa.", priceRegular: "R$ 15.812,79", priceSubscriber: "R$ 11.000,00", successFee: "TB + incremento de 1,5%" },
  { id: "tc-reequilibrio", category: "Controle / Judicial", service: "Atuação em Matéria de Tribunal de Contas (Reequilíbrio)", description: "Nuclear. Reequilíbrio Econômico.", priceRegular: "R$ 15.812,79", priceSubscriber: "R$ 11.000,00", successFee: "12,5% a 25% sobre o retroativo" },
  { id: "reequilibrio-rito-comum", category: "Controle / Judicial", service: "Reequilíbrio Econômico Pelo Rito Comum", description: "Ação judicial para recuperar margem de lucro.", priceRegular: "R$ 16.645,05", priceSubscriber: "R$ 12.000,00", successFee: "15 a 30% sobre o retroativo" },
  { id: "mandado-seguranca", category: "Controle / Judicial", service: "Mandado de Segurança", description: "Ação judicial para garantir direito líquido e certo.", priceRegular: "R$ 6.658,02", priceSubscriber: "R$ 5.000,00", successFee: "3% a 5% do valor da causa" },
];

// Group categories for display
export const groupedCategories = serviceCategories.reduce((acc, item) => {
  if (!acc[item.category]) {
    acc[item.category] = [];
  }
  acc[item.category].push(item);
  return acc;
}, {} as Record<string, ServiceCategory[]>);

export const getCategoryById = (id: string): ServiceCategory | undefined => {
  return serviceCategories.find(cat => cat.id === id);
};
