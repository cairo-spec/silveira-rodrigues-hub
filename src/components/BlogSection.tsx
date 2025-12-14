import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Post } from "@/lib/blogger-parser";

export type { Post };

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

interface BlogSectionProps {
  posts: Post[];
}

const BlogSection = ({ posts }: BlogSectionProps) => {
  if (!posts || posts.length === 0) {
    return null;
  }

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
          {posts.map((post, index) => (
            <a
              key={post.id}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="group h-full cursor-pointer overflow-hidden border border-border bg-background hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="h-48 overflow-hidden">
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-300"
                    />
                  ) : (
                    <div className="h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <span className="text-6xl font-bold text-primary/10">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                  )}
                </div>

                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(post.published_at)}</span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>

                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {post.excerpt}
                  </p>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
