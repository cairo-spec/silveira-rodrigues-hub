import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PricingSection from "@/components/PricingSection";
import EducationalSection from "@/components/EducationalSection";
import SolutionsSection from "@/components/SolutionsSection";
import AuthoritySection from "@/components/AuthoritySection";
import BlogSection from "@/components/BlogSection";
import Footer from "@/components/Footer";
import { fetchAndParseBloggerPosts } from "@/lib/blogger-parser";

// URL do feed do Blogger - substitua pelo seu blog
const BLOGGER_FEED_URL = "https://silveiraerodrigues.blogspot.com/feeds/posts/default?alt=json";

const Index = () => {
  const { data: posts = [] } = useQuery({
    queryKey: ["blogger-posts"],
    queryFn: () => fetchAndParseBloggerPosts(BLOGGER_FEED_URL),
    staleTime: 1000 * 60 * 60, // 1 hora
    select: (data) => data.slice(0, 3), // Limita aos 3 mais recentes
  });
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <PricingSection />
      <EducationalSection />
      <SolutionsSection />
      <AuthoritySection />
      <BlogSection posts={posts} />
      <Footer />
    </main>
  );
};

export default Index;
