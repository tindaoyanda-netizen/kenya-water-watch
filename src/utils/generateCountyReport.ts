import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CountyData } from '@/data/kenyaCounties';

export const generateCountyReport = (county: CountyData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor: [number, number, number] = [14, 116, 144]; // teal-600
  const textColor: [number, number, number] = [30, 41, 59]; // slate-800
  const mutedColor: [number, number, number] = [100, 116, 139]; // slate-500
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Kenya Water Watch', 14, 20);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Water Status Report', 14, 30);
  
  // Report date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, pageWidth - 14, 30, { align: 'right' });
  
  // County Title
  doc.setTextColor(...textColor);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${county.name} County`, 14, 55);
  
  // Risk Level Badge
  const riskColors: Record<string, [number, number, number]> = {
    stable: [34, 197, 94],
    moderate: [234, 179, 8],
    severe: [239, 68, 68]
  };
  const riskColor = riskColors[county.riskLevel] || mutedColor;
  doc.setFillColor(...riskColor);
  doc.roundedRect(14, 60, 40, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(county.riskLevel.toUpperCase() + ' RISK', 34, 65.5, { align: 'center' });
  
  // Key Metrics Section
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Key Metrics', 14, 82);
  
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(14, 84, pageWidth - 14, 84);
  
  // Metrics Table
  autoTable(doc, {
    startY: 88,
    head: [['Metric', 'Value', 'Status']],
    body: [
      [
        'Water Availability Index',
        `${county.waterAvailability}%`,
        county.waterAvailability >= 70 ? 'Good' : county.waterAvailability >= 40 ? 'Moderate' : 'Critical'
      ],
      [
        'Water Stress Score',
        `${county.waterStress}/100`,
        county.waterStress <= 40 ? 'Low Stress' : county.waterStress <= 70 ? 'Moderate Stress' : 'High Stress'
      ],
      [
        'Population Affected',
        county.population.toLocaleString(),
        '-'
      ],
    ],
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    bodyStyles: {
      textColor: textColor,
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249],
    },
    margin: { left: 14, right: 14 },
  });
  
  // Water Sources Section
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Water Sources', 14, finalY);
  
  doc.line(14, finalY + 2, pageWidth - 14, finalY + 2);
  
  autoTable(doc, {
    startY: finalY + 6,
    head: [['Source Type', 'Count']],
    body: [
      ['Reservoirs', county.waterSources.reservoirs.toString()],
      ['Rivers', county.waterSources.rivers.toString()],
      ['Boreholes', county.waterSources.boreholes.toString()],
    ],
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    bodyStyles: {
      textColor: textColor,
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249],
    },
    margin: { left: 14, right: 14 },
    tableWidth: 100,
  });
  
  // 30-Day Trend Section
  const sourcesY = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('30-Day Water Availability Trend', 14, sourcesY);
  
  doc.line(14, sourcesY + 2, pageWidth - 14, sourcesY + 2);
  
  // Trend data table
  const trendData = county.trend.map((value, index) => [
    `Day ${index + 1}`,
    `${value}%`
  ]);
  
  // Split into two columns
  const halfLength = Math.ceil(trendData.length / 2);
  const leftColumn = trendData.slice(0, halfLength);
  const rightColumn = trendData.slice(halfLength);
  
  autoTable(doc, {
    startY: sourcesY + 6,
    head: [['Day', 'Availability', 'Day', 'Availability']],
    body: leftColumn.map((left, i) => {
      const right = rightColumn[i] || ['', ''];
      return [...left, ...right];
    }),
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    bodyStyles: {
      textColor: textColor,
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249],
    },
    margin: { left: 14, right: 14 },
  });
  
  // Trend Analysis
  const trendY = (doc as any).lastAutoTable.finalY + 10;
  const trendDirection = county.trend[county.trend.length - 1] > county.trend[0];
  const avgTrend = county.trend.reduce((a, b) => a + b, 0) / county.trend.length;
  
  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Trend Analysis: Water availability is ${trendDirection ? 'improving' : 'declining'} over the 30-day period.`, 14, trendY);
  doc.text(`Average availability: ${avgTrend.toFixed(1)}%`, 14, trendY + 6);
  
  // Location Info
  const locationY = trendY + 18;
  doc.setTextColor(...mutedColor);
  doc.setFontSize(10);
  doc.text(`Coordinates: ${county.coordinates.lat.toFixed(4)}°N, ${county.coordinates.lng.toFixed(4)}°E`, 14, locationY);
  
  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.3);
  doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);
  
  doc.setTextColor(...mutedColor);
  doc.setFontSize(9);
  doc.text('Kenya Water Watch - Real-Time Water Monitoring Platform', 14, footerY);
  doc.text('www.kenyawaterwatch.org', pageWidth - 14, footerY, { align: 'right' });
  
  // Save the PDF
  doc.save(`${county.name}_Water_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};
