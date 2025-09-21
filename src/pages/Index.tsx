import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import PricingPreview from "@/components/PricingPreview";
import ProfessionalTemplates from "@/components/ProfessionalTemplates";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main>
        <Hero />
        <Features />
        <ProfessionalTemplates />
        <PricingPreview />
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
