import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Droplets, Mail, Lock, User, ArrowRight, Eye, EyeOff, MapPin, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { getCountyByCoordinates, getTownByCoordinates } from '@/data/aquaguardData';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<{ town: string; county: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    userType: 'student',
  });
  const navigate = useNavigate();

  const detectLocation = () => {
    setIsDetectingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Store coordinates
          localStorage.setItem('ag_location', JSON.stringify({
            lat: latitude,
            lng: longitude,
          }));
          
          // Find nearest county and town
          const county = getCountyByCoordinates(latitude, longitude);
          const town = getTownByCoordinates(latitude, longitude);
          
          if (county) {
            setDetectedLocation({
              town: town?.name || county.towns[0]?.name || 'Unknown',
              county: county.name
            });
          }
          
          setIsDetectingLocation(false);
        },
        () => {
          setIsDetectingLocation(false);
          // Default to Nairobi
          setDetectedLocation({ town: 'Westlands', county: 'Nairobi' });
        }
      );
    } else {
      setIsDetectingLocation(false);
      setDetectedLocation({ town: 'Westlands', county: 'Nairobi' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate authentication
    localStorage.setItem('ag_user', JSON.stringify({
      name: formData.name || 'User',
      email: formData.email,
      userType: formData.userType,
    }));
    
    // Request geolocation if not already detected
    if (!detectedLocation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            localStorage.setItem('ag_location', JSON.stringify({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }));
            navigate('/dashboard');
          },
          () => {
            navigate('/dashboard');
          }
        );
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="min-h-screen flex items-center justify-center px-4 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4">
              <Droplets className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isLogin ? 'Sign in to AquaGuard Kenya' : 'Join AquaGuard Kenya today'}
            </p>
          </div>
          
          {/* Form Card */}
          <div className="card-glass p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Field (Sign Up only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your name"
                      className="pl-10"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}
              
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              {/* User Type (Sign Up only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label>I am a...</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {['student', 'teacher', 'planner'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, userType: type })}
                        className={`py-2 px-3 rounded-lg border text-sm font-medium capitalize transition-all ${
                          formData.userType === type
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Location Detection */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label>Your Location</Label>
                  {detectedLocation ? (
                    <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
                      <MapPin className="w-5 h-5 text-success" />
                      <span className="text-sm font-medium text-success">
                        {detectedLocation.town}, {detectedLocation.county}
                      </span>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={detectLocation}
                      disabled={isDetectingLocation}
                    >
                      {isDetectingLocation ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Detecting...
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4 mr-2" />
                          Detect My Location
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
              
              {/* Submit Button */}
              <Button type="submit" variant="hero" size="lg" className="w-full group">
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>
            
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-4 text-muted-foreground">or</span>
              </div>
            </div>
            
            {/* Toggle Auth Mode */}
            <p className="text-center text-muted-foreground">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-medium hover:underline"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
          
          {/* Location Notice */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            📍 We'll personalize water & weather insights for your location
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
