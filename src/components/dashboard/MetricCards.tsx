import { motion } from 'framer-motion';
import { CountyData } from '@/data/kenyaCounties';
import { Droplets, AlertTriangle, TrendingUp, CloudRain } from 'lucide-react';

interface MetricCardsProps {
  selectedCounty: CountyData | null;
  nationalStats: {
    avgWaterAvailability: number;
    avgWaterStress: number;
    avgRainfall: number;
  };
}

const MetricCards = ({ selectedCounty, nationalStats }: MetricCardsProps) => {
  const data = selectedCounty || {
    waterAvailability: nationalStats.avgWaterAvailability,
    waterStress: nationalStats.avgWaterStress,
    recentRainfall: nationalStats.avgRainfall,
    riskLevel: 'moderate' as const,
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'stable': return 'text-success';
      case 'moderate': return 'text-warning';
      case 'severe': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getAvailabilityColor = (value: number) => {
    if (value >= 70) return 'text-success';
    if (value >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const getStressColor = (value: number) => {
    if (value <= 40) return 'text-success';
    if (value <= 70) return 'text-warning';
    return 'text-destructive';
  };

  const metrics = [
    {
      icon: Droplets,
      label: 'Water Availability',
      value: `${data.waterAvailability}%`,
      sublabel: selectedCounty ? selectedCounty.name : 'National Average',
      color: getAvailabilityColor(data.waterAvailability),
      bgColor: 'bg-primary/10',
    },
    {
      icon: AlertTriangle,
      label: 'Water Stress Score',
      value: data.waterStress,
      sublabel: data.waterStress > 70 ? 'High Stress' : data.waterStress > 40 ? 'Moderate' : 'Low Stress',
      color: getStressColor(data.waterStress),
      bgColor: 'bg-warning/10',
    },
    {
      icon: CloudRain,
      label: 'Recent Rainfall',
      value: `${data.recentRainfall}mm`,
      sublabel: 'Last 30 days',
      color: data.recentRainfall > 50 ? 'text-success' : data.recentRainfall > 25 ? 'text-warning' : 'text-destructive',
      bgColor: 'bg-accent/10',
    },
    {
      icon: TrendingUp,
      label: 'Risk Level',
      value: data.riskLevel?.toUpperCase() || 'N/A',
      sublabel: 'Current assessment',
      color: getRiskColor(data.riskLevel || 'moderate'),
      bgColor: 'bg-secondary/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          className="card-metric group"
        >
          <div className={`w-10 h-10 rounded-lg ${metric.bgColor} flex items-center justify-center mb-3`}>
            <metric.icon className={`w-5 h-5 ${metric.color}`} />
          </div>
          <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
          <p className={`text-2xl font-heading font-bold ${metric.color}`}>
            {metric.value}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{metric.sublabel}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default MetricCards;
