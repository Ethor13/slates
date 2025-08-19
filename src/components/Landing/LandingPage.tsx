import Nav from '../General/Nav';
import Footer from '../General/Footer';
import Hero from './Hero';
import Funnel from './Funnel';
import BenefitsForBars from './BenefitsForBars';
import Pricing from './Pricing';
import Contact from './Contact';

const LandingPage = () => {
    return (
        <div className="slate-gradient">
            <Nav />
            <main>
                <Hero />
                <Funnel />
                <BenefitsForBars />
                <Pricing />
                <Contact />
            </main>
            <Footer />
        </div>
    );
}

export default LandingPage;