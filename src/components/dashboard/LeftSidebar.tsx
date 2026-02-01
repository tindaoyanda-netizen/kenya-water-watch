import { useState } from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { 
  CloudRain, 
  Droplets, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  Waves,
  Thermometer
} from 'lucide-react';
import { CountyData } from '@/data/aquaguardData';

interface LeftSidebarProps {
  timeRange: '7' | '30' | '90';
  onTimeRangeChange: (range: '7' | '30' | '90') => void;
  rainfall: number;
  consumption: number;
  onRainfallChange: (value: number) => void;
  onConsumptionChange: (value: number) => void;
  showWeatherOverlay: boolean;
  onWeatherOverlayChange: (show: boolean) => void;
  showFloodOverlay: boolean;
  onFloodOverlayChange: (show: boolean) => void;
  selectedCounty: CountyData | null;
  nationalStats: {
    avgWaterAvailability: number;
    avgWaterStress: number;
    avgRainfall: number;
    highFloodRisk: number;
  };
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const LeftSidebar = ({
  timeRange,
  onTimeRangeChange,
  rainfall,
  consumption,
  onRainfallChange,
  onConsumptionChange,
  showWeatherOverlay,
  onWeatherOverlayChange,
  showFloodOverlay,
  onFloodOverlayChange,
  selectedCounty,
  nationalStats,
  isCollapsed,
  onToggleCollapse,
}: LeftSidebarProps) => {
  const data = selectedCounty || {
    waterAvailability: nationalStats.avgWaterAvailability,
    waterStress: nationalStats.avgWaterStress,
    recentRainfall: nationalStats.avgRainfall,
    weather: { temperature: 25 },
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

  if (isCollapsed) {
    return (
      <motion.aside
        initial={{ width: 64 }}
        animate={{ width: 64 }}
        className="fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card border-r border-border z-30 flex flex-col items-center py-4"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="mb-4"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
        
        {/* Mini metric icons */}
        <div className="flex flex-col gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Droplets className={`w-5 h-5 ${getAvailabilityColor(data.waterAvailability)}`} />
          </div>
          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
            <AlertTriangle className={`w-5 h-5 ${getStressColor(data.waterStress)}`} />
          </div>
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <CloudRain className="w-5 h-5 text-accent" />
          </div>
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
            <Waves className="w-5 h-5 text-destructive" />
          </div>
        </div>
      </motion.aside>
    );
  }

  return (
    <motion.aside
      initial={{ width: 320 }}
      animate={{ width: 320 }}
      className="fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card border-r border-border z-30 overflow-y-auto"
    >
      <div className="p-4 space-y-5">
        {/* Collapse Button */}
        <div className="flex justify-end">
          <Button variant="ghost" size="icon" onClick={onToggleCollapse}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>

        {/* Time Range Selector */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Time Range</label>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {(['7', '30', '90'] as const).map((range) => (
              <button
                key={range}
                onClick={() => onTimeRangeChange(range)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  timeRange === range 
                    ? 'bg-card shadow text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {range}d
              </button>
            ))}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-muted/50 rounded-xl p-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <Droplets className={`w-4 h-4 ${getAvailabilityColor(data.waterAvailability)}`} />
              <span className="text-xs text-muted-foreground">Availability</span>
            </div>
            <p className={`text-xl font-bold ${getAvailabilityColor(data.waterAvailability)}`}>
              {data.waterAvailability}%
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-muted/50 rounded-xl p-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className={`w-4 h-4 ${getStressColor(data.waterStress)}`} />
              <span className="text-xs text-muted-foreground">Stress Score</span>
            </div>
            <p className={`text-xl font-bold ${getStressColor(data.waterStress)}`}>
              {data.waterStress}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-muted/50 rounded-xl p-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <CloudRain className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Rainfall</span>
            </div>
            <p className="text-xl font-bold text-accent">
              {data.recentRainfall}mm
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-muted/50 rounded-xl p-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <Waves className="w-4 h-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Flood Alerts</span>
            </div>
            <p className="text-xl font-bold text-destructive">
              {nationalStats.highFloodRisk}
            </p>
          </motion.div>
        </div>

        {/* Overlay Toggles */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">Map Overlays</label>
          
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-warning" />
              <span className="text-sm">Weather Overlay</span>
            </div>
            <Switch
              checked={showWeatherOverlay}
              onCheckedChange={onWeatherOverlayChange}
            />
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Waves className="w-4 h-4 text-primary" />
              <span className="text-sm">Flood Risk Overlay</span>
            </div>
            <Switch
              checked={showFloodOverlay}
              onCheckedChange={onFloodOverlayChange}
            />
          </div>
        </div>

        {/* Scenario Simulation */}
        <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-4 border border-primary/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-sm">Scenario Simulation</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onRainfallChange(50);
                onConsumptionChange(50);
              }}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          </div>

          {/* Rainfall Slider */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium">Rainfall</span>
              </div>
              <span className={`text-xs font-bold ${
                rainfall > 50 ? 'text-success' : rainfall < 50 ? 'text-destructive' : 'text-muted-foreground'
              }`}>
                {rainfall > 50 ? '+' : ''}{rainfall - 50}%
              </span>
            </div>
            <Slider
              value={[rainfall]}
              onValueChange={([v]) => onRainfallChange(v)}
              min={0}
              max={100}
              step={5}
            />
          </div>

          {/* Consumption Slider */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-medium">Consumption</span>
              </div>
              <span className={`text-xs font-bold ${
                consumption > 50 ? 'text-destructive' : consumption < 50 ? 'text-success' : 'text-muted-foreground'
              }`}>
                {consumption > 50 ? '+' : ''}{consumption - 50}%
              </span>
            </div>
            <Slider
              value={[consumption]}
              onValueChange={([v]) => onConsumptionChange(v)}
              min={0}
              max={100}
              step={5}
            />
          </div>

          {/* Impact Preview */}
          <div className="bg-card rounded-lg p-3 border border-border">
            <p className="text-xs font-medium mb-2">Predicted Impact</p>
            <div className="flex gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground">Availability</p>
                <p className={`text-sm font-bold ${
                  (rainfall - 50) - (consumption - 50) > 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {((rainfall - 50) * 0.4 - (consumption - 50) * 0.3).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Stress</p>
                <p className={`text-sm font-bold ${
                  (consumption - 50) - (rainfall - 50) > 0 ? 'text-destructive' : 'text-success'
                }`}>
                  {((consumption - 50) * 0.5 - (rainfall - 50) * 0.3).toFixed(1)} pts
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* County Info */}
        {selectedCounty && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
            Showing data for <span className="font-medium text-foreground">{selectedCounty.name}</span>
          </div>
        )}
      </div>
    </motion.aside>
  );
};

export default LeftSidebar;
