import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, BookOpen, Eye, Pencil, Trash2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string | null;
}

interface Article {
  id: string;
  title: string;
  content: string;
  is_published: boolean;
  views: number;
  category_id: string;
}

const AdminKnowledgeBase = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [articleModalOpen, setArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  // Form states
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [articleTitle, setArticleTitle] = useState("");
  const [articleContent, setArticleContent] = useState("");
  const [articleCategory, setArticleCategory] = useState("");
  const [articlePublished, setArticlePublished] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [catRes, artRes] = await Promise.all([
      supabase.from('kb_categories').select('*').order('order_index'),
      supabase.from('kb_articles').select('*').order('created_at', { ascending: false })
    ]);
    setCategories(catRes.data || []);
    setArticles(artRes.data || []);
    setIsLoading(false);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('kb_categories').insert({
      name: categoryName,
      description: categoryDescription || null
    });

    if (error) {
      toast({ title: "Erro", description: "Não foi possível criar categoria", variant: "destructive" });
    } else {
      toast({ title: "Categoria criada" });
      setCategoryModalOpen(false);
      setCategoryName("");
      setCategoryDescription("");
      fetchData();
    }
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const articleData = {
      title: articleTitle,
      content: articleContent,
      category_id: articleCategory,
      is_published: articlePublished
    };

    const { error } = editingArticle
      ? await supabase.from('kb_articles').update(articleData).eq('id', editingArticle.id)
      : await supabase.from('kb_articles').insert(articleData);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível salvar artigo", variant: "destructive" });
    } else {
      toast({ title: editingArticle ? "Artigo atualizado" : "Artigo criado" });
      setArticleModalOpen(false);
      resetArticleForm();
      fetchData();
    }
  };

  const handleEditArticle = (article: Article) => {
    setEditingArticle(article);
    setArticleTitle(article.title);
    setArticleContent(article.content);
    setArticleCategory(article.category_id);
    setArticlePublished(article.is_published);
    setArticleModalOpen(true);
  };

  const handleDeleteArticle = async (id: string) => {
    const { error } = await supabase.from('kb_articles').delete().eq('id', id);
    if (error) {
      toast({ title: "Erro", description: "Não foi possível excluir artigo", variant: "destructive" });
    } else {
      toast({ title: "Artigo excluído" });
      fetchData();
    }
  };

  const resetArticleForm = () => {
    setEditingArticle(null);
    setArticleTitle("");
    setArticleContent("");
    setArticleCategory("");
    setArticlePublished(false);
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Base de Conhecimento</h2>
          <p className="text-muted-foreground">Gerencie categorias e artigos de ajuda</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Plus className="h-4 w-4 mr-2" />Categoria</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Categoria</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateCategory} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea value={categoryDescription} onChange={(e) => setCategoryDescription(e.target.value)} />
                </div>
                <Button type="submit" className="w-full">Criar Categoria</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={articleModalOpen} onOpenChange={(open) => { setArticleModalOpen(open); if (!open) resetArticleForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Artigo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{editingArticle ? "Editar Artigo" : "Novo Artigo"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSaveArticle} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input value={articleTitle} onChange={(e) => setArticleTitle(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={articleCategory} onValueChange={setArticleCategory} required>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Conteúdo (HTML)</Label>
                  <Textarea value={articleContent} onChange={(e) => setArticleContent(e.target.value)} rows={8} required />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={articlePublished} onCheckedChange={setArticlePublished} />
                  <Label>Publicado</Label>
                </div>
                <Button type="submit" className="w-full">Salvar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="font-semibold mb-3">Categorias</h3>
        <div className="flex flex-wrap gap-2">
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma categoria</p>
          ) : (
            categories.map((cat) => (
              <Badge key={cat.id} variant="secondary">{cat.name}</Badge>
            ))
          )}
        </div>
      </div>

      {/* Articles */}
      <div>
        <h3 className="font-semibold mb-3">Artigos</h3>
        {articles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium">Nenhum artigo</h3>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {articles.map((article) => {
              const category = categories.find((c) => c.id === article.category_id);
              return (
                <Card key={article.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">{article.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          {category && <Badge variant="outline">{category.name}</Badge>}
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{article.views}</span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={article.is_published ? "default" : "secondary"}>
                          {article.is_published ? "Publicado" : "Rascunho"}
                        </Badge>
                        <Button variant="ghost" size="icon" onClick={() => handleEditArticle(article)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteArticle(article.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminKnowledgeBase;
