import { motion } from 'framer-motion';
import { getNationalStats } from '@/data/kenyaCounties';

const StatsSection = () => {
  const stats = getNationalStats();

  const statItems = [
    { value: `${stats.avgWaterAvailability}%`, label: 'Avg Water Availability', subtext: 'Across all counties' },
    { value: stats.severeCount.toString(), label: 'Counties at Severe Risk', subtext: 'Requiring immediate attention' },
    { value: `${stats.avgRainfall}mm`, label: 'Average Rainfall', subtext: 'Last 30 days' },
    { value: '47', label: 'Counties Monitored', subtext: 'Real-time data coverage' },
  ];

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-primary via-primary to-water-dark relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full border border-white" />
        <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full border border-white" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 rounded-full border border-white" />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {statItems.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl sm:text-5xl font-heading font-bold text-white mb-2">
                {stat.value}
              </div>
              <div className="text-white/90 font-medium mb-1">{stat.label}</div>
              <div className="text-white/60 text-sm">{stat.subtext}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default StatsSection;
