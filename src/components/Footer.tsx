import { Link } from 'react-router-dom';
import { Waves, Github, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <Waves className="w-7 h-7 text-accent" />
              <span className="font-heading font-bold text-lg">AquaGuard Kenya</span>
            </Link>
            <p className="text-secondary-foreground/60 mb-6 max-w-md leading-relaxed">
              Real-time water monitoring and analysis platform for Kenya. 
              Making data-driven decisions accessible for a water-secure future.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-lg bg-secondary-foreground/10 flex items-center justify-center hover:bg-secondary-foreground/20 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-secondary-foreground/10 flex items-center justify-center hover:bg-secondary-foreground/20 transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-secondary-foreground/10 flex items-center justify-center hover:bg-secondary-foreground/20 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-sm uppercase tracking-wider mb-4 text-secondary-foreground/80">Quick Links</h4>
            <ul className="space-y-3">
              <li><Link to="/" className="text-secondary-foreground/55 hover:text-secondary-foreground transition-colors text-sm">Home</Link></li>
              <li><Link to="/dashboard" className="text-secondary-foreground/55 hover:text-secondary-foreground transition-colors text-sm">Dashboard</Link></li>
              <li><Link to="/auth" className="text-secondary-foreground/55 hover:text-secondary-foreground transition-colors text-sm">Sign Up</Link></li>
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h4 className="font-heading font-semibold text-sm uppercase tracking-wider mb-4 text-secondary-foreground/80">Resources</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-secondary-foreground/55 hover:text-secondary-foreground transition-colors text-sm">Documentation</a></li>
              <li><a href="#" className="text-secondary-foreground/55 hover:text-secondary-foreground transition-colors text-sm">API Reference</a></li>
              <li><a href="#" className="text-secondary-foreground/55 hover:text-secondary-foreground transition-colors text-sm">Research Papers</a></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="pt-8 border-t border-secondary-foreground/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-secondary-foreground/40 text-xs">
            © 2025 AquaGuard Kenya. Built for Environmental Awareness.
          </p>
          <p className="text-secondary-foreground/40 text-xs">
            Science Fair Project • Real-Time Environmental Monitoring
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
