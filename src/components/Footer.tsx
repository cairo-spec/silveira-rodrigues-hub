import { Linkedin, Mail, Phone, MapPin } from "lucide-react";
const Footer = () => {
  const currentYear = new Date().getFullYear();
  return <footer className="bg-primary text-primary-foreground">
      <div className="container-custom py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold mb-4">Silveira & Rodrigues</h3>
            <p className="text-primary-foreground/70 mb-6 max-w-md">
              Inteligência de mercado e blindagem jurídica para licitações. 
              Venda para o governo com a segurança de quem fiscaliza.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://www.linkedin.com/in/cairo-rodrigues-026188147/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="mailto:contato@silveiraerodigues.adv.br" className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-primary-foreground/80">
              Links Úteis
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#jornal" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  Jornal de Licitações
                </a>
              </li>
              <li>
                <a href="#solucoes" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  Consultoria BPO
                </a>
              </li>
              <li>
                <a href="#solucoes" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  Plano de Integridade
                </a>
              </li>
              <li>
                <a href="#blog" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  Advocacia Empresarial
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-primary-foreground/80">
              Contato
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 mt-1 text-gold" />
                <span className="text-primary-foreground/70 text-sm">
                  contato@silveiraerodigues.adv.br
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 mt-1 text-gold" />
                <span className="text-primary-foreground/70 text-sm">(31)  99347-5792 </span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-1 text-gold" />
                <span className="text-primary-foreground/70 text-sm">Belo Horizonte - MG</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-primary-foreground/60">
            <p>
              © {currentYear} Silveira & Rodrigues Advogados. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-primary-foreground transition-colors">
                Política de Privacidade
              </a>
              <span className="text-primary-foreground/30">|</span>
              <a href="#" className="hover:text-primary-foreground transition-colors">
                Termos de Uso
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;