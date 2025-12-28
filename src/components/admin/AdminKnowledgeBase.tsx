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
import { Loader2, Plus, BookOpen, Eye, Pencil, Trash2, FileText, Upload } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string | null;
  is_premium: boolean;
  image_url: string | null;
}

interface Article {
  id: string;
  title: string;
  content: string | null;
  file_url: string | null;
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
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form states
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryPremium, setCategoryPremium] = useState(false);
  const [categoryImage, setCategoryImage] = useState<File | null>(null);
  const [categoryImageUrl, setCategoryImageUrl] = useState<string | null>(null);
  const [isCategoryUploading, setIsCategoryUploading] = useState(false);
  const [articleTitle, setArticleTitle] = useState("");
  const [articleFile, setArticleFile] = useState<File | null>(null);
  const [articleFileUrl, setArticleFileUrl] = useState<string | null>(null);
  const [articleCategory, setArticleCategory] = useState("");
  const [articlePublished, setArticlePublished] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCategoryUploading(true);

    let imageUrl = categoryImageUrl;

    // Upload new image if selected
    if (categoryImage) {
      const fileExt = categoryImage.name.split('.').pop();
      const fileName = `category-${Date.now()}.${fileExt}`;
      const filePath = `categories/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('kb-files')
        .upload(filePath, categoryImage);

      if (uploadError) {
        toast({ title: "Erro", description: "Não foi possível fazer upload da imagem", variant: "destructive" });
        setIsCategoryUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('kb-files')
        .getPublicUrl(filePath);

      imageUrl = urlData.publicUrl;
    }

    const categoryData = {
      name: categoryName,
      description: categoryDescription || null,
      is_premium: categoryPremium,
      image_url: imageUrl
    };

    const { error } = editingCategory
      ? await supabase.from('kb_categories').update(categoryData).eq('id', editingCategory.id)
      : await supabase.from('kb_categories').insert(categoryData);

    setIsCategoryUploading(false);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível salvar categoria", variant: "destructive" });
    } else {
      toast({ title: editingCategory ? "Categoria atualizada" : "Categoria criada" });
      setCategoryModalOpen(false);
      resetCategoryForm();
      fetchData();
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryDescription(category.description || "");
    setCategoryPremium(category.is_premium);
    setCategoryImageUrl(category.image_url);
    setCategoryImage(null);
    setCategoryModalOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    // Check if category has articles
    const articlesInCategory = articles.filter(a => a.category_id === id);
    if (articlesInCategory.length > 0) {
      toast({ title: "Erro", description: "Não é possível excluir categoria com artigos", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from('kb_categories').delete().eq('id', id);
    if (error) {
      toast({ title: "Erro", description: "Não foi possível excluir categoria", variant: "destructive" });
    } else {
      toast({ title: "Categoria excluída" });
      fetchData();
    }
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryDescription("");
    setCategoryPremium(false);
    setCategoryImage(null);
    setCategoryImageUrl(null);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    let filePath = articleFileUrl;

    // Upload new file if selected
    if (articleFile) {
      const fileExt = articleFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const newFilePath = `articles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('kb-files')
        .upload(newFilePath, articleFile);

      if (uploadError) {
        toast({ title: "Erro", description: "Não foi possível fazer upload do arquivo", variant: "destructive" });
        setIsUploading(false);
        return;
      }

      // Store only the file path, not the public URL
      filePath = newFilePath;
    }

    const articleData = {
      title: articleTitle,
      file_url: filePath,
      category_id: articleCategory,
      is_published: articlePublished
    };

    const { error } = editingArticle
      ? await supabase.from('kb_articles').update(articleData).eq('id', editingArticle.id)
      : await supabase.from('kb_articles').insert(articleData);

    setIsUploading(false);

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
    setArticleFileUrl(article.file_url);
    setArticleFile(null);
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
    setArticleFile(null);
    setArticleFileUrl(null);
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
          <Dialog open={categoryModalOpen} onOpenChange={(open) => { setCategoryModalOpen(open); if (!open) resetCategoryForm(); }}>
            <DialogTrigger asChild>
              <Button variant="outline"><Plus className="h-4 w-4 mr-2" />Categoria</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingCategory ? "Editar Categoria" : "Nova Categoria"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSaveCategory} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea value={categoryDescription} onChange={(e) => setCategoryDescription(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Imagem de ilustração</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCategoryImage(e.target.files?.[0] || null)}
                  />
                  {categoryImageUrl && !categoryImage && (
                    <div className="flex items-center gap-2">
                      <img src={categoryImageUrl} alt="Imagem atual" className="w-12 h-12 rounded-full object-cover" />
                      <span className="text-sm text-muted-foreground">Imagem atual</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={categoryPremium} onCheckedChange={setCategoryPremium} />
                  <Label>Exclusivo para assinantes</Label>
                </div>
                <Button type="submit" className="w-full" disabled={isCategoryUploading}>
                  {isCategoryUploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</> : (editingCategory ? "Salvar" : "Criar Categoria")}
                </Button>
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
                  <Label>Arquivo PDF</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setArticleFile(e.target.files?.[0] || null)}
                      className="flex-1"
                    />
                  </div>
                  {articleFileUrl && !articleFile && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      Arquivo atual anexado
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={articlePublished} onCheckedChange={setArticlePublished} />
                  <Label>Publicado</Label>
                </div>
                <Button type="submit" className="w-full" disabled={isUploading}>
                  {isUploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</> : "Salvar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="font-semibold mb-3">Categorias</h3>
        {categories.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma categoria</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <Card key={cat.id} className="flex items-center gap-3 p-3">
                {cat.image_url ? (
                  <img src={cat.image_url} alt={cat.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{cat.name}</p>
                  {cat.description && (
                    <p className="text-xs text-muted-foreground truncate">{cat.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {cat.is_premium && <Badge variant="default" className="text-xs">⭐</Badge>}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditCategory(cat)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteCategory(cat.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
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
                          {article.file_url && (
                            <Badge variant="secondary" className="gap-1">
                              <FileText className="h-3 w-3" />PDF
                            </Badge>
                          )}
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
