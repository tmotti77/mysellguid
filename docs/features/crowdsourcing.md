# Crowdsourcing System

## Overview

The crowdsourcing system allows users to report sales they discover in stores. This creates a community-driven data source that's legal, scalable, and engaging.

## User Flow

```
┌─────────────────────────────────────────────────────┐
│  1. User spots sale in store                         │
│                    ↓                                 │
│  2. Taps "Report Sale" button                        │
│                    ↓                                 │
│  3. Camera opens → Takes photo                       │
│                    ↓                                 │
│  4. AI analyzes image (Gemini Vision)                │
│                    ↓                                 │
│  5. Pre-filled form appears                          │
│     - Title (extracted)                              │
│     - Discount % (extracted)                         │
│     - Category (detected)                            │
│     - Store (GPS location lookup)                    │
│                    ↓                                 │
│  6. User confirms/edits → Submit                     │
│                    ↓                                 │
│  7. Report queued or auto-approved                   │
│                    ↓                                 │
│  8. User earns points → Notification                 │
└─────────────────────────────────────────────────────┘
```

## Report Lifecycle

| Status | Description |
|--------|-------------|
| `pending` | New report, waiting for review |
| `approved` | Verified and published as sale |
| `rejected` | Invalid or duplicate |
| `expired` | Auto-closed after sale end date |

## Approval Logic

### Auto-Approval Conditions
A report is auto-approved if:
1. User trust level is "trusted" or "expert"
2. AI confidence score > 90%
3. No similar sale reported in last 24h within 100m

### Manual Review Required
- New users (< 5 approved reports)
- Low AI confidence (< 70%)
- Potential duplicate detected
- Flagged keywords in description

## Verification System

### Trust Levels

| Level | Requirements | Privileges |
|-------|-------------|------------|
| New | 0-4 approved reports | All reports require review |
| Regular | 5-19 approved, >70% accuracy | AI-assisted review |
| Trusted | 20-49 approved, >85% accuracy | Auto-approve enabled |
| Expert | 50+ approved, >90% accuracy | Can verify others' reports |

### Accuracy Calculation
```
accuracy = approvedReports / totalReports * 100
```

### Upvote/Downvote System
- Other users can vote on sales
- 3+ downvotes → flag for review
- 10+ upvotes → boost visibility

## Gamification

### Points System

| Action | Points |
|--------|--------|
| Submit report | +10 |
| Report approved | +5 bonus |
| Report rejected | -10 |
| First to report a sale | +15 bonus |
| Receive upvote | +1 |
| Sale verified by store | +20 |
| Report expired naturally | 0 (no penalty) |

### Badges

| Badge | Icon | Requirement |
|-------|------|-------------|
| First Reporter | 🥉 | Submit first report |
| Sale Hunter | 🥈 | 10 approved reports |
| Expert Scout | 🥇 | 50 approved reports |
| Legend | 🏆 | 200 approved reports |
| Speed Demon | ⚡ | 5 reports in 24 hours |
| Trusted | ✅ | Earn trusted status |
| Influencer | 🌟 | 100 total upvotes |

### Leaderboard

- Weekly top 10 reporters
- Monthly top 10 reporters
- All-time top 10 reporters
- User's personal rank

## Database Schema

### user_reports table
```sql
CREATE TABLE user_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId UUID REFERENCES users(id) ON DELETE CASCADE,
  saleId UUID REFERENCES sales(id) ON DELETE SET NULL,
  imageUrl VARCHAR NOT NULL,
  rawData JSONB NOT NULL,
  aiExtractedData JSONB,
  status VARCHAR DEFAULT 'pending',
  verifiedBy UUID REFERENCES users(id),
  verificationNote TEXT,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  location GEOGRAPHY(POINT),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### user_stats table
```sql
CREATE TABLE user_stats (
  userId UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  reportCount INTEGER DEFAULT 0,
  approvedCount INTEGER DEFAULT 0,
  rejectedCount INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  badges JSONB DEFAULT '[]',
  trustLevel VARCHAR DEFAULT 'new',
  lastReportAt TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### POST /api/user-reports
Submit a new report.

**Request:**
```json
{
  "image": "base64_encoded_image",
  "latitude": 32.0853,
  "longitude": 34.7818,
  "storeId": "uuid (optional)",
  "title": "override AI title (optional)",
  "category": "override category (optional)"
}
```

**Response (201):**
```json
{
  "reportId": "uuid",
  "status": "pending",
  "aiExtraction": {
    "title": "50% OFF All Items",
    "discountPercentage": 50,
    "category": "clothing",
    "confidence": 87
  },
  "pointsEarned": 10,
  "newTotal": 120,
  "message": "Report submitted! +10 points"
}
```

### GET /api/user-reports/my-reports
Get user's report history.

### PATCH /api/user-reports/:id/approve
Approve a pending report (admin/moderator only).

### PATCH /api/user-reports/:id/reject
Reject a pending report with reason.

### GET /api/gamification/leaderboard
Get weekly/monthly/all-time leaderboard.

### GET /api/gamification/my-stats
Get current user's stats, points, badges.

## Mobile UI Components

### ReportSaleScreen
- Camera preview
- "Take Photo" button
- Photo preview with "Use" / "Retake"

### ReportFormScreen
- Pre-filled form from AI
- Editable fields: title, category, discount, prices
- Store picker (auto-detected or search)
- Map preview with location pin
- Submit button

### ReportSuccessScreen
- Confetti animation
- Points earned display
- Badge earned (if any)
- "View Sale" button (if auto-approved)
- "Report Another" button

### MyReportsScreen
- List of user's reports
- Status badges (pending, approved, rejected)
- Points earned per report
- Filter by status

### LeaderboardScreen
- Weekly / Monthly / All-time tabs
- Avatar, name, points, badge count
- User's own rank highlighted
- Pull to refresh

## Anti-Abuse Measures

1. **Rate limiting**: Max 10 reports per hour per user
2. **Duplicate detection**: Image hash comparison within 100m radius
3. **Spam detection**: Flag repeated similar submissions
4. **Location verification**: Report must be submitted from within 500m of store
5. **Cooldown**: 5-minute wait between reports at same location
6. **Quality check**: AI minimum confidence threshold
7. **User bans**: Repeated abuse leads to temporary/permanent ban

## Implementation Notes

### Image Processing
1. Compress image before upload (max 1MB)
2. Store original and thumbnail
3. Extract EXIF for location verification
4. Use Sharp for resizing

### AI Integration
1. Send image to Gemini Vision API
2. Parse structured JSON response
3. Fall back to user input if AI fails
4. Log AI confidence for analytics

### Notification Triggers
1. Report approved → "Your report is live! +5 points"
2. Report rejected → "Report not approved" (with reason)
3. Badge earned → "You earned the Sale Hunter badge!"
4. Upvote received → "Someone liked your report! +1 point"
