import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import LeftSidebar from '@/components/dashboard/LeftSidebar';
import EnhancedKenyaMap from '@/components/dashboard/EnhancedKenyaMap';
import RightDetailsPanel from '@/components/dashboard/RightDetailsPanel';
import NotificationsPanel from '@/components/dashboard/NotificationsPanel';
import ReportForm from '@/components/reporting/ReportForm';
import ReportMarkers from '@/components/reporting/ReportMarkers';
import AdminDashboard from '@/components/admin/AdminDashboard';
import MyReports from '@/components/reporting/MyReports';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, Plus, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeReports } from '@/hooks/useRealtimeReports';
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
  const navigate = useNavigate();
  const { user, profile, role, isLoading: authLoading, isCountyAdmin } = useAuth();
  
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
  
  // Reporting & Admin
  const [showReportForm, setShowReportForm] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showMyReports, setShowMyReports] = useState(false);
  
  const nationalStats = getNationalStats();

  useEffect(() => {
    // Get user's county from profile or stored location
    if (profile?.county_id) {
      const county = kenyaCounties.find(c => c.id === profile.county_id);
      if (county) {
        setSelectedCounty(county);
        setUserLocation(county.coordinates);
        setUserLocationDisplay({
          town: county.towns[0]?.name || 'Unknown',
          county: county.name
        });
        setNotifications(generateNotifications(county.id));
      }
    } else {
      // Fallback to stored location
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
          setNotifications(generateNotifications(nearestCounty.id));
        }
      } else {
        setNotifications(generateNotifications());
      }
    }

    // Simulate real-time updates
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [profile]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    
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

  const handleReportSubmitted = useCallback(() => {
    setLastUpdate(new Date());
  }, []);

  // Responsive sidebar width
  const sidebarWidth = sidebarCollapsed ? 64 : 320;

  // Get user's county ID
  const userCountyId = profile?.county_id || selectedCounty?.id || null;

  // Real-time notifications for county admins
  useRealtimeReports({
    countyId: userCountyId,
    isCountyAdmin,
    onNewReport: handleReportSubmitted,
  });

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
          {/* Action Buttons */}
          <div className="flex gap-2 mb-4">
            {user && (
              <Button
                onClick={() => setShowReportForm(true)}
                className="gap-2"
                variant="hero"
              >
                <Plus className="w-4 h-4" />
                Submit Report
              </Button>
            )}
            
            {user && !isCountyAdmin && (
              <Button
                onClick={() => setShowMyReports(true)}
                variant="outline"
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                My Reports
              </Button>
            )}
            
            {isCountyAdmin && (
              <Button
                onClick={() => setShowAdminDashboard(true)}
                variant="outline"
                className="gap-2"
              >
                <Shield className="w-4 h-4" />
                Admin Dashboard
              </Button>
            )}
            
            {!user && (
              <Button
                onClick={() => navigate('/auth')}
                variant="outline"
                className="gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                Sign in to submit reports
              </Button>
            )}
          </div>
          
          {/* Map Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="h-[calc(100vh-12rem)] relative"
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
            
            {/* Report Markers Overlay */}
            <ReportMarkers countyId={userCountyId || undefined} />
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
      
      {/* Report Form Modal */}
      <ReportForm
        isOpen={showReportForm}
        onClose={() => setShowReportForm(false)}
        userLocation={userLocation}
        userCountyId={userCountyId}
        onReportSubmitted={handleReportSubmitted}
      />
      
      {/* Admin Dashboard */}
      {isCountyAdmin && userCountyId && (
        <AdminDashboard
          isOpen={showAdminDashboard}
          onClose={() => setShowAdminDashboard(false)}
          userCountyId={userCountyId}
        />
      )}
      
      {/* My Reports */}
      {user && (
        <MyReports
          isOpen={showMyReports}
          onClose={() => setShowMyReports(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
