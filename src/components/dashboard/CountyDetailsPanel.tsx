import { motion, AnimatePresence } from 'framer-motion';
import { CountyData } from '@/data/aquaguardData';
import { X, Droplets, Users, MapPin, TrendingUp, TrendingDown, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { generateCountyReport } from '@/utils/generateCountyReport';

interface CountyDetailsPanelProps {
  county: CountyData | null;
  onClose: () => void;
}

const CountyDetailsPanel = ({ county, onClose }: CountyDetailsPanelProps) => {
  if (!county) return null;

  const trendData = county.trend.map((value, index) => ({
    day: index + 1,
    availability: value,
  }));

  const getRiskBadgeClass = (level: string) => {
    switch (level) {
      case 'stable': return 'status-stable';
      case 'moderate': return 'status-moderate';
      case 'severe': return 'status-severe';
      default: return 'bg-muted';
    }
  };

  const trendDirection = county.trend[county.trend.length - 1] > county.trend[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-full w-full sm:w-96 bg-card border-l border-border shadow-2xl z-50 overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                county.riskLevel === 'stable' ? 'bg-success' :
                county.riskLevel === 'moderate' ? 'bg-warning' : 'bg-destructive'
              }`} />
              <h2 className="font-heading text-xl font-bold">{county.name} County</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <Button 
            onClick={() => generateCountyReport(county)} 
            variant="outline" 
            size="sm" 
            className="mt-3 w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF Report
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Risk Badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${getRiskBadgeClass(county.riskLevel)}`}>
            {county.riskLevel === 'severe' ? '⚠️' : county.riskLevel === 'moderate' ? '⚡' : '✓'}
            {county.riskLevel.charAt(0).toUpperCase() + county.riskLevel.slice(1)} Risk
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Droplets className="w-4 h-4" />
                <span className="text-sm">Availability</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{county.waterAvailability}%</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Users className="w-4 h-4" />
                <span className="text-sm">Population</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{(county.population / 1000000).toFixed(1)}M</p>
            </div>
          </div>

          {/* Water Stress */}
          <div className="bg-muted/30 rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-2">Water Stress Score</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    county.waterStress <= 40 ? 'bg-success' :
                    county.waterStress <= 70 ? 'bg-warning' : 'bg-destructive'
                  }`}
                  style={{ width: `${county.waterStress}%` }}
                />
              </div>
              <span className="font-bold text-lg">{county.waterStress}</span>
            </div>
          </div>

          {/* Water Sources */}
          <div>
            <h3 className="font-heading font-semibold mb-3">Water Sources</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-primary/10 rounded-xl">
                <p className="text-2xl font-bold text-primary">{county.waterSources.reservoirs}</p>
                <p className="text-xs text-muted-foreground">Reservoirs</p>
              </div>
              <div className="text-center p-3 bg-accent/10 rounded-xl">
                <p className="text-2xl font-bold text-accent">{county.waterSources.rivers}</p>
                <p className="text-xs text-muted-foreground">Rivers</p>
              </div>
              <div className="text-center p-3 bg-secondary/10 rounded-xl">
                <p className="text-2xl font-bold text-secondary">{county.waterSources.boreholes}</p>
                <p className="text-xs text-muted-foreground">Boreholes</p>
              </div>
            </div>
          </div>

          {/* 30-Day Trend Chart */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-semibold">30-Day Trend</h3>
              <div className={`flex items-center gap-1 text-sm ${trendDirection ? 'text-success' : 'text-destructive'}`}>
                {trendDirection ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {trendDirection ? 'Improving' : 'Declining'}
              </div>
            </div>
            <div className="h-40 bg-muted/30 rounded-xl p-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelFormatter={(value) => `Day ${value}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="availability" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Science Explanation */}
          <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-4 border border-primary/10">
            <h4 className="font-heading font-semibold mb-2 flex items-center gap-2">
              📊 Understanding Water Stress
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The Water Stress Score (0-100) measures the ratio of water demand to available supply. 
              Scores above 70 indicate severe stress where water withdrawal exceeds sustainable limits, 
              affecting agriculture, industry, and domestic use.
            </p>
          </div>

          {/* Coordinates */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>Lat: {county.coordinates.lat.toFixed(4)}, Lng: {county.coordinates.lng.toFixed(4)}</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CountyDetailsPanel;
