import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ContractModal = ({ open, onOpenChange }: ContractModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Contrato de Serviços Advocatícios de Partido
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <p>
              Pelo presente instrumento, o CONTRATANTE (doravante denominado "CLIENTE") adere aos serviços prestados por <strong>CAIRO RODRIGUES SAMPAIO NOGUES SOCIEDADE INDIVIDUAL DE ADVOCACIA</strong>, inscrita na OAB/MG sob o nº 190.546 e CNPJ nº 61.107.032/0001-85, regendo-se pelas seguintes cláusulas e condições:
            </p>

            <div>
              <h3 className="font-semibold text-foreground mb-2">1. DO OBJETO</h3>
              <p className="mb-2">
                1.1. O presente contrato tem por objeto a prestação de serviços de advocacia extrajudicial, na modalidade de PARTIDO MENSAL, consistentes especificamente em:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>a) Monitoramento e Triagem:</strong> Rastreamento de editais de licitação compatíveis com o CNAE do CLIENTE;</li>
                <li><strong>b) Análise de Risco (Compliance):</strong> Emissão de Relatório de Gerenciamento de Risco (RGR) simplificado sobre os editais selecionados, apontando cláusulas restritivas ou ilegais;</li>
                <li><strong>c) Curadoria Jurídica:</strong> Envio periódico (2x por semana) do "Boletim de Oportunidades" filtrado.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">2. DA DELIMITAÇÃO DO ESCOPO (O QUE NÃO ESTÁ INCLUSO)</h3>
              <p className="mb-2">
                2.1. O valor mensal deste contrato NÃO INCLUI a elaboração de peças processuais complexas ou atuação contenciosa, tais como, mas não se limitando a: Impugnações ao Edital, Recursos Administrativos, Contrarrazões, Mandados de Segurança, Defesas em Processos Sancionatórios ou Atuação perante Tribunais de Contas.
              </p>
              <p>
                2.2. Caso o CLIENTE necessite de quaisquer dos serviços listados na cláusula 2.1, estes serão objeto de contratação específica, sobre os quais incidirão honorários à parte, garantindo-se ao CLIENTE, contudo, a aplicação da <strong>Tabela de Honorários Privilegiada (Tabela Assinante)</strong>.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">3. DA NATUREZA DA OBRIGAÇÃO</h3>
              <p className="mb-2">
                3.1. A SOCIEDADE assume obrigação de meio e não de resultado. O serviço limita-se a identificar oportunidades e apontar riscos jurídicos. A decisão final de participar do certame e a definição dos preços ofertados são de responsabilidade exclusiva do CLIENTE.
              </p>
              <p>
                3.2. A SOCIEDADE não se responsabiliza por inabilitações decorrentes de falha documental do CLIENTE, ausência de certidões ou inviabilidade econômica da proposta ofertada.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">4. DOS HONORÁRIOS E DA GESTÃO DE PAGAMENTOS (ASAAS)</h3>
              <p className="mb-2">
                4.1. Pelos serviços de monitoramento e triagem descritos na Cláusula 1, o CLIENTE pagará a importância mensal de <strong>R$ 997,00</strong> (Novecentos e noventa e sete reais) a título de honorários de partido.
              </p>
              <p className="mb-2">
                4.2. A gestão financeira e o processamento das cobranças serão realizados exclusivamente através da plataforma ASAAS (Asaas Gestão Financeira S.A.).
              </p>
              <p className="mb-2">
                4.3. O CLIENTE adere ao modelo de Assinatura Recorrente, selecionando no momento do checkout a modalidade de sua preferência dentre as disponibilizadas pelo intermediador (Cartão de Crédito, Boleto Bancário ou Pix):
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-2">
                <li><strong>a) Cartão de Crédito:</strong> Débito automático mensal na fatura;</li>
                <li><strong>b) Boleto ou Pix:</strong> O CLIENTE receberá mensalmente, via e-mail ou SMS automatizado pelo ASAAS, o link para pagamento, devendo quitá-lo até a data de vencimento para garantir a continuidade dos serviços.</li>
              </ul>
              <p>
                4.4. O não pagamento de qualquer mensalidade por prazo superior a 5 (cinco) dias do vencimento implicará na suspensão imediata do envio dos relatórios e do acesso à área do cliente, sem prejuízo da cobrança dos valores em aberto.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">5. DO SIGILO E INDEPENDÊNCIA TÉCNICA</h3>
              <p>
                5.1. As partes declaram que a relação aqui estabelecida é de natureza advocatícia, protegida pelo sigilo profissional e pelas prerrogativas do Estatuto da Advocacia (Lei 8.906/94).
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">6. DO CANCELAMENTO</h3>
              <p>
                6.1. Este contrato pode ser rescindido por qualquer das partes a qualquer tempo, mediante aviso prévio de 30 (trinta) dias, sem incidência de multa, bastando a solicitação de cancelamento no painel do cliente.
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ContractModal;
