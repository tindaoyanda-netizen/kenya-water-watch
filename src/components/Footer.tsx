import { Link } from 'react-router-dom';
import { Droplets, Github, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-water-dark text-white py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Droplets className="w-8 h-8 text-accent" />
              <span className="font-heading font-bold text-xl">Kenya Water Watch</span>
            </Link>
            <p className="text-white/70 mb-6 max-w-md">
              Real-time water monitoring and analysis platform for Kenya. 
              Making data-driven decisions accessible for a water-secure future.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li><Link to="/" className="text-white/70 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/dashboard" className="text-white/70 hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link to="/auth" className="text-white/70 hover:text-white transition-colors">Sign Up</Link></li>
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-white/70 hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="text-white/70 hover:text-white transition-colors">API Reference</a></li>
              <li><a href="#" className="text-white/70 hover:text-white transition-colors">Research Papers</a></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/60 text-sm">
            © 2025 Kenya Water Watch. Built for Environmental Awareness.
          </p>
          <p className="text-white/60 text-sm">
            Science Fair Project • Real-Time Environmental Monitoring
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
