import ContentSection from "@/components/landing/content";
import FAQs from "@/components/landing/faqs";
import Features from "@/components/landing/features";
import FooterSection from "@/components/landing/footer";
import HeroSection from "@/components/landing/hero-section";
import LogoCloud from "@/components/landing/logo-cloud";
import StatsSection from "@/components/landing/stats";
import TeamSection from "@/components/landing/team";
import Testimonial from "@/components/landing/testimonials";

// Font imports for homepage only
import "./fonts.css";

export default function Home() {
  return (
    <div className="font-neue-montreal">
      <HeroSection />
      <ContentSection />
      <StatsSection />
      <Features />
      <LogoCloud />
      <TeamSection />
      <Testimonial />
      <FAQs />
      <FooterSection />
    </div>
  );
}