import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PricingSection from "@/components/PricingSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import FeaturesShowcaseSection from "@/components/FeaturesShowcaseSection";
import JourneySection from "@/components/JourneySection";
import ROISection from "@/components/ROISection";
import EducationalSection from "@/components/EducationalSection";
import SolutionsSection from "@/components/SolutionsSection";
import AuthoritySection from "@/components/AuthoritySection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <PricingSection />
      <HowItWorksSection />
      <FeaturesShowcaseSection />
      <JourneySection />
      <ROISection />
      <EducationalSection />
      <SolutionsSection />
      <AuthoritySection />
      <Footer />
    </main>
  );
};

export default Index;