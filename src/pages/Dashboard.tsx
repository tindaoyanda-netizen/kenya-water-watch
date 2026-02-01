import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import LeftSidebar from '@/components/dashboard/LeftSidebar';
import EnhancedKenyaMap from '@/components/dashboard/EnhancedKenyaMap';
import RightDetailsPanel from '@/components/dashboard/RightDetailsPanel';
import NotificationsPanel from '@/components/dashboard/NotificationsPanel';
import { 
  CountyData, 
  kenyaCounties, 
  getNationalStats, 
  getCountyByCoordinates,
  getTownByCoordinates,
  generateNotifications,
  Notification 
} from '@/data/aquaguardData';

const Dashboard = () => {
  const [selectedCounty, setSelectedCounty] = useState<CountyData | null>(null);
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocationDisplay, setUserLocationDisplay] = useState<{ town: string; county: string } | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Simulation state
  const [rainfall, setRainfall] = useState(50);
  const [consumption, setConsumption] = useState(50);
  
  // Overlay toggles
  const [showWeatherOverlay, setShowWeatherOverlay] = useState(false);
  const [showFloodOverlay, setShowFloodOverlay] = useState(true);
  
  // Notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const nationalStats = getNationalStats();

  useEffect(() => {
    // Try to get stored location
    const storedLocation = localStorage.getItem('ag_location');
    if (storedLocation) {
      const loc = JSON.parse(storedLocation);
      setUserLocation(loc);
      
      const nearestCounty = getCountyByCoordinates(loc.lat, loc.lng);
      const nearestTown = getTownByCoordinates(loc.lat, loc.lng);
      
      if (nearestCounty) {
        setSelectedCounty(nearestCounty);
        setUserLocationDisplay({
          town: nearestTown?.name || nearestCounty.towns[0]?.name || 'Unknown',
          county: nearestCounty.name
        });
        
        // Generate notifications for user's county
        setNotifications(generateNotifications(nearestCounty.id));
      }
    } else {
      setNotifications(generateNotifications());
    }

    // Simulate real-time updates
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    
    // Zoom to county
    if (notification.countyId !== 'national') {
      const county = kenyaCounties.find(c => c.id === notification.countyId);
      if (county) {
        setSelectedCounty(county);
        setShowNotifications(false);
      }
    }
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Responsive sidebar width
  const sidebarWidth = sidebarCollapsed ? 64 : 320;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <DashboardHeader
        userLocation={userLocationDisplay}
        lastUpdate={lastUpdate}
        notifications={notifications}
        unreadCount={unreadCount}
        onNotificationsClick={() => setShowNotifications(true)}
      />
      
      {/* Left Sidebar */}
      <LeftSidebar
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        rainfall={rainfall}
        consumption={consumption}
        onRainfallChange={setRainfall}
        onConsumptionChange={setConsumption}
        showWeatherOverlay={showWeatherOverlay}
        onWeatherOverlayChange={setShowWeatherOverlay}
        showFloodOverlay={showFloodOverlay}
        onFloodOverlayChange={setShowFloodOverlay}
        selectedCounty={selectedCounty}
        nationalStats={nationalStats}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      {/* Main Content */}
      <main 
        className="pt-16 transition-all duration-300"
        style={{ 
          marginLeft: sidebarWidth,
          width: `calc(100% - ${sidebarWidth}px)` 
        }}
      >
        <div className="p-4 lg:p-6">
          {/* Map Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="h-[calc(100vh-8rem)]"
          >
            <EnhancedKenyaMap
              counties={kenyaCounties}
              onCountySelect={setSelectedCounty}
              selectedCounty={selectedCounty}
              userLocation={userLocation}
              showWeatherOverlay={showWeatherOverlay}
              showFloodOverlay={showFloodOverlay}
              simulationRainfall={rainfall}
              simulationConsumption={consumption}
            />
          </motion.div>
        </div>
      </main>

      {/* Right Details Panel */}
      {selectedCounty && (
        <RightDetailsPanel 
          county={selectedCounty} 
          onClose={() => setSelectedCounty(null)} 
        />
      )}
      
      {/* Notifications Panel */}
      <NotificationsPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onMarkAllRead={handleMarkAllRead}
      />
    </div>
  );
};

export default Dashboard;
