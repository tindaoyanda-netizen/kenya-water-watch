import { motion } from 'framer-motion';
import { Brain, Users, Shield, AlertTriangle, BarChart3, Sparkles } from 'lucide-react';

const TransparencySection = () => {
  return (
    <section className="py-20 lg:py-28 bg-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-gradient-to-br from-primary to-accent blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-gradient-to-tr from-secondary to-primary blur-3xl" />
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">Human-AI Collaboration</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Transparent, Ethical &{' '}
            <span className="gradient-text">Science-Driven</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Our AI-assisted system is designed to support human decision-making, not replace it. 
            We believe in transparency about our methods, limitations, and the role of technology.
          </p>
        </motion.div>

        {/* Core Principles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {[
            {
              icon: Brain,
              title: 'AI as Advisor, Not Authority',
              description: 'Our AI analyzes community reports and environmental data to provide confidence scores and insights. However, final verification decisions are always made by trained County Admins who understand local context.',
              color: 'from-primary to-primary/70',
            },
            {
              icon: Users,
              title: 'Community-Powered Data',
              description: 'Environmental reports come directly from residents experiencing conditions on the ground. This crowdsourced approach provides real-time, localized information that satellite data alone cannot capture.',
              color: 'from-accent to-secondary',
            },
            {
              icon: Shield,
              title: 'Role-Based Governance',
              description: 'County Admins can only verify reports within their jurisdiction. This ensures accountability and prevents unauthorized changes to data that affects local communities.',
              color: 'from-secondary to-accent',
            },
          ].map((principle, index) => (
            <motion.div
              key={principle.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="card-glass p-6"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${principle.color} flex items-center justify-center mb-4`}>
                <principle.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                {principle.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {principle.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Limitations & Accuracy Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-card rounded-2xl border border-border p-6 lg:p-8"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-warning" />
            </div>
            <div>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                Acknowledging System Limitations
              </h3>
              <p className="text-muted-foreground">
                No predictive system is perfect. We are committed to being transparent about what our system can and cannot do.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Accuracy Metrics
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-success mt-2 shrink-0" />
                  <span><strong>Duplicate Detection:</strong> ~85% accuracy in identifying similar reports within 500m radius</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning mt-2 shrink-0" />
                  <span><strong>AI Confidence Scoring:</strong> Correlates with admin verification ~72% of the time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span><strong>Flood Predictions:</strong> Based on historical patterns and current weather data</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                Known Limitations
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 shrink-0" />
                  <span>Weather data relies on regional stations; hyperlocal variations may not be captured</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 shrink-0" />
                  <span>AI cannot verify the physical accuracy of reports without human review</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 shrink-0" />
                  <span>System effectiveness depends on active community participation</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
            <p className="text-sm text-muted-foreground text-center">
              <strong className="text-foreground">Science Fair Note:</strong> This system demonstrates the potential of 
              human-AI collaboration in environmental monitoring. Real-world deployment would require extensive 
              validation, integration with official meteorological services, and community training programs.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TransparencySection;
