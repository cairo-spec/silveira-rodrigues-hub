import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { href: "#jornal", label: "Jornal" },
  { href: "#solucoes", label: "Soluções" },
  { href: "#quem-somos", label: "Quem Somos" },
  { href: "#blog", label: "Blog" },
];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const scrollToSection = (href: string) => {
    setIsOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <span className="text-lg md:text-xl font-bold text-primary tracking-tight">
              Silveira & Rodrigues
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate("/membros")}
                >
                  <User className="h-4 w-4 mr-2" />
                  Área de Membros
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate("/auth")}
                >
                  <User className="h-4 w-4 mr-2" />
                  Entrar
                </Button>
                <Button
                  onClick={() => scrollToSection("#jornal")}
                  className="bg-primary text-primary-foreground hover:bg-deep-green-light"
                >
                  Assinar Jornal
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background">
              <nav className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => scrollToSection(link.href)}
                    className="text-left py-2 text-lg font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
                <Button
                  onClick={() => scrollToSection("#jornal")}
                  className="mt-4 bg-primary text-primary-foreground hover:bg-deep-green-light"
                >
                  Assinar Jornal
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
