import Nav from './Nav';
import HeroSection from './HeroSection';
import TechnologySection from './TechnologySection';
import BenefitsSection from './BenefitsSection';
import PricingSection from './PricingSection';
import TestimonialsSection from './TestimonialsSection';
import DemoSection from './DemoSection';
import ContactSection from './ContactSection';
import Footer from './Footer';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-white">
            <Nav />
            <main>
                <HeroSection />
                <TechnologySection />
                <BenefitsSection />
                <PricingSection />
                <TestimonialsSection />
                <DemoSection />
                <ContactSection />
            </main>

            <Footer />
        </div>
    );
}

export default LandingPage;