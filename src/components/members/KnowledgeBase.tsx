import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, ArrowLeft, Eye, Loader2 } from "lucide-react";

interface KBCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

interface KBArticle {
  id: string;
  title: string;
  content: string;
  views: number;
  category_id: string;
}

const KnowledgeBase = () => {
  const [categories, setCategories] = useState<KBCategory[]>([]);
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<KBCategory | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchArticles();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('kb_categories')
      .select('*')
      .order('order_index');
    
    setCategories(data || []);
  };

  const fetchArticles = async () => {
    const { data } = await supabase
      .from('kb_articles')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    
    setArticles(data || []);
    setIsLoading(false);
  };

  const handleViewArticle = async (article: KBArticle) => {
    setSelectedArticle(article);
    
    // Increment view count
    await supabase
      .from('kb_articles')
      .update({ views: article.views + 1 })
      .eq('id', article.id);
  };

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = searchQuery === "" || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || article.category_id === selectedCategory.id;
    
    return matchesSearch && matchesCategory;
  });

  if (selectedArticle) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSelectedArticle(null)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedArticle.title}</CardTitle>
              <Badge variant="outline" className="gap-1">
                <Eye className="h-3 w-3" />
                {selectedArticle.views + 1} views
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

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
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleViewArticle(article)}
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
                  <CardDescription className="line-clamp-2">
                    {article.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                  </CardDescription>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    {article.views} visualizações
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
