import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PoliticaDados = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold text-primary mb-8">
            Política de Privacidade e Proteção de Dados Pessoais
          </h1>

          <p className="text-muted-foreground mb-6">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Introdução</h2>
            <p>
              A Silveira & Rodrigues Advogados Associados ("Controlador") está comprometida com a proteção 
              dos dados pessoais de seus clientes, usuários e visitantes, em conformidade com a 
              Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD) e demais normas aplicáveis.
            </p>
            <p>
              Esta Política de Privacidade descreve como coletamos, usamos, armazenamos, compartilhamos 
              e protegemos seus dados pessoais quando você utiliza nossos serviços, incluindo o 
              Jornal de Licitações Auditado e a área de membros.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Dados Pessoais Coletados</h2>
            <p>Coletamos os seguintes tipos de dados pessoais:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Dados de Identificação:</strong> Nome completo, e-mail, telefone/WhatsApp</li>
              <li><strong>Dados Profissionais:</strong> Nome da empresa, cargo, CNPJ (quando aplicável)</li>
              <li><strong>Dados de Acesso:</strong> Credenciais de login, histórico de sessões</li>
              <li><strong>Dados de Uso:</strong> Interações com a plataforma, preferências de busca de licitações</li>
              <li><strong>Dados de Comunicação:</strong> Mensagens em tickets de suporte e chat</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Finalidade do Tratamento</h2>
            <p>Utilizamos seus dados pessoais para as seguintes finalidades:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Prestação de serviços advocatícios e consultoria em licitações</li>
              <li>Monitoramento e triagem de oportunidades de licitação conforme seus critérios</li>
              <li>Comunicação sobre andamento de processos e novas oportunidades</li>
              <li>Atendimento ao cliente via tickets e chat de suporte</li>
              <li>Emissão de cobranças e gestão de assinaturas</li>
              <li>Cumprimento de obrigações legais e regulatórias</li>
              <li>Melhoria contínua de nossos serviços</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Base Legal para Tratamento</h2>
            <p>O tratamento de seus dados pessoais é realizado com base nas seguintes hipóteses legais (Art. 7º da LGPD):</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Consentimento:</strong> Para comunicações de marketing e uso de cookies não essenciais</li>
              <li><strong>Execução de Contrato:</strong> Para prestação dos serviços advocatícios contratados</li>
              <li><strong>Cumprimento de Obrigação Legal:</strong> Para atender requisitos fiscais, contábeis e regulatórios</li>
              <li><strong>Legítimo Interesse:</strong> Para melhoria de serviços e prevenção de fraudes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Compartilhamento de Dados</h2>
            <p>Seus dados pessoais podem ser compartilhados com:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Prestadores de Serviços:</strong> Plataformas de pagamento (Asaas), hospedagem de dados, serviços de e-mail</li>
              <li><strong>Órgãos Públicos:</strong> Quando necessário para defesa em processos licitatórios</li>
              <li><strong>Autoridades Judiciais:</strong> Mediante ordem judicial ou requisição legal</li>
            </ul>
            <p className="mt-4">
              Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins de marketing 
              sem seu consentimento expresso.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Armazenamento e Segurança</h2>
            <p>
              Seus dados são armazenados em servidores seguros com criptografia em repouso e em trânsito. 
              Implementamos medidas técnicas e organizacionais para proteger seus dados, incluindo:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Criptografia TLS/SSL para todas as comunicações</li>
              <li>Controle de acesso baseado em funções (RBAC)</li>
              <li>Políticas de Row-Level Security (RLS) no banco de dados</li>
              <li>Autenticação segura com múltiplos métodos</li>
              <li>Monitoramento contínuo de segurança</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Seus Direitos como Titular (Art. 18 da LGPD)</h2>
            <p>Você tem direito a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Confirmação e Acesso:</strong> Confirmar a existência e acessar seus dados pessoais</li>
              <li><strong>Correção:</strong> Solicitar correção de dados incompletos, inexatos ou desatualizados</li>
              <li><strong>Anonimização ou Bloqueio:</strong> Solicitar anonimização ou bloqueio de dados desnecessários</li>
              <li><strong>Eliminação:</strong> Solicitar a exclusão de dados tratados com base em consentimento</li>
              <li><strong>Portabilidade:</strong> Solicitar a portabilidade de seus dados para outro fornecedor</li>
              <li><strong>Revogação do Consentimento:</strong> Revogar o consentimento a qualquer momento</li>
              <li><strong>Oposição:</strong> Opor-se a tratamento realizado com base em legítimo interesse</li>
            </ul>
            <p className="mt-4">
              Para exercer seus direitos, acesse as configurações de sua conta na área de membros 
              ou entre em contato conosco pelos canais indicados abaixo.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Retenção de Dados</h2>
            <p>
              Seus dados pessoais serão mantidos pelo tempo necessário para cumprir as finalidades 
              para as quais foram coletados, incluindo obrigações legais de guarda documental:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Dados contratuais: 5 anos após o término do contrato</li>
              <li>Documentos fiscais: 5 anos conforme legislação tributária</li>
              <li>Processos judiciais: Até o trânsito em julgado e arquivamento definitivo</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Cookies e Tecnologias de Rastreamento</h2>
            <p>
              Utilizamos cookies estritamente necessários para o funcionamento da plataforma. 
              Não utilizamos cookies de terceiros para publicidade ou rastreamento comportamental.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Contato e Encarregado de Dados (DPO)</h2>
            <p>
              Para dúvidas sobre esta política ou para exercer seus direitos como titular de dados, 
              entre em contato conosco:
            </p>
            <div className="bg-muted p-4 rounded-lg mt-4">
              <p><strong>Silveira & Rodrigues Advogados Associados</strong></p>
              <p>E-mail: contato@silveiraerodrigues.adv.br</p>
              <p>Telefone: (XX) XXXX-XXXX</p>
              <p className="mt-2"><strong>Encarregado de Proteção de Dados (DPO):</strong></p>
              <p>E-mail: dpo@silveiraerodrigues.adv.br</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. Alterações nesta Política</h2>
            <p>
              Esta política pode ser atualizada periodicamente. Notificaremos você sobre alterações 
              significativas por e-mail ou através de aviso na plataforma. Recomendamos revisar 
              esta página regularmente.
            </p>
          </section>

          <section className="mb-8 border-t pt-6">
            <p className="text-sm text-muted-foreground">
              Ao utilizar nossos serviços, você declara ter lido e compreendido esta Política de 
              Privacidade e concorda com o tratamento de seus dados pessoais conforme aqui descrito.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PoliticaDados;