import { Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mock data - will be replaced with Supabase data
const mockPosts = [
  {
    id: 1,
    title: "Impactos da Lei 14.133 nas Contratações Públicas",
    excerpt: "Entenda as principais mudanças trazidas pela Nova Lei de Licitações e como sua empresa pode se adaptar.",
    published_at: "2024-12-10",
  },
  {
    id: 2,
    title: "Como Evitar a Inabilitação em Licitações",
    excerpt: "Os erros documentais mais comuns que levam à desclassificação e como preveni-los.",
    published_at: "2024-12-05",
  },
  {
    id: 3,
    title: "Matriz de Riscos: O Que Você Precisa Saber",
    excerpt: "A importância da análise de riscos contratuais para garantir a lucratividade dos seus contratos públicos.",
    published_at: "2024-11-28",
  },
];

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const BlogSection = () => {
  return (
    <section id="blog" className="section-padding bg-secondary scroll-mt-20">
      <div className="container-custom">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
            Inteligência B2G
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Conteúdo Estratégico
          </h2>
          <p className="text-muted-foreground text-lg">
            Insights e análises para você se manter à frente no mercado de licitações.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockPosts.map((post, index) => (
            <Card
              key={post.id}
              className="group overflow-hidden border border-border bg-background hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              {/* Image placeholder */}
              <div className="h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <span className="text-6xl font-bold text-primary/10">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(post.published_at)}</span>
                </div>

                <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>

                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {post.excerpt}
                </p>

                <Button
                  variant="ghost"
                  className="p-0 h-auto text-primary hover:text-deep-green-light hover:bg-transparent group/btn"
                >
                  Ler mais
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
