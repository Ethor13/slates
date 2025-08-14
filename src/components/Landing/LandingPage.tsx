import Nav from '../General/Nav';
import Footer from '../General/Footer';
import Hero from './Hero';
import Funnel from './Funnel';

const LandingPage = () => {
    return (
        <div className="slate-gradient">
            <Nav />
            <main>
                <Hero />
                <Funnel />
            </main>
            <Footer />
        </div>
    );
}

export default LandingPage;