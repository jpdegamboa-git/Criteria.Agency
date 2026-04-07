import Nav from "@/components/nav";
import Hero from "@/components/hero";
import TrustBar from "@/components/trust-bar";
import HowItWorks from "@/components/how-it-works";
import QualityGates from "@/components/quality-gates";
import PricingCards from "@/components/pricing-cards";
import CtaSection from "@/components/cta-section";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <TrustBar />
      <HowItWorks />
      <QualityGates />
      <PricingCards />
      <CtaSection />
      <Footer />
    </>
  );
}
