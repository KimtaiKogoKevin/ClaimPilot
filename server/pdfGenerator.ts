import type { ClaimWithDetails } from "@shared/schema";

export async function generateClaimPDF(claim: ClaimWithDetails): Promise<Buffer> {
  // Import jsPDF for proper PDF generation
  const { jsPDF } = await import('jspdf');
  
  try {
    // Create a new PDF document
    const doc = new jsPDF();
    let yPosition = 20;
    const lineHeight = 7;
    const pageHeight = 280; // A4 page height minus margins
    const leftColumn = 20;
    const rightColumn = 110;
    
    // Helper function to add text with line breaks
    const addText = (text: string, x: number = 20, fontSize: number = 10, isBold: boolean = false) => {
      if (yPosition > pageHeight) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(fontSize);
      doc.text(text, x, yPosition);
      yPosition += lineHeight;
    };
    
    // Helper function to add form-style field
    const addFormField = (label: string, value: string, x: number = leftColumn, width: number = 85) => {
      if (yPosition > pageHeight) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Draw border around field
      doc.setDrawColor(200, 200, 200);
      doc.rect(x, yPosition - 5, width, 12);
      
      // Add label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(label, x + 2, yPosition - 1);
      
      // Add value
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(value || 'N/A', x + 2, yPosition + 4);
      
      yPosition += 18;
    };
    
    // Helper function to add two-column form fields
    const addTwoColumnFields = (leftLabel: string, leftValue: string, rightLabel: string, rightValue: string) => {
      if (yPosition > pageHeight) {
        doc.addPage();
        yPosition = 20;
      }
      
      const currentY = yPosition;
      
      // Left field
      doc.setDrawColor(200, 200, 200);
      doc.rect(leftColumn, currentY - 5, 85, 12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(leftLabel, leftColumn + 2, currentY - 1);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(leftValue || 'N/A', leftColumn + 2, currentY + 4);
      
      // Right field
      doc.setDrawColor(200, 200, 200);
      doc.rect(rightColumn, currentY - 5, 85, 12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(rightLabel, rightColumn + 2, currentY - 1);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(rightValue || 'N/A', rightColumn + 2, currentY + 4);
      
      yPosition += 18;
    };
    
    const addSectionHeader = (title: string) => {
      yPosition += 10;
      if (yPosition > pageHeight) {
        doc.addPage();
        yPosition = 30;
      }
      
      // Section background
      doc.setFillColor(240, 240, 240);
      doc.rect(leftColumn, yPosition - 8, 175, 15, 'F');
      
      // Section title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(50, 50, 50);
      doc.text(title, leftColumn + 5, yPosition);
      yPosition += 15;
    };
    
    // Main Title
    doc.setFillColor(25, 118, 210);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('MOTOR ACCIDENT INSURANCE CLAIM', 20, 20);
    yPosition = 45;
    
    // Claim Overview Section
    addSectionHeader('SECTION A: CLAIM INFORMATION');
    addTwoColumnFields('Policy Number', claim.policyNumber || '', 'Claim ID', claim.id.substring(0, 8));
    addTwoColumnFields('Branch Name', claim.branchName || '', 'Agent Name', claim.agentName || '');
    addTwoColumnFields('Date of Last Premium Payment', claim.lastPaymentDate ? new Date(claim.lastPaymentDate).toLocaleDateString() : '', 'Period of Insurance', 'N/A');
    addFormField('Status', claim.status.replace('_', ' ').toUpperCase());
    
    // Section B: Insured Details
    addSectionHeader('SECTION B: INSURED DETAILS');
    addFormField('Type of Insured', claim.insuredType);
    
    if (claim.individualDetails) {
      addTwoColumnFields('First Name', claim.individualDetails.firstName || '', 'Middle Name', claim.individualDetails.middleName || '');
      addTwoColumnFields('Surname', claim.individualDetails.surname || '', 'ID Number', claim.individualDetails.idNumber || '');
      addTwoColumnFields('Nationality', claim.individualDetails.nationality || '', 'Mobile Number', claim.individualDetails.mobile || '');
      addTwoColumnFields('Email Address', claim.individualDetails.email || '', 'Physical Address', claim.individualDetails.physicalAddress || '');
    }
    
    if (claim.corporateDetails) {
      addTwoColumnFields('Registered Name', claim.corporateDetails.registeredName || '', 'Registration Number', claim.corporateDetails.registrationNumber || '');
      addTwoColumnFields('Years in Operation', claim.corporateDetails.yearsInOperation?.toString() || '', 'Physical Address', claim.corporateDetails.physicalAddress || '');
    }
    
    // Section C: Vehicle Information
    if (claim.vehicle) {
      addSectionHeader('SECTION C: VEHICLE INFORMATION');
      addTwoColumnFields('Make', claim.vehicle.make || '', 'Model', claim.vehicle.model || '');
      addTwoColumnFields('Year of Manufacture', claim.vehicle.yearOfManufacture?.toString() || '', 'Registration Number', claim.vehicle.registrationNumber || '');
      addTwoColumnFields('Owner Name', claim.vehicle.ownerName || '', 'Vehicle Use', claim.vehicle.vehicleUse || '');
    }
    
    // Section D: Driver Information
    if (claim.driver) {
      addSectionHeader('SECTION D: DRIVER INFORMATION');
      addTwoColumnFields('Driver Name', claim.driver.name || '', 'License Number', claim.driver.licenseNumber || '');
      addTwoColumnFields('Years of Driving Experience', claim.driver.yearsOfDriving?.toString() || '', 'Occupation', claim.driver.occupation || '');
      addTwoColumnFields('Address', claim.driver.address || '', 'Telephone', claim.driver.telephone || '');
      addTwoColumnFields('Employed by Insured', claim.driver.employedByInsured ? 'Yes' : 'No', 'Previous Accidents', claim.driver.previousAccidents ? 'Yes' : 'No');
    }
    
    // Section E: Bank Details
    if (claim.bankDetails) {
      addSectionHeader('SECTION E: BANK DETAILS');
      addTwoColumnFields('Bank Name', claim.bankDetails.bankName || '', 'Account Name', claim.bankDetails.accountName || '');
      addTwoColumnFields('Account Number', claim.bankDetails.accountNumber || '', 'Branch', claim.bankDetails.branch || '');
      addTwoColumnFields('Swift Code', claim.bankDetails.swiftCode || '', 'Sort Code', claim.bankDetails.sortCode || '');
    }
    
    // Section F: Other Vehicles Involved
    if (claim.otherVehicles && claim.otherVehicles.length > 0) {
      addSectionHeader('SECTION F: OTHER VEHICLES INVOLVED');
      claim.otherVehicles.forEach((vehicle, index) => {
        yPosition += 5;
        addText(`Vehicle ${index + 1}:`, leftColumn, 10, true);
        addTwoColumnFields('Owner Name', vehicle.ownerName || '', 'Registration Number', vehicle.registrationNumber || '');
        addTwoColumnFields('Owner Address', vehicle.ownerAddress || '', 'Insurer', vehicle.insurer || '');
      });
    }
    
    // Section G: Accident Details
    addSectionHeader('SECTION G: ACCIDENT DETAILS');
    addTwoColumnFields('Accident Date', claim.accidentDate ? new Date(claim.accidentDate).toLocaleDateString() : '', 'Accident Time', claim.accidentTime || '');
    addFormField('Accident Location', claim.accidentLocation || '');
    
    // Description box
    if (claim.accidentDescription) {
      yPosition += 5;
      doc.setDrawColor(200, 200, 200);
      doc.rect(leftColumn, yPosition - 5, 175, 30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Accident Description', leftColumn + 2, yPosition - 1);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      
      // Split long text into multiple lines
      const lines = doc.splitTextToSize(claim.accidentDescription, 170);
      lines.forEach((line: string, index: number) => {
        doc.text(line, leftColumn + 2, yPosition + 6 + (index * 5));
      });
      yPosition += 35;
    }
    
    // Section H: Damage Assessment
    if (claim.damagedPhotos && claim.damagedPhotos.length > 0) {
      addSectionHeader('SECTION H: DAMAGE ASSESSMENT');
      addFormField('Number of Photos Submitted', claim.damagedPhotos.length.toString());
      
      const totalDamages = claim.damagedPhotos.reduce((sum, photo) => sum + (photo.detectedDamages?.length || 0), 0);
      addFormField('AI Detected Damages', totalDamages.toString());
      
      claim.damagedPhotos.forEach((photo, index) => {
        addTwoColumnFields(`Photo ${index + 1} - ${photo.angle}`, photo.isGoodsPhoto ? 'Goods Photo' : 'Vehicle Photo', 'Damages Detected', (photo.detectedDamages?.length || 0).toString());
      });
    }
    
    // Footer
    yPosition += 20;
    if (yPosition > pageHeight) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFillColor(240, 240, 240);
    doc.rect(leftColumn, yPosition, 175, 15, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, leftColumn + 5, yPosition + 8);
    doc.text(`Claim Status: ${claim.status.replace('_', ' ').toUpperCase()}`, rightColumn + 20, yPosition + 8);
    
    // Convert to buffer and return
    return Buffer.from(doc.output('arraybuffer'));
    
  } catch (error) {
    console.error("PDF generation failed:", error);
    // Fallback to text-based PDF
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text('CLAIM REPORT - PDF GENERATION ERROR', 20, 20);
    doc.text(`Claim ID: ${claim.id}`, 20, 40);
    doc.text(`Status: ${claim.status}`, 20, 50);
    doc.text('Please contact support for detailed report.', 20, 70);
    
    return Buffer.from(doc.output('arraybuffer'));
  }
}