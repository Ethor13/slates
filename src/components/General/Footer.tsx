import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-deep text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center">
              <img src="/assets/logos/slates.svg" alt="Slates Logo" className="h-8 w-8" />
              <span className="ml-2 text-xl font-bold">Slates</span>
            </div>
            <p className="mt-4 text-slate-light">
              Revolutionizing sports programming for bars and venues through data-driven insights.
            </p>
            <div className="mt-6 flex space-x-4">
              <a href="#" className="text-slate-light hover:text-white transition-colors">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-slate-light hover:text-white transition-colors">
                <Twitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-slate-light hover:text-white transition-colors">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-slate-light hover:text-white transition-colors">
                <Linkedin className="h-6 w-6" />
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-light hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="text-slate-light hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="text-slate-light hover:text-white transition-colors">API</a></li>
              <li><a href="#" className="text-slate-light hover:text-white transition-colors">Integration</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-light hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="text-slate-light hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="text-slate-light hover:text-white transition-colors">Case Studies</a></li>
              <li><a href="#" className="text-slate-light hover:text-white transition-colors">Support</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-light hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="text-slate-light hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="text-slate-light hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="text-slate-light hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-medium/30">
          <p className="text-center text-slate-light">
            © {new Date().getFullYear()} Slates. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;