export interface CountyData {
  id: string;
  name: string;
  waterAvailability: number; // 0-100%
  waterStress: number; // 0-100
  population: number;
  recentRainfall: number; // mm
  riskLevel: 'stable' | 'moderate' | 'severe';
  waterSources: {
    reservoirs: number;
    rivers: number;
    boreholes: number;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
  trend: number[]; // 30-day history
}

export const kenyaCounties: CountyData[] = [
  {
    id: 'nairobi',
    name: 'Nairobi',
    waterAvailability: 65,
    waterStress: 72,
    population: 4397073,
    recentRainfall: 45,
    riskLevel: 'moderate',
    waterSources: { reservoirs: 3, rivers: 2, boreholes: 156 },
    coordinates: { lat: -1.2921, lng: 36.8219 },
    trend: [60, 62, 58, 55, 60, 63, 65, 62, 58, 61, 64, 66, 63, 60, 58, 62, 65, 67, 64, 61, 59, 63, 66, 68, 65, 62, 60, 64, 67, 65]
  },
  {
    id: 'mombasa',
    name: 'Mombasa',
    waterAvailability: 55,
    waterStress: 78,
    population: 1208333,
    recentRainfall: 32,
    riskLevel: 'severe',
    waterSources: { reservoirs: 1, rivers: 0, boreholes: 89 },
    coordinates: { lat: -4.0435, lng: 39.6682 },
    trend: [58, 55, 52, 50, 48, 52, 55, 53, 50, 48, 52, 55, 58, 55, 52, 50, 53, 56, 54, 51, 49, 52, 55, 57, 54, 51, 49, 53, 56, 55]
  },
  {
    id: 'kisumu',
    name: 'Kisumu',
    waterAvailability: 82,
    waterStress: 35,
    population: 1155574,
    recentRainfall: 78,
    riskLevel: 'stable',
    waterSources: { reservoirs: 5, rivers: 4, boreholes: 67 },
    coordinates: { lat: -0.1022, lng: 34.7617 },
    trend: [78, 80, 82, 85, 83, 81, 79, 82, 84, 86, 83, 80, 78, 81, 83, 85, 82, 79, 77, 80, 82, 84, 81, 78, 76, 79, 81, 83, 80, 82]
  },
  {
    id: 'nakuru',
    name: 'Nakuru',
    waterAvailability: 70,
    waterStress: 55,
    population: 2162202,
    recentRainfall: 55,
    riskLevel: 'moderate',
    waterSources: { reservoirs: 4, rivers: 3, boreholes: 112 },
    coordinates: { lat: -0.3031, lng: 36.0800 },
    trend: [65, 68, 70, 72, 69, 66, 64, 67, 70, 72, 69, 66, 64, 67, 70, 73, 70, 67, 65, 68, 71, 73, 70, 67, 65, 68, 71, 73, 70, 70]
  },
  {
    id: 'turkana',
    name: 'Turkana',
    waterAvailability: 22,
    waterStress: 95,
    population: 926976,
    recentRainfall: 8,
    riskLevel: 'severe',
    waterSources: { reservoirs: 0, rivers: 1, boreholes: 23 },
    coordinates: { lat: 3.1166, lng: 35.5966 },
    trend: [25, 23, 20, 18, 16, 18, 21, 23, 20, 17, 15, 18, 21, 24, 21, 18, 16, 19, 22, 24, 21, 18, 16, 19, 22, 25, 22, 19, 17, 22]
  },
  {
    id: 'kiambu',
    name: 'Kiambu',
    waterAvailability: 75,
    waterStress: 48,
    population: 2417735,
    recentRainfall: 62,
    riskLevel: 'stable',
    waterSources: { reservoirs: 6, rivers: 5, boreholes: 178 },
    coordinates: { lat: -1.1714, lng: 36.8356 },
    trend: [70, 72, 75, 77, 74, 71, 69, 72, 75, 78, 75, 72, 70, 73, 76, 78, 75, 72, 70, 73, 76, 79, 76, 73, 71, 74, 77, 79, 76, 75]
  },
  {
    id: 'machakos',
    name: 'Machakos',
    waterAvailability: 45,
    waterStress: 68,
    population: 1421932,
    recentRainfall: 28,
    riskLevel: 'moderate',
    waterSources: { reservoirs: 2, rivers: 2, boreholes: 95 },
    coordinates: { lat: -1.5177, lng: 37.2634 },
    trend: [48, 46, 43, 40, 42, 45, 48, 45, 42, 39, 42, 45, 48, 45, 42, 39, 42, 45, 48, 46, 43, 40, 43, 46, 49, 46, 43, 41, 44, 45]
  },
  {
    id: 'kajiado',
    name: 'Kajiado',
    waterAvailability: 38,
    waterStress: 75,
    population: 1117840,
    recentRainfall: 22,
    riskLevel: 'severe',
    waterSources: { reservoirs: 1, rivers: 1, boreholes: 56 },
    coordinates: { lat: -1.8524, lng: 36.7820 },
    trend: [42, 40, 37, 34, 36, 39, 42, 39, 36, 33, 36, 39, 42, 39, 36, 33, 36, 39, 42, 40, 37, 34, 37, 40, 43, 40, 37, 35, 38, 38]
  },
  {
    id: 'uasingishu',
    name: 'Uasin Gishu',
    waterAvailability: 78,
    waterStress: 42,
    population: 1163186,
    recentRainfall: 70,
    riskLevel: 'stable',
    waterSources: { reservoirs: 4, rivers: 3, boreholes: 89 },
    coordinates: { lat: 0.5143, lng: 35.2698 },
    trend: [75, 77, 79, 81, 78, 75, 73, 76, 79, 82, 79, 76, 74, 77, 80, 82, 79, 76, 74, 77, 80, 83, 80, 77, 75, 78, 81, 83, 80, 78]
  },
  {
    id: 'meru',
    name: 'Meru',
    waterAvailability: 72,
    waterStress: 52,
    population: 1545714,
    recentRainfall: 58,
    riskLevel: 'stable',
    waterSources: { reservoirs: 3, rivers: 4, boreholes: 102 },
    coordinates: { lat: 0.0500, lng: 37.6500 },
    trend: [68, 70, 72, 74, 71, 68, 66, 69, 72, 75, 72, 69, 67, 70, 73, 75, 72, 69, 67, 70, 73, 76, 73, 70, 68, 71, 74, 76, 73, 72]
  },
  {
    id: 'kilifi',
    name: 'Kilifi',
    waterAvailability: 48,
    waterStress: 70,
    population: 1453787,
    recentRainfall: 35,
    riskLevel: 'moderate',
    waterSources: { reservoirs: 2, rivers: 2, boreholes: 78 },
    coordinates: { lat: -3.6305, lng: 39.8499 },
    trend: [50, 48, 45, 42, 44, 47, 50, 47, 44, 41, 44, 47, 50, 47, 44, 41, 44, 47, 50, 48, 45, 42, 45, 48, 51, 48, 45, 43, 46, 48]
  },
  {
    id: 'wajir',
    name: 'Wajir',
    waterAvailability: 18,
    waterStress: 92,
    population: 781263,
    recentRainfall: 5,
    riskLevel: 'severe',
    waterSources: { reservoirs: 0, rivers: 0, boreholes: 34 },
    coordinates: { lat: 1.7471, lng: 40.0573 },
    trend: [22, 20, 17, 14, 16, 19, 22, 19, 16, 13, 16, 19, 22, 19, 16, 13, 16, 19, 22, 20, 17, 14, 17, 20, 23, 20, 17, 15, 18, 18]
  },
  {
    id: 'mandera',
    name: 'Mandera',
    waterAvailability: 15,
    waterStress: 94,
    population: 867457,
    recentRainfall: 3,
    riskLevel: 'severe',
    waterSources: { reservoirs: 0, rivers: 1, boreholes: 28 },
    coordinates: { lat: 3.9366, lng: 41.8670 },
    trend: [18, 16, 13, 10, 12, 15, 18, 15, 12, 9, 12, 15, 18, 15, 12, 9, 12, 15, 18, 16, 13, 10, 13, 16, 19, 16, 13, 11, 14, 15]
  },
  {
    id: 'garissa',
    name: 'Garissa',
    waterAvailability: 25,
    waterStress: 88,
    population: 841353,
    recentRainfall: 10,
    riskLevel: 'severe',
    waterSources: { reservoirs: 0, rivers: 1, boreholes: 45 },
    coordinates: { lat: -0.4536, lng: 39.6401 },
    trend: [28, 26, 23, 20, 22, 25, 28, 25, 22, 19, 22, 25, 28, 25, 22, 19, 22, 25, 28, 26, 23, 20, 23, 26, 29, 26, 23, 21, 24, 25]
  },
  {
    id: 'nyeri',
    name: 'Nyeri',
    waterAvailability: 80,
    waterStress: 38,
    population: 759164,
    recentRainfall: 75,
    riskLevel: 'stable',
    waterSources: { reservoirs: 5, rivers: 5, boreholes: 89 },
    coordinates: { lat: -0.4197, lng: 36.9553 },
    trend: [76, 78, 80, 82, 79, 76, 74, 77, 80, 83, 80, 77, 75, 78, 81, 83, 80, 77, 75, 78, 81, 84, 81, 78, 76, 79, 82, 84, 81, 80]
  },
  {
    id: 'kakamega',
    name: 'Kakamega',
    waterAvailability: 85,
    waterStress: 30,
    population: 1867579,
    recentRainfall: 85,
    riskLevel: 'stable',
    waterSources: { reservoirs: 6, rivers: 7, boreholes: 134 },
    coordinates: { lat: 0.2827, lng: 34.7519 },
    trend: [82, 84, 86, 88, 85, 82, 80, 83, 86, 89, 86, 83, 81, 84, 87, 89, 86, 83, 81, 84, 87, 90, 87, 84, 82, 85, 88, 90, 87, 85]
  },
  {
    id: 'siaya',
    name: 'Siaya',
    waterAvailability: 68,
    waterStress: 45,
    population: 993183,
    recentRainfall: 65,
    riskLevel: 'moderate',
    waterSources: { reservoirs: 2, rivers: 5, boreholes: 78 },
    coordinates: { lat: 0.0607, lng: 34.2422 },
    trend: [64, 66, 68, 70, 67, 64, 62, 65, 68, 71, 68, 65, 63, 66, 69, 71, 68, 65, 63, 66, 69, 72, 69, 66, 64, 67, 70, 72, 69, 68]
  },
];

export const getCountyByCoordinates = (lat: number, lng: number): CountyData | null => {
  // Simple distance-based matching
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

export const getNationalStats = () => {
  const totalPopulation = kenyaCounties.reduce((sum, c) => sum + c.population, 0);
  const avgWaterAvailability = kenyaCounties.reduce((sum, c) => sum + c.waterAvailability, 0) / kenyaCounties.length;
  const avgWaterStress = kenyaCounties.reduce((sum, c) => sum + c.waterStress, 0) / kenyaCounties.length;
  const avgRainfall = kenyaCounties.reduce((sum, c) => sum + c.recentRainfall, 0) / kenyaCounties.length;
  
  const severeCount = kenyaCounties.filter(c => c.riskLevel === 'severe').length;
  const moderateCount = kenyaCounties.filter(c => c.riskLevel === 'moderate').length;
  const stableCount = kenyaCounties.filter(c => c.riskLevel === 'stable').length;

  return {
    totalPopulation,
    avgWaterAvailability: Math.round(avgWaterAvailability),
    avgWaterStress: Math.round(avgWaterStress),
    avgRainfall: Math.round(avgRainfall),
    severeCount,
    moderateCount,
    stableCount,
    totalCounties: kenyaCounties.length
  };
};
