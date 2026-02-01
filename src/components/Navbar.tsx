import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Droplets, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isHome ? 'bg-transparent' : 'bg-card/90 backdrop-blur-lg border-b border-border'
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Droplets className={`w-8 h-8 transition-colors ${isHome ? 'text-white' : 'text-primary'}`} />
              <div className="absolute inset-0 bg-accent/30 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className={`font-heading font-bold text-xl ${isHome ? 'text-white' : 'text-foreground'}`}>
              AquaGuard Kenya
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              to="/" 
              className={`font-medium transition-colors ${isHome ? 'text-white/80 hover:text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Home
            </Link>
            <Link 
              to="/dashboard" 
              className={`font-medium transition-colors ${isHome ? 'text-white/80 hover:text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Dashboard
            </Link>
            <Link to="/auth">
              <Button variant={isHome ? 'glass' : 'default'} size="lg">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <X className={`w-6 h-6 ${isHome ? 'text-white' : 'text-foreground'}`} />
            ) : (
              <Menu className={`w-6 h-6 ${isHome ? 'text-white' : 'text-foreground'}`} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-card/95 backdrop-blur-lg border-b border-border"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              <Link 
                to="/" 
                onClick={() => setIsOpen(false)}
                className="font-medium text-foreground py-2"
              >
                Home
              </Link>
              <Link 
                to="/dashboard" 
                onClick={() => setIsOpen(false)}
                className="font-medium text-foreground py-2"
              >
                Dashboard
              </Link>
              <Link to="/auth" onClick={() => setIsOpen(false)}>
                <Button variant="default" size="lg" className="w-full">
                  Get Started
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
