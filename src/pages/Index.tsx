import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PricingSection from "@/components/PricingSection";
import ROISection from "@/components/ROISection";
import EducationalSection from "@/components/EducationalSection";
import SolutionsSection from "@/components/SolutionsSection";
import AuthoritySection from "@/components/AuthoritySection";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <PricingSection />
      <EducationalSection />
      <SolutionsSection />
      <ROISection showTrialButton={false} />
      <AuthoritySection />
      <Footer />
      <FloatingWhatsApp />
    </main>
  );
};

export default Index;