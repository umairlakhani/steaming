# Roku Integration for MediaPilot

This document explains the Roku-standard JSON feed implementation for MediaPilot's video archive and publish section.

## Overview

The system now generates Roku-compliant JSON feeds that can be used to create Roku channels. The implementation includes proper ad handling with VAST (Video Ad Serving Template) support.

## API Endpoints

### 1. Roku Manifest Feed
**GET** `/api/video/roku/manifest`

Generates a complete Roku channel manifest with all published videos.

**Response Format:**
```json
{
  "providerName": "MediaPilot",
  "lastUpdated": "2024-01-15T10:30:00.000Z",
  "language": "en",
  "categories": [
    {
      "name": "Movies",
      "query": "movies"
    }
  ],
  "movies": [
    {
      "id": "123",
      "title": "Sample Video",
      "shortDescription": "Video description",
      "longDescription": "Detailed video description",
      "thumbnail": "https://example.com/thumbnail.jpg",
      "releaseDate": "2024-01-15",
      "content": {
        "dateAdded": "2024-01-15T10:30:00.000Z",
        "videos": [
          {
            "url": "https://example.com/video_360p.mp4",
            "quality": "SD",
            "videoType": "MP4"
          },
          {
            "url": "https://example.com/video_720p.mp4",
            "quality": "HD",
            "videoType": "MP4"
          }
        ],
        "duration": 3600,
        "adBreaks": [
          {
            "time": 0,
            "type": "preroll"
          },
          {
            "time": 1800,
            "type": "midroll"
          }
        ]
      },
      "genres": ["Entertainment"],
      "rating": "TV-G",
      "actors": [],
      "directors": [],
      "categories": ["Movies"],
      "tags": ["MediaPilot", "Streaming"]
    }
  ]
}
```

### 2. Complete Published Videos Feed
**GET** `/api/video/owned/complete-published`

Returns all published videos in Roku format.

### 3. Single Video Feed
**GET** `/api/video/owned/publishedById/:id`

Returns a single video in Roku format.

### 4. Complete Archived Videos Feed
**GET** `/api/video/owned/complete-archived`

Returns all archived videos in Roku format.

## Ad Integration

### VAST Ad Endpoints

#### Generate VAST Response
**GET** `/api/rokuAds/vast?adType=preroll&videoId=123`

Generates VAST XML for Roku ad integration.

**Parameters:**
- `adType`: `preroll`, `midroll`, or `postroll`
- `videoId`: Video ID

**Response:** VAST 3.0 XML

#### Get Video Ad Configuration
**GET** `/api/rokuAds/config/:videoId`

Returns ad configuration for a specific video.

**Response:**
```json
{
  "data": {
    "videoId": 123,
    "ads": {
      "preroll": true,
      "midroll": true,
      "postroll": false
    },
    "midrollConfig": {
      "interval": 5,
      "intervalType": "min"
    }
  }
}
```

#### Update Video Ad Configuration
**PUT** `/api/rokuAds/config/:videoId`

Updates ad configuration for a video.

**Request Body:**
```json
{
  "preRoll": true,
  "midRoll": true,
  "postRoll": false,
  "midRollConfig": {
    "interval": 5,
    "intervalType": "min"
  }
}
```

## Roku Channel Implementation

### 1. Channel Manifest
Use the `/api/video/roku/manifest` endpoint to get the complete channel feed.

### 2. Ad Integration
- **Pre-roll ads**: Play before video starts
- **Mid-roll ads**: Play at specified intervals during video
- **Post-roll ads**: Play after video ends

### 3. Video Quality
The system provides multiple quality levels:
- **SD**: 360p and 480p
- **HD**: 720p
- **FHD**: 1080p

## Frontend Integration

### Download JSON Feed
The existing "Copy video's JSON data" button now generates Roku-compliant JSON.

### Ad Configuration
Videos with ads will include `adBreaks` array with timing information:
- `time`: Seconds from video start
- `type`: `preroll`, `midroll`, or `postroll`

## Database Schema

The video table includes ad-related fields:
- `preRoll`: Boolean for pre-roll ads
- `midRoll`: Boolean for mid-roll ads
- `postRoll`: Boolean for post-roll ads
- `midRollConfig`: JSON configuration for mid-roll timing

## Usage Examples

### 1. Get Roku Manifest
```bash
curl -X GET "https://your-domain.com/api/video/roku/manifest" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Get VAST for Pre-roll Ad
```bash
curl -X GET "https://your-domain.com/api/rokuAds/vast?adType=preroll&videoId=123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Update Ad Configuration
```bash
curl -X PUT "https://your-domain.com/api/rokuAds/config/123" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "preRoll": true,
    "midRoll": true,
    "midRollConfig": {
      "interval": 5,
      "intervalType": "min"
    }
  }'
```

## Roku Channel Development

1. **Create Roku Channel**: Use the manifest feed as your content source
2. **Implement VAST**: Use the VAST endpoints for ad integration
3. **Handle Multiple Qualities**: Roku will automatically select the best quality
4. **Ad Timing**: Use the `adBreaks` array to determine when to show ads

## Notes

- All durations are converted to seconds for Roku compatibility
- Video URLs must be publicly accessible
- Thumbnails should be in JPG or PNG format
- VAST responses include tracking URLs for analytics
- The system supports both video ads and wrapper ads

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your domain is whitelisted in the CORS configuration
2. **Authentication**: All endpoints require valid JWT tokens
3. **Video URLs**: Ensure video URLs are accessible and in MP4 format
4. **Ad Configuration**: Verify ad settings in the database

### Debug Endpoints

- **Health Check**: `GET /api/health`
- **Ping**: `GET /api/ping`

## Future Enhancements

1. **Dynamic Ad Selection**: Implement ad rotation based on user demographics
2. **Advanced Analytics**: Add detailed ad performance tracking
3. **Multiple Ad Formats**: Support for banner ads and interactive ads
4. **Geographic Targeting**: Location-based ad serving 