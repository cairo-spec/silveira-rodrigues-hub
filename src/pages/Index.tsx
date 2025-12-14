import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PricingSection from "@/components/PricingSection";
import EducationalSection from "@/components/EducationalSection";
import SolutionsSection from "@/components/SolutionsSection";
import AuthoritySection from "@/components/AuthoritySection";
import BlogSection, { Post } from "@/components/BlogSection";
import Footer from "@/components/Footer";

// Posts externos - integração com blog
const externalPosts: Post[] = [
  {
    id: 1,
    title: "Impactos da Lei 14.133 nas Contratações Públicas",
    excerpt: "Entenda as principais mudanças trazidas pela Nova Lei de Licitações e como sua empresa pode se adaptar.",
    published_at: "2024-12-10",
    url: "https://example.com/post-1",
  },
  {
    id: 2,
    title: "Como Evitar a Inabilitação em Licitações",
    excerpt: "Os erros documentais mais comuns que levam à desclassificação e como preveni-los.",
    published_at: "2024-12-05",
    url: "https://example.com/post-2",
  },
  {
    id: 3,
    title: "Matriz de Riscos: O Que Você Precisa Saber",
    excerpt: "A importância da análise de riscos contratuais para garantir a lucratividade dos seus contratos públicos.",
    published_at: "2024-11-28",
    url: "https://example.com/post-3",
  },
];

const Index = () => {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <PricingSection />
      <EducationalSection />
      <SolutionsSection />
      <AuthoritySection />
      <BlogSection posts={externalPosts} />
      <Footer />
    </main>
  );
};

export default Index;
