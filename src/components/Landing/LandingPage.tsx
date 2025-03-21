import Nav from '../General/Nav';
import HeroSection from './HeroSection';
import TechnologySection from './TechnologySection';
import BenefitsSection from './BenefitsSection';
import PricingSection from './PricingSection';
import TestimonialsSection from './TestimonialsSection';
import DemoSection from './DemoSection';
import ContactSection from './ContactSection';
import Footer from '../General/Footer';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-slate-light/30">
            <Nav />
            <main className="">
                <HeroSection />
                <TechnologySection />
                <BenefitsSection />
                <DemoSection />
                <TestimonialsSection />
                <PricingSection />
                <ContactSection />
            </main>
            <Footer />
        </div>
    );
}

export default LandingPage;