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

// Project lat/lng to SVG coordinates
// Kenya bounds: lat -4.7 to 5.5, lng 33.9 to 41.9
const PROJECT_BOUNDS = {
  minLat: -4.8,
  maxLat: 5.6,
  minLng: 33.5,
  maxLng: 42.2,
};

const SVG_WIDTH = 500;
const SVG_HEIGHT = 600;
const SVG_PADDING = 20;

const projectToSvg = (lat: number, lng: number) => {
  const x = SVG_PADDING + ((lng - PROJECT_BOUNDS.minLng) / (PROJECT_BOUNDS.maxLng - PROJECT_BOUNDS.minLng)) * (SVG_WIDTH - 2 * SVG_PADDING);
  const y = SVG_PADDING + ((PROJECT_BOUNDS.maxLat - lat) / (PROJECT_BOUNDS.maxLat - PROJECT_BOUNDS.minLat)) * (SVG_HEIGHT - 2 * SVG_PADDING);
  return { x, y };
};

// Real Kenya border from Natural Earth GeoJSON data [lng, lat] pairs
const KENYA_BORDER_COORDS: [number, number][] = [
  [40.993,-0.85829],[41.58513,-1.68325],[40.88477,-2.08255],[40.63785,-2.49979],
  [40.26304,-2.57309],[40.12119,-3.27768],[39.80006,-3.68116],[39.60489,-4.34653],
  [39.20222,-4.67677],[37.7669,-3.67712],[37.69869,-3.09699],[34.07262,-1.05982],
  [33.903711,-0.95],[33.893569,0.109814],[34.18,0.515],[34.6721,1.17694],
  [35.03599,1.90584],[34.59607,3.05374],[34.47913,3.5556],[34.005,4.249885],
  [34.620196,4.847123],[35.298007,5.506],[35.817448,5.338232],[35.817448,4.776966],
  [36.159079,4.447864],[36.855093,4.447864],[38.120915,3.598605],[38.43697,3.58851],
  [38.67114,3.61607],[38.89251,3.50074],[39.559384,3.42206],[39.85494,3.83879],
  [40.76848,4.25702],[41.1718,3.91909],[41.855083,3.918912],[40.98105,2.78452],
  [40.993,-0.85829],
];

const KENYA_OUTLINE = (() => {
  const svgPoints = KENYA_BORDER_COORDS.map(([lng, lat]) => projectToSvg(lat, lng));
  return `M ${svgPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')} Z`;
})();

// Lake Victoria (Kenya's portion)
const LAKE_VICTORIA = (() => {
  const lakePoints: [number, number][] = [
    [33.92, -0.95], [34.07, -1.06], [34.30, -1.15], [34.55, -1.05],
    [34.72, -0.75], [34.80, -0.45], [34.65, -0.15], [34.35, 0.02],
    [34.10, 0.10], [33.90, 0.05], [33.89, -0.30], [33.90, -0.60],
    [33.92, -0.95],
  ];
  const svgPoints = lakePoints.map(([lng, lat]) => projectToSvg(lat, lng));
  return `M ${svgPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')} Z`;
})();

// Lake Turkana
const LAKE_TURKANA = (() => {
  const lakePoints: [number, number][] = [
    [36.05, 4.40], [36.25, 4.20], [36.40, 3.80], [36.60, 3.30],
    [36.80, 2.80], [36.85, 2.50], [36.70, 2.45], [36.50, 2.60],
    [36.30, 3.00], [36.15, 3.50], [36.10, 3.90], [36.05, 4.40],
  ];
  const svgPoints = lakePoints.map(([lng, lat]) => projectToSvg(lat, lng));
  return `M ${svgPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')} Z`;
})();

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

  const getSourcePinColor = (status: WaterSource['status']) => {
    switch (status) {
      case 'normal': return 'fill-success';
      case 'low': return 'fill-warning';
      case 'critical': return 'fill-destructive';
    }
  };

  // Get county marker size based on population
  const getCountySize = (county: CountyData) => {
    if (county.population > 3000000) return 16;
    if (county.population > 1500000) return 13;
    if (county.population > 1000000) return 11;
    return 9;
  };

  return (
    <div className="relative bg-muted/30 rounded-2xl p-2 sm:p-4 h-full min-h-[400px] overflow-hidden">
      <svg 
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Water gradient for lakes */}
          <linearGradient id="lakeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(200, 80%, 55%)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(210, 85%, 40%)" stopOpacity="0.7" />
          </linearGradient>
          {/* Land gradient */}
          <linearGradient id="landGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--muted))" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.6" />
          </linearGradient>
          {/* Glow filter for selected county */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Kenya land mass */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          d={KENYA_OUTLINE}
          fill="url(#landGradient)"
          className="stroke-border"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Lake Victoria */}
        <motion.path
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          d={LAKE_VICTORIA}
          fill="url(#lakeGradient)"
          className="stroke-primary/30"
          strokeWidth="0.5"
        />

        {/* Lake Turkana */}
        <motion.path
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          d={LAKE_TURKANA}
          fill="url(#lakeGradient)"
          className="stroke-primary/30"
          strokeWidth="0.5"
        />

        {/* County markers - projected from real coordinates */}
        {counties.map((county, i) => {
          const pos = projectToSvg(county.coordinates.lat, county.coordinates.lng);
          const size = getCountySize(county);
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
                  r={size + 6}
                  className={`fill-none ${getFloodRiskColor(county.floodRisk.riskLevel)} stroke-dashed`}
                  strokeDasharray="4 2"
                />
              )}
              
              {/* Main county marker */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.circle
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    cx={pos.x}
                    cy={pos.y}
                    r={size}
                    className={`${getRiskColor(county)} cursor-pointer transition-all duration-300 ${
                      isSelected ? 'stroke-foreground stroke-[3]' : 'stroke-background stroke-[1.5]'
                    }`}
                    filter={isSelected ? 'url(#glow)' : undefined}
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.9 }}
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
                  x={pos.x + size + 2}
                  y={pos.y - size}
                  fontSize="10"
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
                  r={size}
                  className="fill-none stroke-destructive animate-ping opacity-40"
                  strokeWidth={1.5}
                />
              )}
              
              {/* County label */}
              <text
                x={pos.x}
                y={pos.y + size + 11}
                textAnchor="middle"
                className="fill-foreground text-[7px] font-medium pointer-events-none select-none"
                style={{ textShadow: '0 0 3px hsl(var(--background)), 0 0 3px hsl(var(--background))' }}
              >
                {county.name}
              </text>
            </g>
          );
        })}
        
        {/* Water source pins */}
        {waterSources.map((source) => {
          const pos = projectToSvg(source.coordinates.lat, source.coordinates.lng);
          
          return (
            <Tooltip key={source.id}>
              <TooltipTrigger asChild>
                <motion.circle
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 + Math.random() * 0.3 }}
                  cx={pos.x}
                  cy={pos.y}
                  r={3}
                  className={`${getSourcePinColor(source.status)} stroke-background stroke-[0.5] cursor-pointer`}
                />
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
        {userLocation && (() => {
          const pos = projectToSvg(userLocation.lat, userLocation.lng);
          return (
            <motion.g
              initial={{ scale: 0, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', delay: 0.8 }}
            >
              {/* Pulse ring */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={14}
                className="fill-primary/15 animate-pulse"
              />
              {/* Pin shadow */}
              <ellipse
                cx={pos.x}
                cy={pos.y + 12}
                rx={5}
                ry={2}
                className="fill-foreground/10"
              />
              {/* Pin body */}
              <path
                d={`M ${pos.x} ${pos.y - 12} 
                    C ${pos.x - 7} ${pos.y - 12}, ${pos.x - 7} ${pos.y - 2}, ${pos.x} ${pos.y + 4}
                    C ${pos.x + 7} ${pos.y - 2}, ${pos.x + 7} ${pos.y - 12}, ${pos.x} ${pos.y - 12} Z`}
                className="fill-primary stroke-primary-foreground"
                strokeWidth="1"
              />
              {/* Pin dot */}
              <circle
                cx={pos.x}
                cy={pos.y - 7}
                r={2.5}
                className="fill-primary-foreground"
              />
            </motion.g>
          );
        })()}

        {/* Equator line */}
        {(() => {
          const left = projectToSvg(0, PROJECT_BOUNDS.minLng);
          const right = projectToSvg(0, PROJECT_BOUNDS.maxLng);
          return (
            <g>
              <line
                x1={left.x}
                y1={left.y}
                x2={right.x}
                y2={right.y}
                className="stroke-muted-foreground/20"
                strokeWidth="0.5"
                strokeDasharray="8 4"
              />
              <text
                x={right.x - 5}
                y={left.y - 4}
                textAnchor="end"
                className="fill-muted-foreground/40 text-[7px] italic"
              >
                Equator
              </text>
            </g>
          );
        })()}
      </svg>
      
      {/* Legend */}
      <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 bg-card/90 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-border">
        <p className="text-[10px] sm:text-xs font-medium text-foreground mb-1.5">Risk Level</p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-success" />
            <span className="text-[10px] text-muted-foreground">Stable</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-warning" />
            <span className="text-[10px] text-muted-foreground">Moderate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
            <span className="text-[10px] text-muted-foreground">Severe</span>
          </div>
        </div>
        
        {showFloodOverlay && (
          <div className="border-t border-border mt-1.5 pt-1.5">
            <p className="text-[10px] font-medium text-foreground mb-1">Flood Risk</p>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-0.5 border border-dashed border-destructive" />
              <span className="text-[10px] text-muted-foreground">High/Critical</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Instructions */}
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-card/90 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1.5 border border-border">
        <p className="text-[10px] sm:text-xs text-muted-foreground">Click a county for details</p>
      </div>
      
      {/* Water Source Legend */}
      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-card/90 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-border">
        <p className="text-[10px] sm:text-xs font-medium text-foreground mb-1.5">Water Sources</p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-[10px] text-muted-foreground">Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-[10px] text-muted-foreground">Low</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-destructive" />
            <span className="text-[10px] text-muted-foreground">Critical</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedKenyaMap;
