# Upload Service for Car Rental System

This module provides file upload functionality for the car rental system using Cloudinary as the cloud storage provider.

## Features

### User Uploads
- **Profile Photos**: High-quality profile pictures (400x400px)
- **Avatars**: Circular profile pictures (150x150px)
- **License Documents**: Driver's license uploads (PDF/Image)

### Vehicle Uploads (Agent/Admin Only)
- **Main Images**: Primary vehicle photos (1200x800px)
- **Gallery Images**: Multiple vehicle photos (1920x1080px)
- **Interior Images**: Vehicle interior photos (1200x900px)
- **Exterior Images**: Vehicle exterior photos (1200x900px)
- **Documents**: Vehicle registration, insurance, etc. (PDF/Image)

## Upload Types & Configurations

| Upload Type | Max Size | Formats | Transformation |
|-------------|----------|---------|----------------|
| User Profile | 3MB | jpg, jpeg, png, webp | 400x400, face-focused |
| User Avatar | 2MB | jpg, jpeg, png, webp | 150x150, circular, face-focused |
| Vehicle Main | 8MB | jpg, jpeg, png, webp | 1200x800, optimized |
| Vehicle Gallery | 10MB | jpg, jpeg, png, webp | 1920x1080, optimized |
| Vehicle Interior | 8MB | jpg, jpeg, png, webp | 1200x900, optimized |
| Vehicle Exterior | 8MB | jpg, jpeg, png, webp | 1200x900, optimized |
| Vehicle Documents | 15MB | pdf, jpg, jpeg, png | No transformation |
| License Document | 10MB | pdf, jpg, jpeg, png | No transformation |

## API Endpoints

### User Endpoints
```
POST /upload/profile-photo     # Upload profile photo
POST /upload/avatar           # Upload circular avatar
POST /upload/license-document # Upload license document
```

### Vehicle Endpoints (Agent/Admin Only)
```
POST /upload/vehicle/main-image   # Upload main vehicle image
POST /upload/vehicle/gallery      # Upload multiple gallery images (max 10)
POST /upload/vehicle/interior     # Upload interior images (max 5)
POST /upload/vehicle/exterior     # Upload exterior images (max 8)
POST /upload/vehicle/documents    # Upload vehicle documents (max 5)
```

## Environment Variables Required

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## File Organization in Cloudinary

```
car-rental/
├── users/
│   ├── profiles/     # User profile photos
│   ├── avatars/      # User avatars
│   └── licenses/     # License documents
└── vehicles/
    ├── main/         # Main vehicle images
    ├── gallery/      # Vehicle gallery
    ├── interior/     # Interior photos
    ├── exterior/     # Exterior photos
    ├── documents/    # Vehicle documents
    └── insurance/    # Insurance documents
```

## Usage Examples

### Upload Profile Photo
```javascript
const formData = new FormData();
formData.append('file', selectedFile);

fetch('/upload/profile-photo', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
})
```

### Upload Multiple Vehicle Gallery Images
```javascript
const formData = new FormData();
files.forEach(file => {
  formData.append('files', file);
});

fetch('/upload/vehicle/gallery', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + agentToken
  },
  body: formData
})
```

## Security Features

- **Authentication Required**: All endpoints require JWT authentication
- **Role-Based Access**: Vehicle uploads restricted to agents/admins
- **File Validation**: Size limits, format validation, MIME type checking
- **Secure URLs**: All uploads return HTTPS URLs
- **Auto-Optimization**: Images automatically optimized for web

## Error Handling

The service provides detailed error messages for:
- File size exceeded
- Invalid file formats
- Missing files
- Authentication failures
- Upload failures

## Response Format

All successful uploads return:
```json
{
  "public_id": "car-rental/vehicles/main/abc123",
  "secure_url": "https://res.cloudinary.com/...",
  "url": "http://res.cloudinary.com/...",
  "original_filename": "car.jpg",
  "bytes": 524288,
  "format": "jpg",
  "resource_type": "image",
  "created_at": "2025-06-26T10:30:00Z",
  "width": 1200,
  "height": 800,
  "folder": "car-rental/vehicles/main"
}
```
