import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import MetricCards from '@/components/dashboard/MetricCards';
import KenyaMap from '@/components/dashboard/KenyaMap';
import CountyDetailsPanel from '@/components/dashboard/CountyDetailsPanel';
import ScenarioSimulator from '@/components/dashboard/ScenarioSimulator';
import { CountyData, kenyaCounties, getNationalStats, getCountyByCoordinates } from '@/data/kenyaCounties';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, RefreshCw, Download } from 'lucide-react';

const Dashboard = () => {
  const [selectedCounty, setSelectedCounty] = useState<CountyData | null>(null);
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const nationalStats = getNationalStats();

  useEffect(() => {
    // Try to get stored location
    const storedLocation = localStorage.getItem('kww_location');
    if (storedLocation) {
      const loc = JSON.parse(storedLocation);
      setUserLocation(loc);
      const nearestCounty = getCountyByCoordinates(loc.lat, loc.lng);
      if (nearestCounty) {
        setSelectedCounty(nearestCounty);
      }
    }

    // Simulate real-time updates
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleSimulate = (rainfall: number, consumption: number) => {
    // In a real app, this would update the map and metrics
    console.log('Simulating:', { rainfall, consumption });
  };

  const handleExportPDF = () => {
    // Simulate PDF export
    alert('PDF export would be generated here with county water status data.');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                  Water Monitoring Dashboard
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    Updated {lastUpdate.toLocaleTimeString()}
                  </span>
                  {userLocation && (
                    <span className="text-sm text-primary flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Location detected
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Time Range Selector */}
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                  {(['7', '30', '90'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        timeRange === range 
                          ? 'bg-card shadow text-foreground' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {range}d
                    </button>
                  ))}
                </div>
                
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Metric Cards */}
          <div className="mb-6">
            <MetricCards selectedCounty={selectedCounty} nationalStats={nationalStats} />
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Map Section */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <KenyaMap 
                  onCountySelect={setSelectedCounty} 
                  selectedCounty={selectedCounty}
                />
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Scenario Simulator */}
              <ScenarioSimulator onSimulate={handleSimulate} />
              
              {/* County List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-2xl p-4 border border-border"
              >
                <h3 className="font-heading font-semibold mb-4">Counties by Risk</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {[...kenyaCounties]
                    .sort((a, b) => b.waterStress - a.waterStress)
                    .slice(0, 8)
                    .map((county) => (
                      <button
                        key={county.id}
                        onClick={() => setSelectedCounty(county)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-all hover:bg-muted ${
                          selectedCounty?.id === county.id ? 'bg-muted' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            county.riskLevel === 'stable' ? 'bg-success' :
                            county.riskLevel === 'moderate' ? 'bg-warning' : 'bg-destructive'
                          }`} />
                          <span className="font-medium text-sm">{county.name}</span>
                        </div>
                        <span className={`text-sm font-bold ${
                          county.waterStress <= 40 ? 'text-success' :
                          county.waterStress <= 70 ? 'text-warning' : 'text-destructive'
                        }`}>
                          {county.waterStress}
                        </span>
                      </button>
                    ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* County Details Panel */}
      {selectedCounty && (
        <CountyDetailsPanel 
          county={selectedCounty} 
          onClose={() => setSelectedCounty(null)} 
        />
      )}
    </div>
  );
};

export default Dashboard;
