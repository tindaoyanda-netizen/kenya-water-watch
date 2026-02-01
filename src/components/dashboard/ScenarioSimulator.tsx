import { useState } from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { CloudRain, Droplets, RefreshCw } from 'lucide-react';
import { CountyData } from '@/data/aquaguardData';

interface ScenarioSimulatorProps {
  onSimulate: (rainfall: number, consumption: number) => void;
}

const ScenarioSimulator = ({ onSimulate }: ScenarioSimulatorProps) => {
  const [rainfall, setRainfall] = useState(50);
  const [consumption, setConsumption] = useState(50);

  const handleReset = () => {
    setRainfall(50);
    setConsumption(50);
    onSimulate(50, 50);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-6 border border-primary/10"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-heading text-lg font-semibold">Scenario Simulator</h3>
          <p className="text-sm text-muted-foreground">Adjust parameters to see predicted impact</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      <div className="space-y-6">
        {/* Rainfall Slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Rainfall Change</span>
            </div>
            <span className={`text-sm font-bold ${
              rainfall > 50 ? 'text-success' : rainfall < 50 ? 'text-destructive' : 'text-muted-foreground'
            }`}>
              {rainfall > 50 ? '+' : ''}{rainfall - 50}%
            </span>
          </div>
          <Slider
            value={[rainfall]}
            onValueChange={([value]) => {
              setRainfall(value);
              onSimulate(value, consumption);
            }}
            min={0}
            max={100}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Drought</span>
            <span>Normal</span>
            <span>Heavy Rain</span>
          </div>
        </div>

        {/* Consumption Slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">Water Consumption</span>
            </div>
            <span className={`text-sm font-bold ${
              consumption > 50 ? 'text-destructive' : consumption < 50 ? 'text-success' : 'text-muted-foreground'
            }`}>
              {consumption > 50 ? '+' : ''}{consumption - 50}%
            </span>
          </div>
          <Slider
            value={[consumption]}
            onValueChange={([value]) => {
              setConsumption(value);
              onSimulate(rainfall, value);
            }}
            min={0}
            max={100}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Conservation</span>
            <span>Normal</span>
            <span>High Usage</span>
          </div>
        </div>

        {/* Impact Preview */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-sm font-medium mb-2">Predicted Impact</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Availability Change</p>
              <p className={`text-lg font-bold ${
                (rainfall - 50) - (consumption - 50) > 0 ? 'text-success' : 'text-destructive'
              }`}>
                {((rainfall - 50) * 0.4 - (consumption - 50) * 0.3).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Stress Impact</p>
              <p className={`text-lg font-bold ${
                (consumption - 50) - (rainfall - 50) > 0 ? 'text-destructive' : 'text-success'
              }`}>
                {((consumption - 50) * 0.5 - (rainfall - 50) * 0.3).toFixed(1)} pts
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ScenarioSimulator;
