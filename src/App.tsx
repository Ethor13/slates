import React from 'react';
import { BarChart3, } from 'lucide-react';
import HeroSection from './components/HeroSection';
import TechnologySection from './components/TechnologySection';
import BenefitsSection from './components/BenefitsSection';
import PricingSection from './components/PricingSection';
import TestimonialsSection from './components/TestimonialsSection';
import DemoSection from './components/DemoSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Slates</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#technology" className="text-gray-600 hover:text-blue-600">Technology</a>
              <a href="#benefits" className="text-gray-600 hover:text-blue-600">Benefits</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600">Pricing</a>
              <a href="#demo" className="text-gray-600 hover:text-blue-600">Live Demo</a>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

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

export default App;