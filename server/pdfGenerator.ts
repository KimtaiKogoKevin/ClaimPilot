import type { ClaimWithDetails } from "@shared/schema";

export async function generateClaimPDF(claim: ClaimWithDetails): Promise<Buffer> {
  // Import jsPDF for proper PDF generation
  const { jsPDF } = await import('jspdf');
  
  try {
    // Create a new PDF document
    const doc = new jsPDF();
    let yPosition = 20;
    const lineHeight = 6;
    const pageHeight = 280; // A4 page height minus margins
    
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
    
    const addSection = (title: string) => {
      yPosition += 5;
      addText(title, 20, 12, true);
      yPosition += 2;
    };
    
    // Title
    addText('MOTOR ACCIDENT INSURANCE CLAIM REPORT', 20, 16, true);
    addText('=====================================', 20);
    yPosition += 5;
    
    // Basic claim info
    addText(`Claim ID: ${claim.id}`);
    addText(`Policy Number: ${claim.policyNumber || 'N/A'}`);
    addText(`Status: ${claim.status.replace('_', ' ').toUpperCase()}`);
    addText(`Date Created: ${new Date(claim.createdAt!).toLocaleDateString()}`);
    if (claim.submittedAt) {
      addText(`Date Submitted: ${new Date(claim.submittedAt).toLocaleDateString()}`);
    }
    
    // Claimant Information
    addSection('CLAIMANT INFORMATION');
    addText(`Name: ${claim.claimant.firstName} ${claim.claimant.lastName}`);
    addText(`Email: ${claim.claimant.email}`);
    
    // Policy Details
    addSection('POLICY DETAILS');
    addText(`Branch: ${claim.branchName || 'N/A'}`);
    addText(`Agent: ${claim.agentName || 'N/A'}`);
    addText(`Last Payment: ${claim.lastPaymentDate ? new Date(claim.lastPaymentDate).toLocaleDateString() : 'N/A'}`);
    addText(`Insured Type: ${claim.insuredType}`);
    
    // Accident Details
    addSection('ACCIDENT DETAILS');
    addText(`Date: ${claim.accidentDate ? new Date(claim.accidentDate).toLocaleDateString() : 'N/A'}`);
    addText(`Time: ${claim.accidentTime || 'N/A'}`);
    addText(`Location: ${claim.accidentLocation || 'N/A'}`);
    addText(`Description: ${claim.accidentDescription || 'N/A'}`);
    
    // Vehicle Information
    if (claim.vehicle) {
      addSection('VEHICLE INFORMATION');
      addText(`Make: ${claim.vehicle.make}`);
      addText(`Model: ${claim.vehicle.model}`);
      addText(`Year: ${claim.vehicle.yearOfManufacture || 'N/A'}`);
      addText(`Registration: ${claim.vehicle.registrationNumber || 'N/A'}`);
      addText(`Owner: ${claim.vehicle.ownerName || 'N/A'}`);
    }
    
    // Individual Details
    if (claim.individualDetails) {
      addSection('INDIVIDUAL DETAILS');
      addText(`Full Name: ${claim.individualDetails.firstName} ${claim.individualDetails.middleName || ''} ${claim.individualDetails.surname}`);
      addText(`ID Number: ${claim.individualDetails.idNumber || 'N/A'}`);
      addText(`Address: ${claim.individualDetails.physicalAddress || 'N/A'}`);
      addText(`Phone: ${claim.individualDetails.mobile || 'N/A'}`);
      addText(`Email: ${claim.individualDetails.email || 'N/A'}`);
    }
    
    // Corporate Details
    if (claim.corporateDetails) {
      addSection('CORPORATE DETAILS');
      addText(`Company Name: ${claim.corporateDetails.registeredName}`);
      addText(`Registration Number: ${claim.corporateDetails.registrationNumber || 'N/A'}`);
      addText(`Address: ${claim.corporateDetails.physicalAddress || 'N/A'}`);
      addText(`Years in Operation: ${claim.corporateDetails.yearsInOperation || 'N/A'}`);
    }
    
    // Driver Information
    if (claim.driver) {
      addSection('DRIVER INFORMATION');
      addText(`Name: ${claim.driver.name}`);
      addText(`License Number: ${claim.driver.licenseNumber || 'N/A'}`);
      addText(`Years of Driving: ${claim.driver.yearsOfDriving || 'N/A'}`);
      addText(`Address: ${claim.driver.address || 'N/A'}`);
      addText(`Telephone: ${claim.driver.telephone || 'N/A'}`);
    }
    
    // Bank Details
    if (claim.bankDetails) {
      addSection('BANK DETAILS');
      addText(`Bank Name: ${claim.bankDetails.bankName}`);
      addText(`Branch: ${claim.bankDetails.branch || 'N/A'}`);
      addText(`Account Number: ${claim.bankDetails.accountNumber}`);
      addText(`Account Name: ${claim.bankDetails.accountName}`);
      addText(`Swift Code: ${claim.bankDetails.swiftCode || 'N/A'}`);
    }
    
    // Other Vehicles
    if (claim.otherVehicles && claim.otherVehicles.length > 0) {
      addSection('OTHER VEHICLES INVOLVED');
      claim.otherVehicles.forEach((vehicle, index) => {
        addText(`Vehicle ${index + 1}:`);
        addText(`  Owner Name: ${vehicle.ownerName || 'N/A'}`, 25);
        addText(`  Owner Address: ${vehicle.ownerAddress || 'N/A'}`, 25);
        addText(`  Registration: ${vehicle.registrationNumber || 'N/A'}`, 25);
        addText(`  Insurer: ${vehicle.insurer || 'N/A'}`, 25);
      });
    }
    
    // Damage Assessment
    addSection('DAMAGE ASSESSMENT');
    addText(`Vehicle Damage: ${claim.vehicleDamageDescription || 'N/A'}`);
    addText(`Goods Damaged: ${claim.goodsDamaged ? 'Yes' : 'No'}`);
    if (claim.goodsDamaged) {
      addText(`Goods Description: ${claim.goodsDescription || 'N/A'}`);
    }
    
    // Damage Photos
    if (claim.damagedPhotos?.length) {
      addSection('DAMAGE PHOTOS');
      addText(`Total Photos Uploaded: ${claim.damagedPhotos.length}`);
      addText(`Total Detected Damages: ${claim.damagedPhotos.reduce((sum, photo) => sum + (photo.detectedDamages?.length || 0), 0)}`);
      addText(`Analysis Status: Complete`);
    }
    
    // Return the PDF as buffer
    return Buffer.from(doc.output('arraybuffer'));
    
  } catch (error) {
    console.error('PDF generation error:', error);
    // Fallback to text content if jsPDF fails
    const textContent = `
MOTOR ACCIDENT INSURANCE CLAIM REPORT
=====================================

Claim ID: ${claim.id}
Policy Number: ${claim.policyNumber}
Status: ${claim.status.replace('_', ' ').toUpperCase()}
Date Created: ${new Date(claim.createdAt!).toLocaleDateString()}
${claim.submittedAt ? `Date Submitted: ${new Date(claim.submittedAt).toLocaleDateString()}` : ''}

CLAIMANT INFORMATION
===================
Name: ${claim.claimant.firstName} ${claim.claimant.lastName}
Email: ${claim.claimant.email}

POLICY DETAILS
=============
Branch: ${claim.branchName || 'N/A'}
Agent: ${claim.agentName || 'N/A'}
Last Payment: ${claim.lastPaymentDate ? new Date(claim.lastPaymentDate).toLocaleDateString() : 'N/A'}
Insured Type: ${claim.insuredType}

ERROR: PDF generation failed. Please contact support.
`;

    return Buffer.from(textContent, 'utf-8');
  }
}