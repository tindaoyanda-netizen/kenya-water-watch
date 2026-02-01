import { motion, AnimatePresence } from 'framer-motion';
import { CountyData, WaterSource, getWaterSourcesByCounty } from '@/data/aquaguardData';
import { 
  X, Droplets, Users, MapPin, TrendingUp, TrendingDown, Download, 
  AlertTriangle, CloudRain, Thermometer, Share2, Waves
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Button } from '@/components/ui/button';
import { generateCountyReport } from '@/utils/generateCountyReport';

interface RightDetailsPanelProps {
  county: CountyData | null;
  onClose: () => void;
}

const RightDetailsPanel = ({ county, onClose }: RightDetailsPanelProps) => {
  if (!county) return null;

  const waterSources = getWaterSourcesByCounty(county.id);
  
  const trendData = county.trend.map((value, index) => ({
    day: index + 1,
    availability: value,
  }));

  const forecastData = county.weather.forecast.map((f) => ({
    date: f.date.split('-')[2],
    rainfall: f.rainfall,
    condition: f.condition,
  }));

  const getRiskBadgeClass = (level: string) => {
    switch (level) {
      case 'stable': return 'status-stable';
      case 'moderate': return 'status-moderate';
      case 'severe': return 'status-severe';
      default: return 'bg-muted';
    }
  };

  const getFloodRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-success bg-success/10';
      case 'moderate': return 'text-warning bg-warning/10';
      case 'high': return 'text-destructive bg-destructive/10';
      case 'critical': return 'text-destructive bg-destructive/20';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getSourceIcon = (type: WaterSource['type']) => {
    switch (type) {
      case 'reservoir': return '🏞️';
      case 'river': return '🌊';
      case 'borehole': return '🕳️';
      case 'kiosk': return '🚰';
    }
  };

  const getStatusColor = (status: WaterSource['status']) => {
    switch (status) {
      case 'normal': return 'bg-success';
      case 'low': return 'bg-warning';
      case 'critical': return 'bg-destructive';
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
        className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-card border-l border-border shadow-2xl z-50 overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border p-4 z-10">
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
          
          <div className="flex gap-2 mt-3">
            <Button 
              onClick={() => generateCountyReport(county)} 
              variant="outline" 
              size="sm"
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-5">
          {/* Risk & Flood Badges */}
          <div className="flex gap-2 flex-wrap">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${getRiskBadgeClass(county.riskLevel)}`}>
              {county.riskLevel === 'severe' ? '⚠️' : county.riskLevel === 'moderate' ? '⚡' : '✓'}
              Water: {county.riskLevel.charAt(0).toUpperCase() + county.riskLevel.slice(1)}
            </div>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getFloodRiskColor(county.floodRisk.riskLevel)}`}>
              <Waves className="w-4 h-4" />
              Flood: {county.floodRisk.riskLevel.toUpperCase()}
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Droplets className="w-4 h-4" />
                <span className="text-sm">Availability</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{county.waterAvailability}%</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">Stress Score</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{county.waterStress}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Thermometer className="w-4 h-4" />
                <span className="text-sm">Temperature</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{county.weather.temperature}°C</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Users className="w-4 h-4" />
                <span className="text-sm">Population</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{(county.population / 1000000).toFixed(1)}M</p>
            </div>
          </div>

          {/* Water Sources */}
          <div>
            <h3 className="font-heading font-semibold mb-3">Water Sources</h3>
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="text-center p-2 bg-primary/10 rounded-lg">
                <p className="text-lg font-bold text-primary">{county.waterSources.reservoirs}</p>
                <p className="text-[10px] text-muted-foreground">Reservoirs</p>
              </div>
              <div className="text-center p-2 bg-accent/10 rounded-lg">
                <p className="text-lg font-bold text-accent">{county.waterSources.rivers}</p>
                <p className="text-[10px] text-muted-foreground">Rivers</p>
              </div>
              <div className="text-center p-2 bg-secondary/10 rounded-lg">
                <p className="text-lg font-bold text-secondary">{county.waterSources.boreholes}</p>
                <p className="text-[10px] text-muted-foreground">Boreholes</p>
              </div>
              <div className="text-center p-2 bg-muted rounded-lg">
                <p className="text-lg font-bold text-foreground">{county.waterSources.kiosks}</p>
                <p className="text-[10px] text-muted-foreground">Kiosks</p>
              </div>
            </div>

            {/* Nearby Sources List */}
            {waterSources.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {waterSources.map((source) => (
                  <div key={source.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <span>{getSourceIcon(source.type)}</span>
                      <span className="font-medium">{source.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{source.currentLevel}%</span>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(source.status)}`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Water Availability Trend */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-semibold">30-Day Availability Trend</h3>
              <div className={`flex items-center gap-1 text-sm ${trendDirection ? 'text-success' : 'text-destructive'}`}>
                {trendDirection ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {trendDirection ? 'Improving' : 'Declining'}
              </div>
            </div>
            <div className="h-32 bg-muted/30 rounded-xl p-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="availabilityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="availability" stroke="hsl(var(--primary))" fill="url(#availabilityGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rainfall Forecast */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CloudRain className="w-4 h-4 text-accent" />
              <h3 className="font-heading font-semibold">3-Day Rainfall Forecast</h3>
            </div>
            <div className="h-28 bg-muted/30 rounded-xl p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={forecastData}>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="rainfall" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Flood Precautions */}
          {county.floodRisk.riskLevel !== 'low' && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Waves className="w-5 h-5 text-destructive" />
                <h4 className="font-heading font-semibold text-destructive">Flood Precautions</h4>
              </div>
              <ul className="space-y-2">
                {county.floodRisk.precautions.map((precaution, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-destructive">•</span>
                    <span>{precaution}</span>
                  </li>
                ))}
              </ul>
              {county.floodRisk.predictedDate && (
                <p className="text-xs text-destructive mt-3 font-medium">
                  ⚠️ Predicted: {new Date(county.floodRisk.predictedDate).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Science Explanation */}
          <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-4 border border-primary/10">
            <h4 className="font-heading font-semibold mb-2 flex items-center gap-2">
              📊 Understanding the Data
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>Water Stress Score (0-100)</strong> measures the ratio of water demand to supply. 
              Scores above 70 indicate severe stress. <strong>Flood Risk</strong> is calculated from 
              rainfall forecasts, terrain analysis, and water source levels using predictive modeling.
            </p>
          </div>

          {/* Coordinates */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground pb-4">
            <MapPin className="w-4 h-4" />
            <span>Lat: {county.coordinates.lat.toFixed(4)}, Lng: {county.coordinates.lng.toFixed(4)}</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RightDetailsPanel;
