import { useEffect, useState } from "react";
import { CheckCircle, MessageCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const generateProtocol = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `#REQ-${randomNum}`;
};

const whatsappNumber = "5531993475792";

const Obrigado = () => {
  const [protocol, setProtocol] = useState<string>("");

  useEffect(() => {
    const generatedProtocol = generateProtocol();
    setProtocol(generatedProtocol);
  }, []);

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(
      `Olá, finalizei a assinatura do Jornal. Meu protocolo é ${protocol}.`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="border-0 shadow-2xl overflow-hidden">
          {/* Success header */}
          <div className="bg-primary p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-gold" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-2">
              Obrigado!
            </h1>
            <p className="text-primary-foreground/80">
              Sua assinatura está sendo processada.
            </p>
          </div>

          <CardContent className="p-8 text-center">
            {/* Protocol display */}
            <div className="mb-8">
              <p className="text-sm text-muted-foreground mb-2">
                Seu número de protocolo:
              </p>
              <div className="inline-block px-6 py-4 rounded-xl bg-primary/5 border-2 border-primary">
                <span className="text-3xl md:text-4xl font-bold text-primary tracking-wider">
                  {protocol}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Guarde este número para acompanhamento
              </p>
            </div>

            {/* WhatsApp CTA */}
            <Button
              size="lg"
              onClick={handleWhatsAppClick}
              className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold py-6 text-lg mb-4"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Confirmar Liberação no WhatsApp
            </Button>

            <p className="text-sm text-muted-foreground mb-6">
              Clique acima para enviar seu protocolo e agilizar a liberação do acesso.
            </p>

            {/* Back to home */}
            <Button asChild variant="ghost" className="text-muted-foreground">
              <Link to="/" className="inline-flex items-center gap-2">
                <Home className="w-4 h-4" />
                Voltar para a página inicial
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Trust footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          © Silveira & Rodrigues Advogados
        </p>
      </div>
    </div>
  );
};

export default Obrigado;
