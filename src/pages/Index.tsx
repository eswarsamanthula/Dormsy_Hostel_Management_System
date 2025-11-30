import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import RoleShowcase from "@/components/RoleShowcase";
import About from "@/components/About";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main role="main">
        <Hero />
        <Features />
        <RoleShowcase />
        <About />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
