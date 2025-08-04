import type { ClaimWithDetails } from "@shared/schema";
import puppeteer from 'puppeteer';

export async function generateClaimPDF(claim: ClaimWithDetails): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });
  
  const page = await browser.newPage();
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Motor Accident Insurance Claim Report</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; color: #333; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0066cc; padding-bottom: 20px; }
    .header h1 { color: #0066cc; margin: 0; font-size: 24px; }
    .section { margin-bottom: 25px; }
    .section h2 { background: #f8f9fa; padding: 10px; border-left: 4px solid #0066cc; margin: 0 0 15px 0; font-size: 16px; }
    .field { margin-bottom: 8px; }
    .field strong { color: #555; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
    .status.draft { background: #f8f9fa; color: #6c757d; }
    .status.submitted { background: #fff3cd; color: #856404; }
    .status.under_review { background: #fff3cd; color: #856404; }
    .status.approved { background: #d1edff; color: #0c5460; }
    .status.rejected { background: #f8d7da; color: #721c24; }
    .photos { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-top: 15px; }
    .photo-item { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
    .photo-item img { width: 100%; height: 150px; object-fit: cover; }
    .photo-info { padding: 10px; background: #f8f9fa; }
    .photo-info .label { font-weight: bold; color: #0066cc; }
    .photo-info .damages { color: #28a745; font-size: 12px; }
    .ai-summary { background: #e7f3ff; padding: 15px; border-radius: 8px; border-left: 4px solid #0066cc; }
  </style>
</head>
<body>
  <div class="header">
    <h1>MOTOR ACCIDENT INSURANCE CLAIM REPORT</h1>
    <div style="margin-top: 15px;">
      <strong>Claim ID:</strong> ${claim.id}<br>
      <strong>Policy Number:</strong> ${claim.policyNumber}<br>
      <strong>Status:</strong> <span class="status ${claim.status}">${claim.status.replace('_', ' ').toUpperCase()}</span><br>
      <strong>Date Created:</strong> ${new Date(claim.createdAt).toLocaleDateString()}<br>
      ${claim.submittedAt ? `<strong>Date Submitted:</strong> ${new Date(claim.submittedAt).toLocaleDateString()}<br>` : ''}
    </div>
  </div>

  <div class="section">
    <h2>CLAIMANT INFORMATION</h2>
    <div class="field"><strong>Name:</strong> ${claim.claimant.firstName} ${claim.claimant.lastName}</div>
    <div class="field"><strong>Email:</strong> ${claim.claimant.email}</div>
  </div>

  <div class="section">
    <h2>POLICY DETAILS</h2>
    <div class="field"><strong>Branch:</strong> ${claim.branchName || 'N/A'}</div>
    <div class="field"><strong>Agent:</strong> ${claim.agentName || 'N/A'}</div>
    <div class="field"><strong>Last Payment:</strong> ${claim.lastPaymentDate ? new Date(claim.lastPaymentDate).toLocaleDateString() : 'N/A'}</div>
    <div class="field"><strong>Insured Type:</strong> ${claim.insuredType}</div>
  </div>

  <div class="section">
    <h2>ACCIDENT DETAILS</h2>
    <div class="field"><strong>Date:</strong> ${claim.accidentDate ? new Date(claim.accidentDate).toLocaleDateString() : 'N/A'}</div>
    <div class="field"><strong>Time:</strong> ${claim.accidentTime || 'N/A'}</div>
    <div class="field"><strong>Location:</strong> ${claim.accidentLocation || 'N/A'}</div>
    <div class="field"><strong>Description:</strong> ${claim.accidentDescription || 'N/A'}</div>
  </div>

  ${claim.vehicle ? `
  <div class="section">
    <h2>VEHICLE INFORMATION</h2>
    <div class="field"><strong>Make:</strong> ${claim.vehicle.make}</div>
    <div class="field"><strong>Model:</strong> ${claim.vehicle.model}</div>
    <div class="field"><strong>Year:</strong> ${claim.vehicle.year || 'N/A'}</div>
    <div class="field"><strong>Registration:</strong> ${claim.vehicle.registrationNumber}</div>
    <div class="field"><strong>Color:</strong> ${claim.vehicle.color || 'N/A'}</div>
  </div>
  ` : ''}

  <div class="section">
    <h2>DAMAGE ASSESSMENT</h2>
    <div class="field"><strong>Vehicle Damage:</strong> ${claim.vehicleDamageDescription || 'N/A'}</div>
    <div class="field"><strong>Goods Damaged:</strong> ${claim.goodsDamaged ? 'Yes' : 'No'}</div>
    ${claim.goodsDamaged ? `<div class="field"><strong>Goods Description:</strong> ${claim.goodsDescription || 'N/A'}</div>` : ''}
  </div>

  ${claim.damagedPhotos?.length ? `
  <div class="section">
    <h2>DAMAGE PHOTOS</h2>
    <div class="photos">
      ${claim.damagedPhotos.map(photo => `
        <div class="photo-item">
          <img src="${process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : ''}/objects/${photo.objectPath.split('/objects/')[1]}" 
               alt="${photo.angle} damage view" 
               onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
          <div style="display:none; padding: 60px 20px; text-align: center; background: #f8f9fa; color: #666;">
            Image not available
          </div>
          <div class="photo-info">
            <div class="label">${photo.angle.replace('_', ' ')}</div>
            <div style="font-size: 12px; color: #666;">${photo.isGoodsPhoto ? 'Goods Damage' : 'Vehicle Damage'}</div>
            ${photo.detectedDamages?.length ? `<div class="damages">✓ ${photo.detectedDamages.length} damage${photo.detectedDamages.length !== 1 ? 's' : ''} detected</div>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  ${claim.damagedPhotos?.length ? `
  <div class="section">
    <h2>AI ANALYSIS SUMMARY</h2>
    <div class="ai-summary">
      <div class="field"><strong>Total Photos Uploaded:</strong> ${claim.damagedPhotos.length}</div>
      <div class="field"><strong>Total Detected Damages:</strong> ${claim.damagedPhotos.reduce((sum, photo) => sum + (photo.detectedDamages?.length || 0), 0)}</div>
      <div class="field"><strong>Analysis Status:</strong> Complete</div>
    </div>
  </div>
  ` : ''}

  ${claim.individualDetails ? `
  <div class="section">
    <h2>INDIVIDUAL DETAILS</h2>
    <div class="field"><strong>Full Name:</strong> ${claim.individualDetails.firstName} ${claim.individualDetails.middleName || ''} ${claim.individualDetails.surname}</div>
    <div class="field"><strong>ID Number:</strong> ${claim.individualDetails.idNumber || 'N/A'}</div>
    <div class="field"><strong>Address:</strong> ${claim.individualDetails.address || 'N/A'}</div>
    <div class="field"><strong>Phone:</strong> ${claim.individualDetails.phoneNumber || 'N/A'}</div>
  </div>
  ` : ''}

  ${claim.corporateDetails ? `
  <div class="section">
    <h2>CORPORATE DETAILS</h2>
    <div class="field"><strong>Company Name:</strong> ${claim.corporateDetails.companyName}</div>
    <div class="field"><strong>Registration Number:</strong> ${claim.corporateDetails.registrationNumber || 'N/A'}</div>
    <div class="field"><strong>Address:</strong> ${claim.corporateDetails.address || 'N/A'}</div>
    <div class="field"><strong>Contact Person:</strong> ${claim.corporateDetails.contactPerson || 'N/A'}</div>
  </div>
  ` : ''}

  ${claim.driver ? `
  <div class="section">
    <h2>DRIVER INFORMATION</h2>
    <div class="field"><strong>Name:</strong> ${claim.driver.firstName} ${claim.driver.lastName}</div>
    <div class="field"><strong>License Number:</strong> ${claim.driver.licenseNumber}</div>
    <div class="field"><strong>License Class:</strong> ${claim.driver.licenseClass || 'N/A'}</div>
    <div class="field"><strong>Years of Experience:</strong> ${claim.driver.yearsOfExperience || 'N/A'}</div>
  </div>
  ` : ''}

  ${claim.bankDetails ? `
  <div class="section">
    <h2>BANK DETAILS</h2>
    <div class="field"><strong>Bank Name:</strong> ${claim.bankDetails.bankName}</div>
    <div class="field"><strong>Account Holder:</strong> ${claim.bankDetails.accountHolderName}</div>
    <div class="field"><strong>Account Number:</strong> ${claim.bankDetails.accountNumber}</div>
    <div class="field"><strong>Branch Code:</strong> ${claim.bankDetails.branchCode || 'N/A'}</div>
  </div>
  ` : ''}

</body>
</html>
  `;

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      bottom: '20mm',
      left: '15mm',
      right: '15mm'
    }
  });

  await browser.close();
  return pdf;
}