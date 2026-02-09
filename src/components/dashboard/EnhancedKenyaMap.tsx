import { CountyData, WaterSource, waterSources } from '@/data/aquaguardData';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface EnhancedKenyaMapProps {
  counties: CountyData[];
  onCountySelect: (county: CountyData) => void;
  selectedCounty: CountyData | null;
  userLocation?: { lat: number; lng: number } | null;
  showWeatherOverlay: boolean;
  showFloodOverlay: boolean;
  simulationRainfall: number;
  simulationConsumption: number;
}

const EnhancedKenyaMap = ({ 
  counties,
  onCountySelect, 
  selectedCounty,
  userLocation,
  showWeatherOverlay,
  showFloodOverlay,
  simulationRainfall,
  simulationConsumption,
}: EnhancedKenyaMapProps) => {
  
  // Calculate simulated risk level based on sliders
  const getSimulatedRiskLevel = (county: CountyData) => {
    const rainfallChange = (simulationRainfall - 50) / 100;
    const consumptionChange = (simulationConsumption - 50) / 100;
    const adjustedStress = county.waterStress + (consumptionChange * 20) - (rainfallChange * 15);
    
    if (adjustedStress <= 40) return 'stable';
    if (adjustedStress <= 70) return 'moderate';
    return 'severe';
  };

  const getRiskColor = (county: CountyData) => {
    const level = getSimulatedRiskLevel(county);
    switch (level) {
      case 'stable': return 'fill-success/80 hover:fill-success';
      case 'moderate': return 'fill-warning/80 hover:fill-warning';
      case 'severe': return 'fill-destructive/80 hover:fill-destructive';
      default: return 'fill-muted';
    }
  };

  const getFloodRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'stroke-success';
      case 'moderate': return 'stroke-warning';
      case 'high': return 'stroke-destructive';
      case 'critical': return 'stroke-destructive stroke-[3]';
      default: return 'stroke-muted';
    }
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return '☀️';
      case 'cloudy': return '☁️';
      case 'rain': return '🌧️';
      case 'heavy_rain': return '⛈️';
      case 'storm': return '🌩️';
      default: return '☁️';
    }
  };

  // County positions for visual representation (simplified)
  const countyPositions: Record<string, { x: number; y: number; size: number }> = {
    turkana: { x: 150, y: 80, size: 50 },
    mandera: { x: 290, y: 100, size: 38 },
    wajir: { x: 275, y: 165, size: 42 },
    garissa: { x: 255, y: 235, size: 40 },
    mombasa: { x: 235, y: 355, size: 28 },
    kilifi: { x: 235, y: 315, size: 32 },
    nairobi: { x: 175, y: 275, size: 32 },
    kiambu: { x: 170, y: 248, size: 28 },
    nakuru: { x: 145, y: 225, size: 35 },
    uasingishu: { x: 122, y: 165, size: 32 },
    kisumu: { x: 102, y: 205, size: 30 },
    kakamega: { x: 98, y: 172, size: 30 },
    meru: { x: 205, y: 198, size: 32 },
    nyeri: { x: 180, y: 218, size: 28 },
    machakos: { x: 195, y: 290, size: 30 },
    kajiado: { x: 165, y: 315, size: 38 },
    siaya: { x: 82, y: 195, size: 28 },
  };

  // Water source pin positions (relative to county)
  const getWaterSourcePosition = (source: WaterSource, countyPos: { x: number; y: number }) => {
    const offset = {
      x: (source.coordinates.lng % 1) * 30 - 15,
      y: (source.coordinates.lat % 1) * 30 - 15
    };
    return {
      x: countyPos.x + offset.x,
      y: countyPos.y + offset.y
    };
  };

  const getSourcePinColor = (status: WaterSource['status']) => {
    switch (status) {
      case 'normal': return 'fill-success';
      case 'low': return 'fill-warning';
      case 'critical': return 'fill-destructive';
    }
  };

  return (
    <div className="relative bg-muted/30 rounded-2xl p-4 h-full min-h-[500px]">
      <svg 
        viewBox="0 0 380 440" 
        className="w-full h-full"
        style={{ maxHeight: '600px' }}
      >
        {/* Kenya outline (simplified) */}
        <path
          d="M80,50 L120,30 L200,30 L280,50 L330,100 L340,185 L310,285 L270,390 L225,410 L165,400 L130,345 L80,285 L60,205 L70,125 Z"
          className="fill-muted stroke-border stroke-2"
        />
        
        {/* County markers */}
        {counties.map((county) => {
          const pos = countyPositions[county.id];
          if (!pos) return null;
          
          const isSelected = selectedCounty?.id === county.id;
          
          return (
            <g key={county.id}>
              {/* Flood risk ring */}
              {showFloodOverlay && county.floodRisk.riskLevel !== 'low' && (
                <motion.circle
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.6 }}
                  cx={pos.x}
                  cy={pos.y}
                  r={pos.size / 2 + 8}
                  className={`fill-none ${getFloodRiskColor(county.floodRisk.riskLevel)} stroke-dashed`}
                  strokeDasharray="4 2"
                />
              )}
              
              {/* Main county circle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.circle
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: Math.random() * 0.3 }}
                    cx={pos.x}
                    cy={pos.y}
                    r={pos.size / 2}
                    className={`${getRiskColor(county)} cursor-pointer transition-all duration-300 ${
                      isSelected ? 'stroke-foreground stroke-[3]' : 'stroke-background stroke-2'
                    }`}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onCountySelect(county)}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px]">
                  <div className="text-sm">
                    <p className="font-bold">{county.name}</p>
                    <p>Water: {county.waterAvailability}%</p>
                    <p>Stress: {county.waterStress}</p>
                    {county.floodRisk.riskLevel !== 'low' && (
                      <p className="text-destructive">Flood Risk: {county.floodRisk.riskLevel}</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
              
              {/* Weather icon overlay */}
              {showWeatherOverlay && (
                <text
                  x={pos.x + pos.size / 2}
                  y={pos.y - pos.size / 2}
                  fontSize="12"
                  textAnchor="middle"
                  className="pointer-events-none"
                >
                  {getWeatherIcon(county.weather.forecast[0]?.condition || 'cloudy')}
                </text>
              )}
              
              {/* Pulse animation for severe risk */}
              {getSimulatedRiskLevel(county) === 'severe' && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={pos.size / 2}
                  className="fill-none stroke-destructive animate-ping opacity-50"
                  strokeWidth={2}
                />
              )}
              
              {/* County label */}
              <text
                x={pos.x}
                y={pos.y + pos.size / 2 + 14}
                textAnchor="middle"
                className="fill-foreground text-[9px] font-medium pointer-events-none"
              >
                {county.name}
              </text>
            </g>
          );
        })}
        
        {/* Water source pins */}
        {waterSources.map((source) => {
          const countyPos = countyPositions[source.countyId];
          if (!countyPos) return null;
          
          const pos = getWaterSourcePosition(source, countyPos);
          
          return (
            <Tooltip key={source.id}>
              <TooltipTrigger asChild>
                <motion.g
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + Math.random() * 0.3 }}
                  className="cursor-pointer"
                >
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={4}
                    className={`${getSourcePinColor(source.status)} stroke-background stroke-1`}
                  />
                </motion.g>
              </TooltipTrigger>
              <TooltipContent side="top">
                <div className="text-xs">
                  <p className="font-bold">{source.name}</p>
                  <p className="capitalize">{source.type}</p>
                  <p>Level: {source.currentLevel}%</p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
        
        {/* User location pin */}
        {userLocation && (
          <motion.g
            initial={{ scale: 0, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', delay: 0.8 }}
          >
            <circle
              cx={175}
              cy={275}
              r={8}
              className="fill-primary stroke-white stroke-2"
            />
            <circle
              cx={175}
              cy={275}
              r={16}
              className="fill-primary/20 animate-pulse"
            />
          </motion.g>
        )}
      </svg>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 border border-border">
        <p className="text-xs font-medium text-foreground mb-2">Risk Level</p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-xs text-muted-foreground">Stable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-xs text-muted-foreground">Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-xs text-muted-foreground">Severe</span>
          </div>
        </div>
        
        {showFloodOverlay && (
          <>
            <div className="border-t border-border my-2 pt-2">
              <p className="text-xs font-medium text-foreground mb-1">Flood Risk</p>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 border border-dashed border-destructive" />
                <span className="text-xs text-muted-foreground">High/Critical</span>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Instructions */}
      <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-border">
        <p className="text-xs text-muted-foreground">Click a county for details</p>
      </div>
      
      {/* Water Source Legend */}
      <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 border border-border">
        <p className="text-xs font-medium text-foreground mb-2">Water Sources</p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-[10px] text-muted-foreground">Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-[10px] text-muted-foreground">Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-destructive" />
            <span className="text-[10px] text-muted-foreground">Critical</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedKenyaMap;
