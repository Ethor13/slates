import Nav from '../General/Nav';
import Footer from '../General/Footer';
import Hero from './Hero';

const LandingPage = () => {
    return (
        <div className="min-h-screen slate-gradient">
            <Nav />
            <main>
                <Hero />
            </main>
            <Footer />
        </div>
    );
}

export default LandingPage;