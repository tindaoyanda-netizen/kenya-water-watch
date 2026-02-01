import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CountyData, getWaterSourcesByCounty } from '@/data/aquaguardData';

export const generateCountyReport = (county: CountyData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(15, 52, 96); // water-dark
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('AquaGuard Kenya', 14, 20);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Water & Weather Status Report', 14, 30);
  
  // Date
  doc.setFontSize(10);
  doc.text(new Date().toLocaleDateString('en-KE', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }), 14, 38);
  
  // County Name & Risk Level
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${county.name} County`, 14, 60);
  
  // Risk Badge
  const riskColors: Record<string, [number, number, number]> = {
    stable: [34, 197, 94],
    moderate: [234, 179, 8],
    severe: [239, 68, 68]
  };
  const riskColor = riskColors[county.riskLevel] || [128, 128, 128];
  doc.setFillColor(...riskColor);
  doc.roundedRect(14, 65, 35, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(county.riskLevel.toUpperCase(), 16, 71);
  
  // Flood Risk Badge
  const floodColors: Record<string, [number, number, number]> = {
    low: [34, 197, 94],
    moderate: [234, 179, 8],
    high: [239, 68, 68],
    critical: [185, 28, 28]
  };
  const floodColor = floodColors[county.floodRisk.riskLevel] || [128, 128, 128];
  doc.setFillColor(...floodColor);
  doc.roundedRect(52, 65, 45, 8, 2, 2, 'F');
  doc.text(`FLOOD: ${county.floodRisk.riskLevel.toUpperCase()}`, 54, 71);
  
  // Key Metrics Section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Key Metrics', 14, 85);
  
  // Metrics Table
  const metricsData = [
    ['Water Availability', `${county.waterAvailability}%`],
    ['Water Stress Score', county.waterStress.toString()],
    ['Population', county.population.toLocaleString()],
    ['Recent Rainfall', `${county.recentRainfall}mm`],
    ['Temperature', `${county.weather.temperature}°C`],
    ['Humidity', `${county.weather.humidity}%`],
    ['Flood Probability', `${county.floodRisk.probability}%`],
    ['Location', `${county.coordinates.lat.toFixed(4)}, ${county.coordinates.lng.toFixed(4)}`]
  ];
  
  autoTable(doc, {
    startY: 90,
    head: [['Metric', 'Value']],
    body: metricsData,
    theme: 'striped',
    headStyles: { fillColor: [15, 52, 96], textColor: [255, 255, 255] },
    styles: { fontSize: 10 },
    columnStyles: { 0: { fontStyle: 'bold' } }
  });
  
  // Water Sources Section
  const waterTableY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Water Sources', 14, waterTableY);
  
  const waterSourcesData = [
    ['Reservoirs', county.waterSources.reservoirs.toString()],
    ['Rivers', county.waterSources.rivers.toString()],
    ['Boreholes', county.waterSources.boreholes.toString()],
    ['Water Kiosks', county.waterSources.kiosks.toString()],
    ['Total Sources', (county.waterSources.reservoirs + county.waterSources.rivers + county.waterSources.boreholes + county.waterSources.kiosks).toString()]
  ];
  
  autoTable(doc, {
    startY: waterTableY + 5,
    head: [['Source Type', 'Count']],
    body: waterSourcesData,
    theme: 'striped',
    headStyles: { fillColor: [45, 152, 218], textColor: [255, 255, 255] },
    styles: { fontSize: 10 }
  });
  
  // Nearby Water Sources
  const nearbyWaterSources = getWaterSourcesByCounty(county.id);
  if (nearbyWaterSources.length > 0) {
    const nearbyY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Nearby Water Sources', 14, nearbyY);
    
    const nearbyData = nearbyWaterSources.map(source => [
      source.name,
      source.type.charAt(0).toUpperCase() + source.type.slice(1),
      `${source.currentLevel}%`,
      source.status.toUpperCase()
    ]);
    
    autoTable(doc, {
      startY: nearbyY + 5,
      head: [['Name', 'Type', 'Level', 'Status']],
      body: nearbyData,
      theme: 'striped',
      headStyles: { fillColor: [75, 85, 99], textColor: [255, 255, 255] },
      styles: { fontSize: 9 }
    });
  }
  
  // Weather Forecast
  const weatherY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('3-Day Weather Forecast', 14, weatherY);
  
  const forecastData = county.weather.forecast.map(f => [
    new Date(f.date).toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' }),
    `${f.rainfall}mm`,
    f.condition.replace('_', ' ').toUpperCase()
  ]);
  
  autoTable(doc, {
    startY: weatherY + 5,
    head: [['Date', 'Rainfall', 'Condition']],
    body: forecastData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
    styles: { fontSize: 10 }
  });
  
  // Flood Precautions (if applicable)
  if (county.floodRisk.riskLevel !== 'low' && county.floodRisk.precautions.length > 0) {
    const precautionY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(239, 68, 68);
    doc.text('Flood Precautions', 14, precautionY);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    county.floodRisk.precautions.forEach((precaution, index) => {
      doc.text(`• ${precaution}`, 18, precautionY + 8 + (index * 6));
    });
    
    if (county.floodRisk.predictedDate) {
      const predY = precautionY + 8 + (county.floodRisk.precautions.length * 6) + 4;
      doc.setTextColor(239, 68, 68);
      doc.setFont('helvetica', 'bold');
      doc.text(`Predicted Date: ${new Date(county.floodRisk.predictedDate).toLocaleDateString()}`, 14, predY);
    }
  }
  
  // Trend Analysis Section (new page)
  doc.addPage();
  
  doc.setFillColor(15, 52, 96);
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('30-Day Water Availability Trend Analysis', 14, 17);
  
  // Trend data table
  doc.setTextColor(0, 0, 0);
  const trendData = county.trend.map((value, index) => [
    `Day ${index + 1}`,
    `${value}%`
  ]);
  
  // Split into two columns
  const halfLength = Math.ceil(trendData.length / 2);
  const leftColumn = trendData.slice(0, halfLength);
  const rightColumn = trendData.slice(halfLength);
  
  autoTable(doc, {
    startY: 35,
    head: [['Day', 'Availability']],
    body: leftColumn,
    theme: 'grid',
    headStyles: { fillColor: [45, 152, 218], textColor: [255, 255, 255] },
    styles: { fontSize: 8 },
    tableWidth: 80,
    margin: { left: 14 }
  });
  
  autoTable(doc, {
    startY: 35,
    head: [['Day', 'Availability']],
    body: rightColumn,
    theme: 'grid',
    headStyles: { fillColor: [45, 152, 218], textColor: [255, 255, 255] },
    styles: { fontSize: 8 },
    tableWidth: 80,
    margin: { left: 110 }
  });
  
  // Analysis Summary
  const trendEnd = county.trend[county.trend.length - 1];
  const trendStart = county.trend[0];
  const trendChange = trendEnd - trendStart;
  const avgValue = county.trend.reduce((a, b) => a + b, 0) / county.trend.length;
  
  const summaryY = Math.max((doc as any).lastAutoTable.finalY, 200) + 15;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Trend Summary', 14, summaryY);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Starting Value: ${trendStart}%`, 18, summaryY + 10);
  doc.text(`• Ending Value: ${trendEnd}%`, 18, summaryY + 18);
  doc.text(`• Change: ${trendChange > 0 ? '+' : ''}${trendChange}%`, 18, summaryY + 26);
  doc.text(`• Average: ${avgValue.toFixed(1)}%`, 18, summaryY + 34);
  doc.text(`• Trend Direction: ${trendChange > 0 ? 'Improving' : trendChange < 0 ? 'Declining' : 'Stable'}`, 18, summaryY + 42);
  
  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated by AquaGuard Kenya | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Save
  doc.save(`AquaGuard_${county.name}_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};
