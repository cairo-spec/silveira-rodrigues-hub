import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, Eye, Loader2, FileText, Download, FolderOpen, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface KBCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_premium: boolean | null;
  image_url: string | null;
}

interface KBArticle {
  id: string;
  title: string;
  content: string | null;
  file_url: string | null;
  views: number;
  category_id: string;
}

interface KnowledgeBaseProps {
  isSubscriber?: boolean;
}

const KnowledgeBase = ({ isSubscriber = false }: KnowledgeBaseProps) => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<KBCategory[]>([]);
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<KBCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingArticleId, setLoadingArticleId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchArticles();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('kb_categories')
      .select('*')
      .order('order_index');
    
    // Filter premium categories for non-subscribers
    const filteredCategories = isSubscriber 
      ? data || []
      : (data || []).filter(cat => !cat.is_premium);
    
    setCategories(filteredCategories);
  };

  const fetchArticles = async () => {
    // RLS will filter articles based on subscription status
    const { data } = await supabase
      .from('kb_articles')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    
    setArticles(data || []);
    setIsLoading(false);
  };

  const handleViewArticle = async (article: KBArticle) => {
    if (!article.file_url) {
      toast({ title: "Erro", description: "Este artigo não possui arquivo anexado", variant: "destructive" });
      return;
    }

    setLoadingArticleId(article.id);

    try {
      // Get the current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({ title: "Erro", description: "Você precisa estar logado para acessar este arquivo", variant: "destructive" });
        setLoadingArticleId(null);
        return;
      }

      // Call edge function to get signed URL with subscription validation
      const { data, error } = await supabase.functions.invoke('get-kb-file-url', {
        body: { articleId: article.id }
      });

      if (error) {
        console.error('Error getting signed URL:', error);
        toast({ title: "Erro", description: "Não foi possível acessar o arquivo", variant: "destructive" });
        setLoadingArticleId(null);
        return;
      }

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
        // Update local view count optimistically
        setArticles(prev => prev.map(a => 
          a.id === article.id ? { ...a, views: a.views + 1 } : a
        ));
        toast({ title: "Sucesso", description: "Arquivo aberto com sucesso" });
      } else {
        toast({ title: "Erro", description: data?.error || "Não foi possível gerar o link do arquivo", variant: "destructive" });
      }
    } catch (err) {
      console.error('Error viewing article:', err);
      toast({ title: "Erro", description: "Erro ao acessar o arquivo", variant: "destructive" });
    } finally {
      setLoadingArticleId(null);
    }
  };

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = searchQuery === "" || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || article.category_id === selectedCategory.id;
    
    // Also filter categories in search
    if (searchQuery) {
      const category = categories.find(c => c.id === article.category_id);
      const matchesCategoryName = category?.name.toLowerCase().includes(searchQuery.toLowerCase());
      return (matchesSearch || matchesCategoryName) && matchesCategory;
    }
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Base de Conhecimento</h2>
        <p className="text-muted-foreground">Encontre respostas para suas dúvidas</p>
      </div>

      {/* Prominent Search Bar */}
      <Card className="border-primary/20">
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar artigos por título ou categoria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedCategory === null ? "default" : "outline"}
            className="cursor-pointer px-3 py-1"
            onClick={() => setSelectedCategory(null)}
          >
            Todos
          </Badge>
          {categories.map((category) => (
            <Badge
              key={category.id}
              variant={selectedCategory?.id === category.id ? "default" : "outline"}
              className="cursor-pointer px-3 py-1"
              onClick={() => setSelectedCategory(category)}
            >
              {category.name}
              {category.is_premium && <span className="ml-1">⭐</span>}
            </Badge>
          ))}
        </div>
      )}

      {/* Articles */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredArticles.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              {searchQuery ? (
                <Search className="h-12 w-12 text-muted-foreground" />
              ) : (
                <FolderOpen className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery 
                ? "Nenhum resultado encontrado"
                : "Nenhum artigo disponível"
              }
            </h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              {searchQuery 
                ? `Não encontramos artigos correspondentes a "${searchQuery}". Tente buscar por outros termos.`
                : "A base de conhecimento está sendo construída. Em breve teremos conteúdo disponível para você."
              }
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Limpar busca
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredArticles.map((article) => {
            const category = categories.find((c) => c.id === article.category_id);
            return (
              <Card 
                key={article.id}
                className="hover:shadow-md transition-shadow hover:border-primary/30"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    {/* Category circular image */}
                    {category?.image_url ? (
                      <img 
                        src={category.image_url} 
                        alt={category.name} 
                        className="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-primary/20"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0 border-2 border-primary/20">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-semibold">{article.title}</CardTitle>
                        {category && (
                          <Badge variant="secondary" className="shrink-0">
                            {category.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>Documento PDF</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {article.views}
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleViewArticle(article)}
                      className="gap-1"
                      disabled={loadingArticleId === article.id}
                    >
                      {loadingArticleId === article.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      {loadingArticleId === article.id ? 'Carregando...' : 'Abrir'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
