# Roboflow Computer Vision Integration Guide

## Overview

This claims management system integrates with Roboflow Computer Vision API to automatically analyze vehicle damage photos and provide AI-powered damage assessment. The system works seamlessly in both localhost and Replit environments.

## Prerequisites

1. **Roboflow Account**: Sign up at [roboflow.com](https://roboflow.com)
2. **API Access**: Obtain your Roboflow API key from your account settings
3. **Vehicle Damage Model**: Access to a vehicle damage detection model on Roboflow Universe

## Recommended Models

The system works with any Roboflow model that detects vehicle damage. Here are some recommended public models from Roboflow Universe:

1. **Vehicle Damage Detection Model**: Search for "vehicle damage" or "car damage" models
2. **Auto Damage Assessment**: Models trained on insurance claim photos
3. **Vehicle Inspection Models**: General vehicle condition assessment models

## Environment Setup

### For Both Localhost and Replit

1. **Set Environment Variables**:
   ```bash
   ROBOFLOW_API_KEY=your_api_key_here
   ROBOFLOW_MODEL_ENDPOINT=your_model_endpoint_url
   ```

2. **Model Endpoint Format**:
   ```
   https://detect.roboflow.com/[model-name]/[version]?api_key=[api_key]
   ```

### Localhost Setup

1. Create a `.env` file in your project root:
   ```env
   ROBOFLOW_API_KEY=your_roboflow_api_key
   ROBOFLOW_MODEL_ENDPOINT=https://detect.roboflow.com/vehicle-damage-v1/1
   ```

2. Install dependencies (already included):
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm run dev
   ```

### Replit Setup

1. **Add Secrets**: Go to the "Secrets" tab in your Replit workspace and add:
   - Key: `ROBOFLOW_API_KEY`
   - Value: `your_roboflow_api_key`
   
   - Key: `ROBOFLOW_MODEL_ENDPOINT` 
   - Value: `https://detect.roboflow.com/vehicle-damage-v1/1`

2. **Run the Application**: Click the "Run" button or use the workflow

## How It Works

### 1. Photo Upload Process

- Users upload photos through the damage assessment section
- System supports: Front, Rear, Left Side, Right Side views
- Optional 360° video upload with coverage validation
- Photos are stored securely in cloud storage

### 2. AI Analysis Workflow

```javascript
// The system automatically calls Roboflow API when analyzing photos
const analyzePhoto = async (photoUrl) => {
  const response = await fetch(process.env.ROBOFLOW_MODEL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: photoUrl,
      confidence: 0.5,
      overlap: 0.3
    })
  });
  
  return response.json();
};
```

### 3. Damage Detection Results

The AI analysis provides:
- **Damage Type**: Dent, scratch, crack, etc.
- **Confidence Score**: Percentage accuracy (0-100%)
- **Bounding Box**: Precise location coordinates
- **Severity Assessment**: Minor, moderate, major, total loss
- **Cost Estimation**: Preliminary repair cost estimates

### 4. Integration Points

#### API Endpoint
```
POST /api/claims/:id/analyze-media
```

#### Frontend Component
```typescript
// Enhanced Damage Assessment Component
import { EnhancedDamageAssessment } from './components/claim-form/enhanced-damage-assessment';

// Usage in claim form
<EnhancedDamageAssessment
  claimId={claimId}
  onAnalysisComplete={(results) => {
    // Handle AI analysis results
    console.log('AI detected damages:', results);
  }}
/>
```

## Testing the Integration

### 1. Upload Test Photos

1. Navigate to the claim form
2. Go to the "Damage Assessment" section
3. Upload photos for each required view (front, rear, sides)
4. Click "Analyze with AI" button

### 2. Verify Results

Check that the system:
- ✅ Uploads photos successfully
- ✅ Calls Roboflow API automatically
- ✅ Displays detected damages with confidence scores
- ✅ Shows bounding boxes and damage types
- ✅ Includes results in PDF reports

### 3. API Response Format

Expected Roboflow response structure:
```json
{
  "predictions": [
    {
      "class": "dent",
      "confidence": 0.85,
      "x": 150,
      "y": 200,
      "width": 80,
      "height": 60
    }
  ],
  "time": 0.123
}
```

## Troubleshooting

### Common Issues

1. **API Key Error**:
   - Verify your Roboflow API key is correct
   - Check that the key has proper permissions
   - Ensure the key is set in environment variables

2. **Model Not Found**:
   - Verify the model endpoint URL
   - Check that the model is public or you have access
   - Try using a different vehicle damage model

3. **Photo Upload Issues**:
   - Ensure photos are in supported formats (JPG, PNG)
   - Check file size limits (default: 10MB)
   - Verify cloud storage is properly configured

4. **No Damage Detected**:
   - Try lowering the confidence threshold (default: 0.5)
   - Use clearer, higher-quality photos
   - Test with photos that have obvious damage

### Debug Mode

Enable detailed logging by setting:
```env
NODE_ENV=development
DEBUG=roboflow:*
```

## Model Customization

### Using Your Own Model

1. Train a custom model on Roboflow with your damage categories
2. Export the model to get your custom endpoint
3. Update the `ROBOFLOW_MODEL_ENDPOINT` environment variable
4. Adjust damage type mappings in the code if needed

### Damage Categories

The system supports these damage types:
- Dent
- Scratch
- Crack
- Paint damage
- Glass damage
- Structural damage
- Total loss

## Performance Optimization

### Batch Processing

For multiple photos:
```javascript
const analyzeMultiplePhotos = async (photoUrls) => {
  const analyses = await Promise.all(
    photoUrls.map(url => analyzePhoto(url))
  );
  return analyses;
};
```

### Caching Results

- AI analysis results are cached in the database
- Avoid re-analyzing the same photos
- Results persist across sessions

## Security Considerations

1. **API Key Protection**: Never expose API keys in frontend code
2. **Rate Limiting**: Implement appropriate rate limits for API calls
3. **Data Privacy**: Ensure compliance with data protection regulations
4. **Access Control**: Restrict access to analysis features based on user roles

## Cost Management

- Monitor your Roboflow usage dashboard
- Implement reasonable file size limits
- Consider implementing user quotas for analysis requests
- Cache results to avoid duplicate API calls

## Support

For technical issues:
1. Check the Roboflow documentation
2. Review the integration logs
3. Test with the provided sample models
4. Contact Roboflow support for model-specific issues

## Example Workflow

1. **User uploads photos** → System stores in cloud storage
2. **System calls Roboflow API** → AI analyzes each photo
3. **Results stored in database** → Damage details persisted
4. **PDF generation includes AI results** → Complete damage report
5. **Staff can review AI analysis** → Professional assessment

This integration provides a comprehensive, AI-powered vehicle damage assessment system that works reliably in both development and production environments.