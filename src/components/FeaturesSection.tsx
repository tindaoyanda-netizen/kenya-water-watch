import { motion } from 'framer-motion';
import { Droplets, BarChart3, Globe, MapPin, TrendingUp, Shield } from 'lucide-react';

const features = [
  {
    icon: Droplets,
    title: 'Real-Time Water Availability',
    description: 'Monitor rivers, reservoirs, and boreholes across all 47 counties with live data updates.',
    color: 'from-primary to-primary/70',
  },
  {
    icon: BarChart3,
    title: 'Personalized Dashboard',
    description: 'Auto-detects your location to provide relevant water data and insights for your area.',
    color: 'from-accent to-secondary',
  },
  {
    icon: Globe,
    title: 'Science & Impact Insights',
    description: 'Trend analysis, scenario simulation, and predictive modeling for informed decisions.',
    color: 'from-secondary to-accent',
  },
];

const additionalFeatures = [
  {
    icon: MapPin,
    title: 'Location-Based Alerts',
    description: 'Get notified about water stress changes in your county.',
  },
  {
    icon: TrendingUp,
    title: 'Predictive Analytics',
    description: 'AI-powered forecasts for water availability trends.',
  },
  {
    icon: Shield,
    title: 'Data Security',
    description: 'Your location data is encrypted and private.',
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 lg:py-32 bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--primary)) 1px, transparent 1px),
                           radial-gradient(circle at 75% 75%, hsl(var(--accent)) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Empowering Water{' '}
            <span className="gradient-text">Intelligence</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Advanced monitoring tools designed to help you understand and manage Kenya's water resources effectively.
          </p>
        </motion.div>
        
        {/* Main Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="card-glass p-8 h-full hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                
                {/* Content */}
                <h3 className="font-heading text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Additional Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid sm:grid-cols-3 gap-6"
        >
          {additionalFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
