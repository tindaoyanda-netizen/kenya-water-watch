import { CountyData, kenyaCounties } from '@/data/aquaguardData';
import { motion } from 'framer-motion';

interface KenyaMapProps {
  onCountySelect: (county: CountyData) => void;
  selectedCounty: CountyData | null;
}

const KenyaMap = ({ onCountySelect, selectedCounty }: KenyaMapProps) => {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'stable': return 'fill-success/80 hover:fill-success';
      case 'moderate': return 'fill-warning/80 hover:fill-warning';
      case 'severe': return 'fill-destructive/80 hover:fill-destructive';
      default: return 'fill-muted';
    }
  };

  // Simplified Kenya county positions for visual representation
  const countyPositions: Record<string, { x: number; y: number; size: number }> = {
    turkana: { x: 150, y: 80, size: 45 },
    mandera: { x: 280, y: 100, size: 35 },
    wajir: { x: 270, y: 160, size: 40 },
    garissa: { x: 250, y: 230, size: 38 },
    mombasa: { x: 230, y: 350, size: 25 },
    kilifi: { x: 230, y: 310, size: 30 },
    nairobi: { x: 170, y: 270, size: 28 },
    kiambu: { x: 165, y: 245, size: 26 },
    nakuru: { x: 140, y: 220, size: 32 },
    uasingishu: { x: 120, y: 160, size: 30 },
    kisumu: { x: 100, y: 200, size: 28 },
    kakamega: { x: 95, y: 170, size: 28 },
    meru: { x: 200, y: 195, size: 30 },
    nyeri: { x: 175, y: 215, size: 26 },
    machakos: { x: 190, y: 285, size: 28 },
    kajiado: { x: 160, y: 310, size: 35 },
  };

  return (
    <div className="relative bg-muted/30 rounded-2xl p-4 h-full min-h-[500px]">
      <svg 
        viewBox="0 0 350 420" 
        className="w-full h-full"
        style={{ maxHeight: '500px' }}
      >
        {/* Kenya outline (simplified) */}
        <path
          d="M80,50 L120,30 L200,30 L280,50 L320,100 L330,180 L300,280 L260,380 L220,400 L160,390 L130,340 L80,280 L60,200 L70,120 Z"
          className="fill-muted stroke-border stroke-2"
        />
        
        {/* County markers */}
        {kenyaCounties.map((county) => {
          const pos = countyPositions[county.id];
          if (!pos) return null;
          
          const isSelected = selectedCounty?.id === county.id;
          
          return (
            <motion.g
              key={county.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: Math.random() * 0.3 }}
            >
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r={pos.size / 2}
                className={`${getRiskColor(county.riskLevel)} cursor-pointer transition-all duration-300 ${
                  isSelected ? 'stroke-foreground stroke-[3]' : 'stroke-background stroke-2'
                }`}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onCountySelect(county)}
              />
              {/* Pulse animation for severe risk */}
              {county.riskLevel === 'severe' && (
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
                y={pos.y + pos.size / 2 + 12}
                textAnchor="middle"
                className="fill-foreground text-[8px] font-medium pointer-events-none"
              >
                {county.name}
              </text>
            </motion.g>
          );
        })}
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
      </div>
      
      {/* Instructions */}
      <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-border">
        <p className="text-xs text-muted-foreground">Click a county to view details</p>
      </div>
    </div>
  );
};

export default KenyaMap;
