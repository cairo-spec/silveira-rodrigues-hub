import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, Eye, Loader2, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface KBCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_premium: boolean | null;
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
    
    return matchesSearch && matchesCategory;
  });
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Base de Conhecimento</h2>
        <p className="text-muted-foreground">Encontre respostas para suas dúvidas</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar artigos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedCategory === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedCategory(null)}
          >
            Todos
          </Badge>
          {categories.map((category) => (
            <Badge
              key={category.id}
              variant={selectedCategory?.id === category.id ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(category)}
            >
              {category.name}
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
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum artigo encontrado</h3>
            <p className="text-muted-foreground text-center">
              {searchQuery 
                ? "Tente buscar por outros termos"
                : "A base de conhecimento ainda está sendo construída"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredArticles.map((article) => {
            const category = categories.find((c) => c.id === article.category_id);
            return (
              <Card 
                key={article.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{article.title}</CardTitle>
                    {category && (
                      <Badge variant="secondary" className="shrink-0">
                        {category.name}
                      </Badge>
                    )}
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
                      variant="outline"
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
