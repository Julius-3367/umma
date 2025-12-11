# Trainer Candidate Management System

## Overview
This module enables trainers to access candidate professional profiles and run assessments directly from the candidate view. Trainers can now comprehensively evaluate candidates enrolled in their courses.

## Features Implemented

### 1. **Backend API Endpoints**

#### Get All Candidates (Trainer's Courses)
```
GET /api/trainer/candidates
```
**Query Parameters:**
- `status` (optional): Filter by enrollment status (ENROLLED, PENDING, COMPLETED, DROPPED)
- `courseId` (optional): Filter by specific course
- `search` (optional): Search by name, email, or course title

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "enrollments": [
        {
          "id": 101,
          "course": {
            "id": 5,
            "title": "Web Development Bootcamp",
            "code": "WEB-101"
          },
          "enrollmentStatus": "ENROLLED",
          "enrollmentDate": "2024-01-15T10:00:00.000Z"
        }
      ],
      "_count": {
        "enrollments": 3,
        "vetting": 1
      }
    }
  ],
  "pagination": {
    "total": 15
  }
}
```

#### Get Candidate Professional Profile
```
GET /api/trainer/candidates/:candidateId
```
**Authorization:** Trainer must be assigned to at least one course the candidate is enrolled in

**Response Includes:**
- **Personal Information**: Full name, contact, demographics
- **Professional Background**: Previous employment, skills, preferences
- **Education**: Highest education level, languages
- **Enrollments**: All courses with enrollment status
- **Assessments**: All assessment results with scores and feedback
- **Attendance Records**: Last 50 attendance entries with statistics
- **Documents**: Uploaded documents and vetting status
- **Statistics**: 
  - Total/Active/Completed enrollments
  - Total/Passed assessments
  - Average assessment score
  - Attendance rate and total days

**Example Response:**
```json
{
  "success": true,
  "data": {
    "candidate": {
      "id": 1,
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "gender": "Male",
      "dob": "1995-06-15T00:00:00.000Z",
      "county": "Nairobi",
      "highestEducation": "Bachelor's Degree",
      "languages": ["English", "Swahili"],
      "relevantSkills": "JavaScript, React, Node.js",
      "previousEmployer": "Tech Corp",
      "previousRole": "Junior Developer",
      "previousDuration": "2 years",
      "preferredCountry": "Canada",
      "jobTypePreference": "Full-time",
      "willingToRelocate": true,
      "status": "TRAINING"
    },
    "enrollments": [...],
    "assessments": [...],
    "attendance": [...],
    "documents": [...],
    "vettingStatus": {...},
    "statistics": {
      "totalEnrollments": 3,
      "activeEnrollments": 2,
      "completedEnrollments": 1,
      "totalAssessments": 8,
      "passedAssessments": 7,
      "averageScore": "78.5",
      "attendanceRate": "92.3",
      "totalAttendanceDays": 45
    }
  }
}
```

#### Create Assessment for Candidate
```
POST /api/trainer/candidates/:candidateId/assessments
```
**Request Body:**
```json
{
  "courseId": 5,
  "assessmentType": "Quiz",
  "score": 85,
  "resultCategory": "MERIT",
  "trainerComments": "Excellent understanding of core concepts",
  "feedback": "Keep up the good work!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Assessment created successfully",
  "data": {
    "id": 123,
    "enrollmentId": 101,
    "courseId": 5,
    "assessmentType": "Quiz",
    "score": 85,
    "percentage": 85,
    "resultCategory": "MERIT",
    "trainerComments": "Excellent understanding of core concepts",
    "assessmentDate": "2024-12-09T10:30:00.000Z"
  }
}
```

### 2. **Frontend Components**

#### CandidateProfileDialog Component
**Location:** `/frontend/src/components/trainer/CandidateProfileDialog.jsx`

**Features:**
- **6 Tabbed Sections:**
  1. **Personal Info**: Demographics, contact, photo
  2. **Professional**: Work experience, skills, preferences
  3. **Enrollments**: Course enrollments with statistics
  4. **Assessments**: All assessment results with scores and trends
  5. **Attendance**: Attendance records with rate calculation
  6. **Documents**: Uploaded files and vetting status

- **Visual Statistics:**
  - Color-coded status chips
  - Progress bars for scores and attendance
  - Statistical cards for quick overview
  - Responsive tables with sorting

**Usage:**
```jsx
import CandidateProfileDialog from '../../components/trainer/CandidateProfileDialog';

<CandidateProfileDialog
  open={profileDialogOpen}
  onClose={() => setProfileDialogOpen(false)}
  candidateId={selectedCandidateId}
/>
```

#### Enhanced TrainerStudents Page
**Location:** `/frontend/src/pages/trainer/TrainerStudents.jsx`

**New Features:**
1. **View Profile Button**: Opens comprehensive candidate profile
2. **Run Assessment Button**: Quick assessment creation
3. **Assessment Dialog**: In-page assessment form with:
   - Assessment type selection (Quiz, Assignment, Midterm, Final, Project, Practical)
   - Score input (0-100%)
   - Result category (Distinction, Merit, Pass, Fail)
   - Trainer comments field

**Actions Available:**
- 👁️ **View Profile**: Opens detailed candidate profile dialog
- 📝 **Run Assessment**: Create new assessment for candidate

### 3. **API Service Methods**

**Location:** `/frontend/src/api/trainer.js`

New methods added:
```javascript
// Get all candidates enrolled in trainer's courses
getAllCandidates: (params) => axios.get(`${API_URL}/candidates`, { params })

// Get detailed candidate profile
getCandidateProfile: (candidateId) => axios.get(`${API_URL}/candidates/${candidateId}`)

// Create assessment for specific candidate
createCandidateAssessment: (candidateId, data) => 
  axios.post(`${API_URL}/candidates/${candidateId}/assessments`, data)
```

## User Flow

### Viewing Candidate Profile

1. **Navigate to Students Page**
   - Trainer goes to "Students" in sidebar
   - Selects a course from dropdown
   - Views list of enrolled students

2. **Open Profile**
   - Clicks "View Profile" icon (👁️) next to student
   - Profile dialog opens with 6 tabs

3. **Review Information**
   - **Personal Info Tab**: View demographics and contact
   - **Professional Tab**: Review work experience and skills
   - **Enrollments Tab**: Check all course enrollments and progress
   - **Assessments Tab**: Review all assessment results and average score
   - **Attendance Tab**: Check attendance rate and records
   - **Documents Tab**: View uploaded documents and vetting status

### Running Assessment

1. **Initiate Assessment**
   - From Students page, click "Run Assessment" icon (📝)
   - Assessment dialog opens with candidate name

2. **Fill Assessment Details**
   - Select assessment type (Quiz, Assignment, etc.)
   - Enter score (0-100%)
   - Choose result category (Distinction, Merit, Pass, Fail)
   - Add trainer comments and feedback

3. **Save Assessment**
   - Click "Save Assessment"
   - System validates and creates assessment
   - Success notification appears
   - Student list refreshes

## Security & Access Control

### Authorization Rules

1. **Candidate List Access**
   - Trainers can only see candidates enrolled in their assigned courses
   - List automatically filters by trainer's course assignments

2. **Profile Access**
   - Trainer must be assigned to at least one course the candidate is enrolled in
   - Access denied (403) if no common courses
   - Backend verifies trainer assignment on every request

3. **Assessment Creation**
   - Trainer must be assigned to the course
   - Candidate must be enrolled in the specified course
   - All validations happen server-side

## Database Schema

### Assessment Table
```sql
model Assessment {
  id              Int      @id @default(autoincrement())
  enrollmentId    Int
  courseId        Int
  assessmentTitle String?
  assessmentType  String
  maxScore        Float    @default(100)
  score           Float?
  percentage      Float?
  resultCategory  String?
  trainerComments String?
  feedback        String?
  assessmentDate  DateTime @default(now())
  createdBy       Int
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  enrollment      Enrollment @relation(fields: [enrollmentId], references: [id])
  course          Course     @relation(fields: [courseId], references: [id])
  createdByUser   User       @relation(fields: [createdBy], references: [id])
}
```

## Testing Guide

### Manual Testing

1. **Test Candidate List**
```bash
# Login as trainer
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"trainer@example.com","password":"password123"}'

# Get all candidates
curl http://localhost:5000/api/trainer/candidates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

2. **Test Profile Access**
```bash
# Get specific candidate profile
curl http://localhost:5000/api/trainer/candidates/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

3. **Test Assessment Creation**
```bash
# Create assessment
curl -X POST http://localhost:5000/api/trainer/candidates/1/assessments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": 5,
    "assessmentType": "Quiz",
    "score": 85,
    "resultCategory": "MERIT",
    "trainerComments": "Great work!"
  }'
```

### Frontend Testing

1. **Login as Trainer**
   - Navigate to http://localhost:5173
   - Login with trainer credentials

2. **View Students**
   - Click "Students" in sidebar
   - Select course from dropdown
   - Verify student list appears

3. **Test Profile View**
   - Click "View Profile" icon
   - Verify all 6 tabs load correctly
   - Check statistics are calculated properly

4. **Test Assessment Creation**
   - Click "Run Assessment" icon
   - Fill in assessment form
   - Submit and verify success message
   - Refresh and check assessment appears in candidate's profile

## Key Features Summary

✅ **Comprehensive Candidate Profiles**
- Personal demographics and contact information
- Professional background and work experience
- Education and language proficiency
- Skills and job preferences

✅ **Complete Training History**
- All course enrollments with status
- Assessment results with scores and feedback
- Attendance records with rate calculation
- Document uploads and vetting status

✅ **Quick Assessment Creation**
- In-page assessment form
- Multiple assessment types supported
- Automatic score calculation
- Result categorization (Distinction to Fail)

✅ **Statistical Dashboard**
- Enrollment statistics
- Average assessment scores
- Attendance rate tracking
- Pass/fail rates

✅ **Security & Access Control**
- Trainer-course verification
- Candidate-enrollment validation
- Secure API endpoints
- Role-based access control

## Future Enhancements

1. **Bulk Assessment Import**: Upload CSV of assessment results
2. **Assessment Templates**: Pre-configured assessment types per course
3. **Performance Analytics**: Trending graphs for candidate progress
4. **Export Reports**: PDF/Excel exports of candidate profiles
5. **Comparison Tool**: Compare multiple candidates side-by-side
6. **Notification System**: Alert trainers of low-performing candidates
7. **Assessment Scheduling**: Schedule future assessments with reminders

## File Changes Summary

### Backend Files Modified
- `/backend/src/controllers/trainerController.js` - Added 3 new controller methods
- `/backend/src/routes/trainerRoutes.js` - Added 3 new routes

### Frontend Files Created/Modified
- `/frontend/src/components/trainer/CandidateProfileDialog.jsx` - New component (650+ lines)
- `/frontend/src/pages/trainer/TrainerStudents.jsx` - Enhanced with profile view and assessments
- `/frontend/src/api/trainer.js` - Added 3 new API methods

## Support

For issues or questions:
- Check backend logs: `/backend/backend.log`
- Check browser console for frontend errors
- Verify database connection and migrations
- Ensure trainer is assigned to courses in database

---

**Implementation Date:** December 9, 2024  
**Version:** 1.0.0  
**Status:** ✅ Fully Implemented and Tested
