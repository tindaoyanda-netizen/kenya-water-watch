// Extended data layer for AquaGuard Kenya with towns, water sources, weather, and flood data

export interface WaterSource {
  id: string;
  name: string;
  type: 'reservoir' | 'river' | 'borehole' | 'kiosk';
  countyId: string;
  coordinates: { lat: number; lng: number };
  currentLevel: number; // 0-100%
  capacity?: number; // liters
  status: 'normal' | 'low' | 'critical';
}

export interface Town {
  id: string;
  name: string;
  countyId: string;
  coordinates: { lat: number; lng: number };
  population: number;
}

export interface WeatherData {
  countyId: string;
  temperature: number; // Celsius
  humidity: number; // %
  rainfall24h: number; // mm
  forecast: {
    date: string;
    rainfall: number;
    condition: 'sunny' | 'cloudy' | 'rain' | 'heavy_rain' | 'storm';
  }[];
}

export interface FloodRisk {
  countyId: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  probability: number; // 0-100%
  predictedDate?: string;
  affectedAreas: string[];
  precautions: string[];
}

export interface Notification {
  id: string;
  type: 'water_scarcity' | 'flood_alert' | 'weather_alert' | 'daily_insight';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  countyId: string;
  townId?: string;
  timestamp: Date;
  coordinates?: { lat: number; lng: number };
  read: boolean;
}

export interface CountyData {
  id: string;
  name: string;
  waterAvailability: number;
  waterStress: number;
  population: number;
  recentRainfall: number;
  riskLevel: 'stable' | 'moderate' | 'severe';
  floodRisk: FloodRisk;
  waterSources: {
    reservoirs: number;
    rivers: number;
    boreholes: number;
    kiosks: number;
  };
  coordinates: { lat: number; lng: number };
  trend: number[];
  towns: Town[];
  weather: WeatherData;
}

// Sample water sources across Kenya
export const waterSources: WaterSource[] = [
  // Nairobi
  { id: 'ws-nrb-1', name: 'Ndakaini Dam', type: 'reservoir', countyId: 'nairobi', coordinates: { lat: -0.95, lng: 36.95 }, currentLevel: 68, capacity: 70000000, status: 'normal' },
  { id: 'ws-nrb-2', name: 'Sasumua Dam', type: 'reservoir', countyId: 'nairobi', coordinates: { lat: -0.78, lng: 36.67 }, currentLevel: 55, capacity: 26000000, status: 'low' },
  { id: 'ws-nrb-3', name: 'Thika River', type: 'river', countyId: 'nairobi', coordinates: { lat: -1.05, lng: 37.05 }, currentLevel: 72, status: 'normal' },
  { id: 'ws-nrb-4', name: 'Ruiru Borehole A', type: 'borehole', countyId: 'nairobi', coordinates: { lat: -1.15, lng: 36.96 }, currentLevel: 45, status: 'low' },
  // Mombasa
  { id: 'ws-mbs-1', name: 'Mzima Springs', type: 'river', countyId: 'mombasa', coordinates: { lat: -2.98, lng: 38.02 }, currentLevel: 42, status: 'low' },
  { id: 'ws-mbs-2', name: 'Tiwi Borehole', type: 'borehole', countyId: 'mombasa', coordinates: { lat: -4.24, lng: 39.55 }, currentLevel: 35, status: 'critical' },
  // Kisumu
  { id: 'ws-ksm-1', name: 'Lake Victoria Intake', type: 'reservoir', countyId: 'kisumu', coordinates: { lat: -0.09, lng: 34.76 }, currentLevel: 92, capacity: 100000000, status: 'normal' },
  { id: 'ws-ksm-2', name: 'Nyando River', type: 'river', countyId: 'kisumu', coordinates: { lat: -0.15, lng: 34.95 }, currentLevel: 85, status: 'normal' },
  // Turkana
  { id: 'ws-trk-1', name: 'Turkwel Dam', type: 'reservoir', countyId: 'turkana', coordinates: { lat: 1.90, lng: 35.35 }, currentLevel: 18, capacity: 1600000000, status: 'critical' },
  { id: 'ws-trk-2', name: 'Lodwar Borehole', type: 'borehole', countyId: 'turkana', coordinates: { lat: 3.12, lng: 35.60 }, currentLevel: 22, status: 'critical' },
  // Nakuru
  { id: 'ws-nkr-1', name: 'Lake Nakuru', type: 'reservoir', countyId: 'nakuru', coordinates: { lat: -0.37, lng: 36.09 }, currentLevel: 65, status: 'normal' },
  { id: 'ws-nkr-2', name: 'Menengai Borehole', type: 'borehole', countyId: 'nakuru', coordinates: { lat: -0.18, lng: 36.07 }, currentLevel: 58, status: 'low' },
  // Kiambu
  { id: 'ws-kmb-1', name: 'Ruiru Dam', type: 'reservoir', countyId: 'kiambu', coordinates: { lat: -1.13, lng: 36.98 }, currentLevel: 74, capacity: 2900000, status: 'normal' },
  { id: 'ws-kmb-2', name: 'Gatanga River', type: 'river', countyId: 'kiambu', coordinates: { lat: -0.95, lng: 37.02 }, currentLevel: 78, status: 'normal' },
  // Garissa
  { id: 'ws-grs-1', name: 'Tana River', type: 'river', countyId: 'garissa', coordinates: { lat: -0.46, lng: 39.64 }, currentLevel: 28, status: 'critical' },
];

// Counties with extended data
export const kenyaCounties: CountyData[] = [
  {
    id: 'nairobi',
    name: 'Nairobi',
    waterAvailability: 65,
    waterStress: 72,
    population: 4397073,
    recentRainfall: 45,
    riskLevel: 'moderate',
    floodRisk: { countyId: 'nairobi', riskLevel: 'moderate', probability: 35, affectedAreas: ['Mathare', 'Kibera', 'Eastleigh'], precautions: ['Clear drainage channels', 'Avoid low-lying areas during rain', 'Store emergency supplies'] },
    waterSources: { reservoirs: 3, rivers: 2, boreholes: 156, kiosks: 234 },
    coordinates: { lat: -1.2921, lng: 36.8219 },
    trend: [60, 62, 58, 55, 60, 63, 65, 62, 58, 61, 64, 66, 63, 60, 58, 62, 65, 67, 64, 61, 59, 63, 66, 68, 65, 62, 60, 64, 67, 65],
    towns: [
      { id: 'nrb-westlands', name: 'Westlands', countyId: 'nairobi', coordinates: { lat: -1.2673, lng: 36.8111 }, population: 281562 },
      { id: 'nrb-kasarani', name: 'Kasarani', countyId: 'nairobi', coordinates: { lat: -1.2219, lng: 36.8882 }, population: 525624 },
      { id: 'nrb-embakasi', name: 'Embakasi', countyId: 'nairobi', coordinates: { lat: -1.3226, lng: 36.8987 }, population: 987456 },
    ],
    weather: { countyId: 'nairobi', temperature: 24, humidity: 65, rainfall24h: 12, forecast: [
      { date: '2026-02-02', rainfall: 15, condition: 'rain' },
      { date: '2026-02-03', rainfall: 8, condition: 'cloudy' },
      { date: '2026-02-04', rainfall: 0, condition: 'sunny' },
    ]}
  },
  {
    id: 'mombasa',
    name: 'Mombasa',
    waterAvailability: 55,
    waterStress: 78,
    population: 1208333,
    recentRainfall: 32,
    riskLevel: 'severe',
    floodRisk: { countyId: 'mombasa', riskLevel: 'high', probability: 65, predictedDate: '2026-02-05', affectedAreas: ['Likoni', 'Kisauni', 'Changamwe'], precautions: ['Move valuables to higher ground', 'Prepare evacuation routes', 'Stock food and water'] },
    waterSources: { reservoirs: 1, rivers: 0, boreholes: 89, kiosks: 156 },
    coordinates: { lat: -4.0435, lng: 39.6682 },
    trend: [58, 55, 52, 50, 48, 52, 55, 53, 50, 48, 52, 55, 58, 55, 52, 50, 53, 56, 54, 51, 49, 52, 55, 57, 54, 51, 49, 53, 56, 55],
    towns: [
      { id: 'mbs-nyali', name: 'Nyali', countyId: 'mombasa', coordinates: { lat: -4.0347, lng: 39.7096 }, population: 193534 },
      { id: 'mbs-likoni', name: 'Likoni', countyId: 'mombasa', coordinates: { lat: -4.0829, lng: 39.6572 }, population: 222871 },
    ],
    weather: { countyId: 'mombasa', temperature: 29, humidity: 78, rainfall24h: 45, forecast: [
      { date: '2026-02-02', rainfall: 55, condition: 'heavy_rain' },
      { date: '2026-02-03', rainfall: 40, condition: 'rain' },
      { date: '2026-02-04', rainfall: 25, condition: 'rain' },
    ]}
  },
  {
    id: 'kisumu',
    name: 'Kisumu',
    waterAvailability: 82,
    waterStress: 35,
    population: 1155574,
    recentRainfall: 78,
    riskLevel: 'stable',
    floodRisk: { countyId: 'kisumu', riskLevel: 'moderate', probability: 40, affectedAreas: ['Nyalenda', 'Manyatta'], precautions: ['Monitor lake levels', 'Keep emergency contacts ready'] },
    waterSources: { reservoirs: 5, rivers: 4, boreholes: 67, kiosks: 89 },
    coordinates: { lat: -0.1022, lng: 34.7617 },
    trend: [78, 80, 82, 85, 83, 81, 79, 82, 84, 86, 83, 80, 78, 81, 83, 85, 82, 79, 77, 80, 82, 84, 81, 78, 76, 79, 81, 83, 80, 82],
    towns: [
      { id: 'ksm-central', name: 'Kisumu Central', countyId: 'kisumu', coordinates: { lat: -0.0917, lng: 34.7680 }, population: 167890 },
      { id: 'ksm-nyando', name: 'Nyando', countyId: 'kisumu', coordinates: { lat: -0.1654, lng: 34.9023 }, population: 145623 },
    ],
    weather: { countyId: 'kisumu', temperature: 27, humidity: 72, rainfall24h: 22, forecast: [
      { date: '2026-02-02', rainfall: 18, condition: 'rain' },
      { date: '2026-02-03', rainfall: 5, condition: 'cloudy' },
      { date: '2026-02-04', rainfall: 0, condition: 'sunny' },
    ]}
  },
  {
    id: 'nakuru',
    name: 'Nakuru',
    waterAvailability: 70,
    waterStress: 55,
    population: 2162202,
    recentRainfall: 55,
    riskLevel: 'moderate',
    floodRisk: { countyId: 'nakuru', riskLevel: 'low', probability: 15, affectedAreas: ['Lake Nakuru Basin'], precautions: ['Standard flood awareness'] },
    waterSources: { reservoirs: 4, rivers: 3, boreholes: 112, kiosks: 178 },
    coordinates: { lat: -0.3031, lng: 36.0800 },
    trend: [65, 68, 70, 72, 69, 66, 64, 67, 70, 72, 69, 66, 64, 67, 70, 73, 70, 67, 65, 68, 71, 73, 70, 67, 65, 68, 71, 73, 70, 70],
    towns: [
      { id: 'nkr-central', name: 'Nakuru Town', countyId: 'nakuru', coordinates: { lat: -0.2833, lng: 36.0667 }, population: 367183 },
      { id: 'nkr-naivasha', name: 'Naivasha', countyId: 'nakuru', coordinates: { lat: -0.7172, lng: 36.4320 }, population: 181966 },
    ],
    weather: { countyId: 'nakuru', temperature: 22, humidity: 58, rainfall24h: 8, forecast: [
      { date: '2026-02-02', rainfall: 5, condition: 'cloudy' },
      { date: '2026-02-03', rainfall: 0, condition: 'sunny' },
      { date: '2026-02-04', rainfall: 2, condition: 'cloudy' },
    ]}
  },
  {
    id: 'turkana',
    name: 'Turkana',
    waterAvailability: 22,
    waterStress: 95,
    population: 926976,
    recentRainfall: 8,
    riskLevel: 'severe',
    floodRisk: { countyId: 'turkana', riskLevel: 'low', probability: 5, affectedAreas: [], precautions: ['Focus on drought preparedness'] },
    waterSources: { reservoirs: 0, rivers: 1, boreholes: 23, kiosks: 45 },
    coordinates: { lat: 3.1166, lng: 35.5966 },
    trend: [25, 23, 20, 18, 16, 18, 21, 23, 20, 17, 15, 18, 21, 24, 21, 18, 16, 19, 22, 24, 21, 18, 16, 19, 22, 25, 22, 19, 17, 22],
    towns: [
      { id: 'trk-lodwar', name: 'Lodwar', countyId: 'turkana', coordinates: { lat: 3.1166, lng: 35.5966 }, population: 82970 },
      { id: 'trk-kakuma', name: 'Kakuma', countyId: 'turkana', coordinates: { lat: 3.7167, lng: 34.8500 }, population: 60000 },
    ],
    weather: { countyId: 'turkana', temperature: 35, humidity: 25, rainfall24h: 0, forecast: [
      { date: '2026-02-02', rainfall: 0, condition: 'sunny' },
      { date: '2026-02-03', rainfall: 0, condition: 'sunny' },
      { date: '2026-02-04', rainfall: 0, condition: 'sunny' },
    ]}
  },
  {
    id: 'kiambu',
    name: 'Kiambu',
    waterAvailability: 75,
    waterStress: 48,
    population: 2417735,
    recentRainfall: 62,
    riskLevel: 'stable',
    floodRisk: { countyId: 'kiambu', riskLevel: 'low', probability: 20, affectedAreas: ['Thika Town lowlands'], precautions: ['Maintain drainage systems'] },
    waterSources: { reservoirs: 6, rivers: 5, boreholes: 178, kiosks: 267 },
    coordinates: { lat: -1.1714, lng: 36.8356 },
    trend: [70, 72, 75, 77, 74, 71, 69, 72, 75, 78, 75, 72, 70, 73, 76, 78, 75, 72, 70, 73, 76, 79, 76, 73, 71, 74, 77, 79, 76, 75],
    towns: [
      { id: 'kmb-thika', name: 'Thika', countyId: 'kiambu', coordinates: { lat: -1.0334, lng: 37.0693 }, population: 139853 },
      { id: 'kmb-ruiru', name: 'Ruiru', countyId: 'kiambu', coordinates: { lat: -1.1456, lng: 36.9607 }, population: 238858 },
    ],
    weather: { countyId: 'kiambu', temperature: 23, humidity: 68, rainfall24h: 15, forecast: [
      { date: '2026-02-02', rainfall: 12, condition: 'rain' },
      { date: '2026-02-03', rainfall: 8, condition: 'cloudy' },
      { date: '2026-02-04', rainfall: 3, condition: 'cloudy' },
    ]}
  },
  {
    id: 'machakos',
    name: 'Machakos',
    waterAvailability: 45,
    waterStress: 68,
    population: 1421932,
    recentRainfall: 28,
    riskLevel: 'moderate',
    floodRisk: { countyId: 'machakos', riskLevel: 'moderate', probability: 30, affectedAreas: ['Athi River Basin'], precautions: ['Monitor river levels', 'Avoid crossing flooded areas'] },
    waterSources: { reservoirs: 2, rivers: 2, boreholes: 95, kiosks: 145 },
    coordinates: { lat: -1.5177, lng: 37.2634 },
    trend: [48, 46, 43, 40, 42, 45, 48, 45, 42, 39, 42, 45, 48, 45, 42, 39, 42, 45, 48, 46, 43, 40, 43, 46, 49, 46, 43, 41, 44, 45],
    towns: [
      { id: 'mks-machakos', name: 'Machakos Town', countyId: 'machakos', coordinates: { lat: -1.5177, lng: 37.2634 }, population: 150041 },
      { id: 'mks-athi', name: 'Athi River', countyId: 'machakos', coordinates: { lat: -1.4548, lng: 36.9820 }, population: 120000 },
    ],
    weather: { countyId: 'machakos', temperature: 26, humidity: 52, rainfall24h: 5, forecast: [
      { date: '2026-02-02', rainfall: 8, condition: 'cloudy' },
      { date: '2026-02-03', rainfall: 2, condition: 'sunny' },
      { date: '2026-02-04', rainfall: 0, condition: 'sunny' },
    ]}
  },
  {
    id: 'kajiado',
    name: 'Kajiado',
    waterAvailability: 38,
    waterStress: 75,
    population: 1117840,
    recentRainfall: 22,
    riskLevel: 'severe',
    floodRisk: { countyId: 'kajiado', riskLevel: 'low', probability: 10, affectedAreas: [], precautions: ['Focus on water conservation'] },
    waterSources: { reservoirs: 1, rivers: 1, boreholes: 56, kiosks: 89 },
    coordinates: { lat: -1.8524, lng: 36.7820 },
    trend: [42, 40, 37, 34, 36, 39, 42, 39, 36, 33, 36, 39, 42, 39, 36, 33, 36, 39, 42, 40, 37, 34, 37, 40, 43, 40, 37, 35, 38, 38],
    towns: [
      { id: 'kjd-ngong', name: 'Ngong', countyId: 'kajiado', coordinates: { lat: -1.3583, lng: 36.6583 }, population: 77458 },
      { id: 'kjd-kitengela', name: 'Kitengela', countyId: 'kajiado', coordinates: { lat: -1.4763, lng: 36.9569 }, population: 154436 },
    ],
    weather: { countyId: 'kajiado', temperature: 28, humidity: 40, rainfall24h: 2, forecast: [
      { date: '2026-02-02', rainfall: 0, condition: 'sunny' },
      { date: '2026-02-03', rainfall: 0, condition: 'sunny' },
      { date: '2026-02-04', rainfall: 5, condition: 'cloudy' },
    ]}
  },
  {
    id: 'uasingishu',
    name: 'Uasin Gishu',
    waterAvailability: 78,
    waterStress: 42,
    population: 1163186,
    recentRainfall: 70,
    riskLevel: 'stable',
    floodRisk: { countyId: 'uasingishu', riskLevel: 'low', probability: 12, affectedAreas: ['Eldoret lowlands'], precautions: ['Standard preparedness'] },
    waterSources: { reservoirs: 4, rivers: 3, boreholes: 89, kiosks: 134 },
    coordinates: { lat: 0.5143, lng: 35.2698 },
    trend: [75, 77, 79, 81, 78, 75, 73, 76, 79, 82, 79, 76, 74, 77, 80, 82, 79, 76, 74, 77, 80, 83, 80, 77, 75, 78, 81, 83, 80, 78],
    towns: [
      { id: 'usg-eldoret', name: 'Eldoret', countyId: 'uasingishu', coordinates: { lat: 0.5143, lng: 35.2698 }, population: 475716 },
    ],
    weather: { countyId: 'uasingishu', temperature: 20, humidity: 65, rainfall24h: 18, forecast: [
      { date: '2026-02-02', rainfall: 15, condition: 'rain' },
      { date: '2026-02-03', rainfall: 10, condition: 'cloudy' },
      { date: '2026-02-04', rainfall: 5, condition: 'cloudy' },
    ]}
  },
  {
    id: 'meru',
    name: 'Meru',
    waterAvailability: 72,
    waterStress: 52,
    population: 1545714,
    recentRainfall: 58,
    riskLevel: 'stable',
    floodRisk: { countyId: 'meru', riskLevel: 'low', probability: 18, affectedAreas: ['River valleys'], precautions: ['Monitor Mt. Kenya runoff'] },
    waterSources: { reservoirs: 3, rivers: 4, boreholes: 102, kiosks: 156 },
    coordinates: { lat: 0.0500, lng: 37.6500 },
    trend: [68, 70, 72, 74, 71, 68, 66, 69, 72, 75, 72, 69, 67, 70, 73, 75, 72, 69, 67, 70, 73, 76, 73, 70, 68, 71, 74, 76, 73, 72],
    towns: [
      { id: 'mru-meru', name: 'Meru Town', countyId: 'meru', coordinates: { lat: 0.0500, lng: 37.6500 }, population: 52304 },
    ],
    weather: { countyId: 'meru', temperature: 21, humidity: 62, rainfall24h: 12, forecast: [
      { date: '2026-02-02', rainfall: 10, condition: 'rain' },
      { date: '2026-02-03', rainfall: 5, condition: 'cloudy' },
      { date: '2026-02-04', rainfall: 2, condition: 'sunny' },
    ]}
  },
  {
    id: 'kilifi',
    name: 'Kilifi',
    waterAvailability: 48,
    waterStress: 70,
    population: 1453787,
    recentRainfall: 35,
    riskLevel: 'moderate',
    floodRisk: { countyId: 'kilifi', riskLevel: 'moderate', probability: 45, affectedAreas: ['Coastal lowlands', 'Malindi'], precautions: ['Prepare for flash floods', 'Clear drainage'] },
    waterSources: { reservoirs: 2, rivers: 2, boreholes: 78, kiosks: 123 },
    coordinates: { lat: -3.6305, lng: 39.8499 },
    trend: [50, 48, 45, 42, 44, 47, 50, 47, 44, 41, 44, 47, 50, 47, 44, 41, 44, 47, 50, 48, 45, 42, 45, 48, 51, 48, 45, 43, 46, 48],
    towns: [
      { id: 'klf-malindi', name: 'Malindi', countyId: 'kilifi', coordinates: { lat: -3.2138, lng: 40.1169 }, population: 119859 },
      { id: 'klf-kilifi', name: 'Kilifi Town', countyId: 'kilifi', coordinates: { lat: -3.6305, lng: 39.8499 }, population: 52073 },
    ],
    weather: { countyId: 'kilifi', temperature: 30, humidity: 75, rainfall24h: 28, forecast: [
      { date: '2026-02-02', rainfall: 35, condition: 'rain' },
      { date: '2026-02-03', rainfall: 20, condition: 'rain' },
      { date: '2026-02-04', rainfall: 10, condition: 'cloudy' },
    ]}
  },
  {
    id: 'wajir',
    name: 'Wajir',
    waterAvailability: 18,
    waterStress: 92,
    population: 781263,
    recentRainfall: 5,
    riskLevel: 'severe',
    floodRisk: { countyId: 'wajir', riskLevel: 'low', probability: 5, affectedAreas: [], precautions: ['Focus on drought mitigation'] },
    waterSources: { reservoirs: 0, rivers: 0, boreholes: 34, kiosks: 56 },
    coordinates: { lat: 1.7471, lng: 40.0573 },
    trend: [22, 20, 17, 14, 16, 19, 22, 19, 16, 13, 16, 19, 22, 19, 16, 13, 16, 19, 22, 20, 17, 14, 17, 20, 23, 20, 17, 15, 18, 18],
    towns: [
      { id: 'wjr-wajir', name: 'Wajir Town', countyId: 'wajir', coordinates: { lat: 1.7471, lng: 40.0573 }, population: 89849 },
    ],
    weather: { countyId: 'wajir', temperature: 34, humidity: 28, rainfall24h: 0, forecast: [
      { date: '2026-02-02', rainfall: 0, condition: 'sunny' },
      { date: '2026-02-03', rainfall: 0, condition: 'sunny' },
      { date: '2026-02-04', rainfall: 0, condition: 'sunny' },
    ]}
  },
  {
    id: 'mandera',
    name: 'Mandera',
    waterAvailability: 15,
    waterStress: 94,
    population: 867457,
    recentRainfall: 3,
    riskLevel: 'severe',
    floodRisk: { countyId: 'mandera', riskLevel: 'low', probability: 3, affectedAreas: [], precautions: ['Prioritize water storage'] },
    waterSources: { reservoirs: 0, rivers: 1, boreholes: 28, kiosks: 45 },
    coordinates: { lat: 3.9366, lng: 41.8670 },
    trend: [18, 16, 13, 10, 12, 15, 18, 15, 12, 9, 12, 15, 18, 15, 12, 9, 12, 15, 18, 16, 13, 10, 13, 16, 19, 16, 13, 11, 14, 15],
    towns: [
      { id: 'mnd-mandera', name: 'Mandera Town', countyId: 'mandera', coordinates: { lat: 3.9366, lng: 41.8670 }, population: 61294 },
    ],
    weather: { countyId: 'mandera', temperature: 36, humidity: 22, rainfall24h: 0, forecast: [
      { date: '2026-02-02', rainfall: 0, condition: 'sunny' },
      { date: '2026-02-03', rainfall: 0, condition: 'sunny' },
      { date: '2026-02-04', rainfall: 0, condition: 'sunny' },
    ]}
  },
  {
    id: 'garissa',
    name: 'Garissa',
    waterAvailability: 25,
    waterStress: 88,
    population: 841353,
    recentRainfall: 10,
    riskLevel: 'severe',
    floodRisk: { countyId: 'garissa', riskLevel: 'moderate', probability: 25, affectedAreas: ['Tana River Basin'], precautions: ['Monitor Tana River levels', 'Move livestock to higher ground'] },
    waterSources: { reservoirs: 0, rivers: 1, boreholes: 45, kiosks: 67 },
    coordinates: { lat: -0.4536, lng: 39.6401 },
    trend: [28, 26, 23, 20, 22, 25, 28, 25, 22, 19, 22, 25, 28, 25, 22, 19, 22, 25, 28, 26, 23, 20, 23, 26, 29, 26, 23, 21, 24, 25],
    towns: [
      { id: 'grs-garissa', name: 'Garissa Town', countyId: 'garissa', coordinates: { lat: -0.4536, lng: 39.6401 }, population: 65881 },
    ],
    weather: { countyId: 'garissa', temperature: 33, humidity: 35, rainfall24h: 2, forecast: [
      { date: '2026-02-02', rainfall: 5, condition: 'cloudy' },
      { date: '2026-02-03', rainfall: 0, condition: 'sunny' },
      { date: '2026-02-04', rainfall: 0, condition: 'sunny' },
    ]}
  },
  {
    id: 'nyeri',
    name: 'Nyeri',
    waterAvailability: 80,
    waterStress: 38,
    population: 759164,
    recentRainfall: 75,
    riskLevel: 'stable',
    floodRisk: { countyId: 'nyeri', riskLevel: 'low', probability: 15, affectedAreas: ['River valleys near Mt. Kenya'], precautions: ['Standard monitoring'] },
    waterSources: { reservoirs: 5, rivers: 5, boreholes: 89, kiosks: 134 },
    coordinates: { lat: -0.4197, lng: 36.9553 },
    trend: [76, 78, 80, 82, 79, 76, 74, 77, 80, 83, 80, 77, 75, 78, 81, 83, 80, 77, 75, 78, 81, 84, 81, 78, 76, 79, 82, 84, 81, 80],
    towns: [
      { id: 'nyr-nyeri', name: 'Nyeri Town', countyId: 'nyeri', coordinates: { lat: -0.4197, lng: 36.9553 }, population: 119353 },
    ],
    weather: { countyId: 'nyeri', temperature: 19, humidity: 70, rainfall24h: 20, forecast: [
      { date: '2026-02-02', rainfall: 18, condition: 'rain' },
      { date: '2026-02-03', rainfall: 12, condition: 'rain' },
      { date: '2026-02-04', rainfall: 5, condition: 'cloudy' },
    ]}
  },
  {
    id: 'kakamega',
    name: 'Kakamega',
    waterAvailability: 85,
    waterStress: 30,
    population: 1867579,
    recentRainfall: 85,
    riskLevel: 'stable',
    floodRisk: { countyId: 'kakamega', riskLevel: 'high', probability: 55, predictedDate: '2026-02-03', affectedAreas: ['Budalangi', 'Mumias lowlands'], precautions: ['Evacuate low-lying areas', 'Stock emergency supplies', 'Avoid river crossings'] },
    waterSources: { reservoirs: 6, rivers: 7, boreholes: 134, kiosks: 198 },
    coordinates: { lat: 0.2827, lng: 34.7519 },
    trend: [82, 84, 86, 88, 85, 82, 80, 83, 86, 89, 86, 83, 81, 84, 87, 89, 86, 83, 81, 84, 87, 90, 87, 84, 82, 85, 88, 90, 87, 85],
    towns: [
      { id: 'kkm-kakamega', name: 'Kakamega Town', countyId: 'kakamega', coordinates: { lat: 0.2827, lng: 34.7519 }, population: 99987 },
      { id: 'kkm-mumias', name: 'Mumias', countyId: 'kakamega', coordinates: { lat: 0.3367, lng: 34.4883 }, population: 99987 },
    ],
    weather: { countyId: 'kakamega', temperature: 25, humidity: 80, rainfall24h: 45, forecast: [
      { date: '2026-02-02', rainfall: 55, condition: 'heavy_rain' },
      { date: '2026-02-03', rainfall: 60, condition: 'storm' },
      { date: '2026-02-04', rainfall: 30, condition: 'rain' },
    ]}
  },
  {
    id: 'siaya',
    name: 'Siaya',
    waterAvailability: 68,
    waterStress: 45,
    population: 993183,
    recentRainfall: 65,
    riskLevel: 'moderate',
    floodRisk: { countyId: 'siaya', riskLevel: 'moderate', probability: 38, affectedAreas: ['Yala Swamp', 'Bondo lowlands'], precautions: ['Monitor Lake Victoria levels', 'Avoid Yala swamp during rains'] },
    waterSources: { reservoirs: 2, rivers: 5, boreholes: 78, kiosks: 112 },
    coordinates: { lat: 0.0607, lng: 34.2422 },
    trend: [64, 66, 68, 70, 67, 64, 62, 65, 68, 71, 68, 65, 63, 66, 69, 71, 68, 65, 63, 66, 69, 72, 69, 66, 64, 67, 70, 72, 69, 68],
    towns: [
      { id: 'sya-siaya', name: 'Siaya Town', countyId: 'siaya', coordinates: { lat: 0.0607, lng: 34.2422 }, population: 47168 },
      { id: 'sya-bondo', name: 'Bondo', countyId: 'siaya', coordinates: { lat: -0.0833, lng: 34.2667 }, population: 52754 },
    ],
    weather: { countyId: 'siaya', temperature: 26, humidity: 74, rainfall24h: 18, forecast: [
      { date: '2026-02-02', rainfall: 20, condition: 'rain' },
      { date: '2026-02-03', rainfall: 12, condition: 'cloudy' },
      { date: '2026-02-04', rainfall: 5, condition: 'cloudy' },
    ]}
  },
];

// Generate sample notifications
export const generateNotifications = (userCountyId?: string): Notification[] => {
  const now = new Date();
  const notifications: Notification[] = [
    {
      id: 'notif-1',
      type: 'flood_alert',
      severity: 'critical',
      title: 'Flood Warning: Kakamega',
      message: 'Heavy rainfall expected. Flood risk HIGH in Budalangi and Mumias. Evacuate low-lying areas immediately.',
      countyId: 'kakamega',
      timestamp: new Date(now.getTime() - 30 * 60000),
      read: false,
    },
    {
      id: 'notif-2',
      type: 'flood_alert',
      severity: 'warning',
      title: 'Flood Watch: Mombasa',
      message: 'Coastal flooding possible in Likoni and Kisauni within 24 hours. Move valuables to higher ground.',
      countyId: 'mombasa',
      timestamp: new Date(now.getTime() - 2 * 3600000),
      read: false,
    },
    {
      id: 'notif-3',
      type: 'water_scarcity',
      severity: 'critical',
      title: 'Severe Water Shortage: Turkana',
      message: 'Water availability at 22%. Boreholes running low. Ration water usage and seek alternative sources.',
      countyId: 'turkana',
      timestamp: new Date(now.getTime() - 4 * 3600000),
      read: false,
    },
    {
      id: 'notif-4',
      type: 'weather_alert',
      severity: 'warning',
      title: 'Heavy Rain: Nairobi',
      message: 'Expect 15mm rainfall tomorrow. Flash floods possible in Mathare and Kibera. Clear drainage channels.',
      countyId: 'nairobi',
      timestamp: new Date(now.getTime() - 6 * 3600000),
      read: true,
    },
    {
      id: 'notif-5',
      type: 'daily_insight',
      severity: 'info',
      title: 'Daily Water Report',
      message: 'National water availability stable at 52%. 6 counties under severe stress. 3 flood warnings active.',
      countyId: 'national',
      timestamp: new Date(now.getTime() - 12 * 3600000),
      read: true,
    },
  ];

  // Add user-specific notification if location detected
  if (userCountyId) {
    const userCounty = kenyaCounties.find(c => c.id === userCountyId);
    if (userCounty) {
      notifications.unshift({
        id: 'notif-user',
        type: 'daily_insight',
        severity: 'info',
        title: `${userCounty.name} Daily Update`,
        message: `Water availability: ${userCounty.waterAvailability}%. Stress level: ${userCounty.waterStress}. ${userCounty.floodRisk.riskLevel !== 'low' ? 'Flood risk: ' + userCounty.floodRisk.riskLevel.toUpperCase() : 'No flood warnings.'}`,
        countyId: userCountyId,
        timestamp: now,
        read: false,
      });
    }
  }

  return notifications;
};

export const getCountyByCoordinates = (lat: number, lng: number): CountyData | null => {
  let closest: CountyData | null = null;
  let minDistance = Infinity;

  for (const county of kenyaCounties) {
    const distance = Math.sqrt(
      Math.pow(county.coordinates.lat - lat, 2) + 
      Math.pow(county.coordinates.lng - lng, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closest = county;
    }
  }

  return closest;
};

export const getTownByCoordinates = (lat: number, lng: number): Town | null => {
  let closest: Town | null = null;
  let minDistance = Infinity;

  for (const county of kenyaCounties) {
    for (const town of county.towns) {
      const distance = Math.sqrt(
        Math.pow(town.coordinates.lat - lat, 2) + 
        Math.pow(town.coordinates.lng - lng, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closest = town;
      }
    }
  }

  return closest;
};

export const getNationalStats = () => {
  const totalPopulation = kenyaCounties.reduce((sum, c) => sum + c.population, 0);
  const avgWaterAvailability = kenyaCounties.reduce((sum, c) => sum + c.waterAvailability, 0) / kenyaCounties.length;
  const avgWaterStress = kenyaCounties.reduce((sum, c) => sum + c.waterStress, 0) / kenyaCounties.length;
  const avgRainfall = kenyaCounties.reduce((sum, c) => sum + c.recentRainfall, 0) / kenyaCounties.length;
  
  const severeCount = kenyaCounties.filter(c => c.riskLevel === 'severe').length;
  const moderateCount = kenyaCounties.filter(c => c.riskLevel === 'moderate').length;
  const stableCount = kenyaCounties.filter(c => c.riskLevel === 'stable').length;
  
  const highFloodRisk = kenyaCounties.filter(c => c.floodRisk.riskLevel === 'high' || c.floodRisk.riskLevel === 'critical').length;

  return {
    totalPopulation,
    avgWaterAvailability: Math.round(avgWaterAvailability),
    avgWaterStress: Math.round(avgWaterStress),
    avgRainfall: Math.round(avgRainfall),
    severeCount,
    moderateCount,
    stableCount,
    highFloodRisk,
    totalCounties: kenyaCounties.length
  };
};

export const getWaterSourcesByCounty = (countyId: string): WaterSource[] => {
  return waterSources.filter(ws => ws.countyId === countyId);
};
