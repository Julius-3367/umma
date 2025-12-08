# Reports Module - Complete Implementation Guide

**Implementation Date:** December 8, 2025  
**Status:** ✅ **PRODUCTION READY**

## Overview

The Reports module provides comprehensive data export and analytics capabilities for the Labour Mobility Training Management System. It supports 9 different report types covering all major aspects of the system.

---

## 📊 Available Reports

### 1. Enrollment Statistics Report
**ID:** `enrollments`  
**Description:** Detailed enrollment data including status, dates, and candidate information

**Fields:**
- Enrollment ID
- Candidate Name & Email
- Cohort Name & Code
- Course Name & Code
- Status (APPLIED, ENROLLED, COMPLETED, etc.)
- Vetting Status
- Application Date
- Approval Date
- Progress Percentage

**Use Cases:**
- Track enrollment trends
- Monitor approval rates
- Analyze vetting progress
- Identify bottlenecks

---

### 2. Course Performance Report
**ID:** `courses`  
**Description:** Course statistics, cohorts, enrollments, and completion rates

**Fields:**
- Course ID & Code
- Course Title
- Duration
- Total Cohorts
- Active Cohorts
- Completed Cohorts
- Total Enrollments
- Average Enrollment Per Cohort
- Course Status
- Created Date

**Use Cases:**
- Evaluate course popularity
- Track course performance
- Capacity planning
- Resource allocation

---

### 3. Candidate Progress Report
**ID:** `candidates`  
**Description:** Candidate profiles, enrollments, completion status, and vetting records

**Fields:**
- Candidate ID
- Full Name & Email
- Gender & County
- National ID/Passport
- Total Enrollments
- Active Enrollments
- Completed Enrollments
- Vetting Cleared Count
- Candidate Status
- Registration Date

**Use Cases:**
- Track candidate progress
- Monitor completion rates
- Identify high performers
- Support candidate success

---

### 4. Cohort Summary Report
**ID:** `cohorts`  
**Description:** Cohort details, capacity, enrollment numbers, and session counts

**Fields:**
- Cohort ID & Code
- Cohort Name
- Course Name & Code
- Lead Trainer
- Start Date & End Date
- Max Capacity
- Current Enrollment
- Total Applications
- Enrolled Students
- Completed Students
- Withdrawn Students
- Total Sessions
- Cohort Status
- Created Date

**Use Cases:**
- Monitor cohort capacity
- Track cohort performance
- Trainer workload analysis
- Resource planning

---

### 5. Attendance Records Report
**ID:** `attendance`  
**Description:** Detailed attendance data with check-in/out times and status

**Fields:**
- Attendance ID
- Candidate Name & Email
- Cohort Name
- Course Name
- Session Title
- Date
- Status (PRESENT, ABSENT, LATE, EXCUSED)
- Check-in Time
- Check-out Time
- Notes

**Use Cases:**
- Track attendance patterns
- Identify absenteeism
- Compliance reporting
- Performance monitoring

---

### 6. Vetting Process Report
**ID:** `vetting`  
**Description:** Vetting applications, document status, and verification progress

**Fields:**
- Vetting ID
- Candidate Name & Email
- Vetting Status
- Police Clearance Number
- Medical Report Number
- Police Document Uploaded (Yes/No)
- Medical Report Uploaded (Yes/No)
- Verification Officer
- Review Date
- Application Date
- Comments

**Use Cases:**
- Track vetting pipeline
- Monitor document submission
- Identify verification delays
- Compliance tracking

---

### 7. Trainer Performance Report
**ID:** `trainers`  
**Description:** Trainer workload, cohorts led, student counts, and session statistics

**Fields:**
- Trainer ID
- Trainer Name & Email
- Total Cohorts
- Active Cohorts
- Completed Cohorts
- Total Students
- Total Sessions
- Average Students Per Cohort
- Trainer Status
- Joined Date

**Use Cases:**
- Evaluate trainer performance
- Balance workload
- Identify training needs
- Recognition and rewards

---

### 8. Certificate Issuance Report
**ID:** `certificates`  
**Description:** Certificates issued, candidate details, and revocation status

**Fields:**
- Certificate ID
- Certificate Number
- Candidate Name & Email
- Course Name & Code
- Cohort Name
- Template Name
- Issued Date
- Expiry Date
- Status (Active/Revoked)
- Revoked Reason

**Use Cases:**
- Track certificate issuance
- Monitor compliance
- Audit trail
- Quality assurance

---

### 9. Financial Overview Report
**ID:** `financial`  
**Description:** Payment records, revenue tracking, and financial transactions

**Fields:**
- Enrollment ID
- Cohort Name
- Course Name
- Enrollment Date
- Status
- Amount (Placeholder)
- Payment Status (Placeholder)
- Payment Date (Placeholder)

**Use Cases:**
- Revenue tracking
- Financial planning
- Budget analysis
- Compliance reporting

**Note:** Full payment integration pending

---

## 🔧 Technical Implementation

### Backend Architecture

**Location:** `/backend/src/services/reportService.js`

**Key Functions:**
```javascript
generateReportData(type, startDate, endDate, tenantId)
saveReportToFile(data, format, fileName)
convertToCSV(data)
```

**Report Generation Flow:**
1. API receives report request with parameters
2. Create job record in database (status: QUEUED)
3. Return job ID to client immediately (202 Accepted)
4. Process report asynchronously
5. Update job status to PROCESSING
6. Generate report data using reportService
7. Save file to uploads/reports directory
8. Update job status to COMPLETED with download URL
9. Client polls for status and downloads when ready

**Database Table:**
```sql
report_jobs:
- id (INT)
- tenantId (INT)
- type (VARCHAR) - Report type
- format (VARCHAR) - csv, json, pdf
- status (VARCHAR) - queued, processing, completed, failed
- downloadUrl (VARCHAR)
- error (TEXT)
- meta (JSON) - startDate, endDate, recordCount
- createdAt (DATETIME)
- startedAt (DATETIME)
- completedAt (DATETIME)
```

---

### Frontend Implementation

**Location:** `/frontend/src/pages/admin/Reports.jsx`

**Key Features:**
- Date range picker for filtering
- Format selection (CSV/JSON)
- Real-time job status polling (2-second intervals)
- Recent reports table with download links
- Status indicators (queued/processing/completed/failed)
- Record count display
- Error handling and notifications

**User Flow:**
1. Select report type card
2. (Optional) Set date range
3. (Optional) Choose format
4. Click "Generate Report"
5. System shows "Processing..." status
6. Poll for job status every 2 seconds
7. Download button appears when complete
8. View in Recent Reports table

---

## 📡 API Endpoints

### Generate Report
```
POST /api/admin/reports/generate
```

**Request Body:**
```json
{
  "type": "enrollments",
  "format": "csv",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "r_123_1733659200000",
    "type": "enrollments",
    "format": "csv",
    "status": "queued",
    "createdAt": "2025-12-08T10:00:00.000Z"
  }
}
```

---

### Get Report Status
```
GET /api/admin/reports/status/:jobId
```

**Response (Completed):**
```json
{
  "success": true,
  "data": {
    "id": "r_123_1733659200000",
    "type": "enrollments",
    "format": "csv",
    "status": "completed",
    "downloadUrl": "/uploads/reports/r_123_1733659200000.csv",
    "recordCount": 150,
    "createdAt": "2025-12-08T10:00:00.000Z",
    "completedAt": "2025-12-08T10:00:05.000Z"
  }
}
```

**Response (Failed):**
```json
{
  "success": true,
  "data": {
    "id": "r_123_1733659200000",
    "type": "enrollments",
    "format": "csv",
    "status": "failed",
    "error": "Database connection error",
    "createdAt": "2025-12-08T10:00:00.000Z",
    "completedAt": "2025-12-08T10:00:02.000Z"
  }
}
```

---

### Download Report
```
GET /api/admin/reports/download/:jobId
```

**Response:** File download (CSV/JSON)

---

### List Recent Reports
```
GET /api/admin/reports
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "r_123_1733659200000",
      "type": "enrollments",
      "format": "csv",
      "status": "completed",
      "downloadUrl": "/uploads/reports/r_123_1733659200000.csv",
      "meta": {
        "startDate": "2025-01-01",
        "endDate": "2025-12-31",
        "recordCount": 150
      },
      "createdAt": "2025-12-08T10:00:00.000Z"
    }
  ]
}
```

---

## 🧪 Testing Guide

### Manual Testing

1. **Login as Admin**
   - Email: `admin@labourmobility.com`
   - Password: `admin123`

2. **Navigate to Reports**
   - Click "Reports" in sidebar
   - URL: `http://localhost:5173/admin/reports`

3. **Generate a Report**
   - Select date range (optional)
   - Choose format (CSV or JSON)
   - Click on any report card
   - Observe "Processing..." message
   - Wait for completion (usually < 5 seconds)
   - Click "Download" button

4. **Verify Downloaded File**
   - Open CSV in Excel/Google Sheets
   - Verify data accuracy
   - Check column headers
   - Confirm record count

5. **Check Recent Reports**
   - Scroll to "Recent Reports" table
   - Verify report appears
   - Check status, format, record count
   - Verify download link works

6. **Test Error Handling**
   - Generate report with invalid date range
   - Verify error message displays
   - Check failed status in Recent Reports

### Automated Testing

**Backend Test:**
```bash
cd /home/julius/WTI/backend
node -e "
require('dotenv').config();
const reportService = require('./src/services/reportService');

(async () => {
  // Test enrollment report
  const data = await reportService.generateReportData('enrollments', null, null, 1);
  console.log('Enrollment Report:', data.length, 'records');
  
  // Save to file
  const fileName = 'test_report.csv';
  await reportService.saveReportToFile(data, 'csv', fileName);
  console.log('File saved:', fileName);
})();
"
```

**Frontend Test:**
```bash
# Open browser console at http://localhost:5173/admin/reports
# Run:
adminService.generateReport({ type: 'enrollments', format: 'csv' })
  .then(res => console.log('Job created:', res.data))
  .catch(err => console.error('Error:', err));
```

---

## 📋 Sample Report Output

### Enrollment Statistics Report (CSV)
```csv
"enrollmentId","candidateName","candidateEmail","cohortName","cohortCode","courseName","courseCode","status","vettingStatus","applicationDate","approvalDate","progress"
"1","John Doe","john@example.com","January 2025 Batch","COH-2025-001","Customer Service","CS101","ENROLLED","PENDING","2025-01-15","2025-01-20","45"
"2","Jane Smith","jane@example.com","February 2025 Batch","COH-2025-002","Healthcare","HC101","COMPLETED","CLEARED","2025-02-01","2025-02-05","100"
```

### Course Performance Report (CSV)
```csv
"courseId","courseCode","courseTitle","duration","totalCohorts","activeCohorts","completedCohorts","totalEnrollments","averageEnrollmentPerCohort","status","createdDate"
"1","CS101","Customer Service Excellence","30 days","5","2","3","150","30","ACTIVE","2024-06-01"
"2","HC101","Healthcare Basics","45 days","3","1","2","90","30","ACTIVE","2024-07-15"
```

---

## 🔒 Security & Permissions

- **Access:** Admin and Recruiter roles only
- **Authentication:** JWT token required
- **Tenant Isolation:** Reports filtered by user's tenantId
- **File Storage:** Secure uploads directory with access control
- **Data Privacy:** No sensitive passwords or authentication data

---

## ⚙️ Configuration

**Environment Variables:**
```env
# No additional env vars required
# Uses existing DATABASE_URL
```

**File Storage:**
- **Directory:** `/backend/uploads/reports/`
- **Format:** `{jobId}.{format}`
- **Retention:** Manual cleanup recommended
- **Size Limit:** Depends on database query results

---

## 🚀 Performance Optimization

**Database Queries:**
- Indexed fields for faster filtering
- Limited result sets (take 1000 for safety)
- Efficient joins and includes
- Tenant-based filtering

**File Generation:**
- Async processing (non-blocking)
- Streaming writes for large datasets
- Memory-efficient CSV generation
- Background job processing

**Frontend:**
- Job status polling (2-second intervals)
- Automatic cleanup on completion
- Download via direct file link
- Lazy loading of recent reports

---

## 🐛 Troubleshooting

### Report Generation Fails

**Symptom:** Status shows "failed" with error message

**Possible Causes:**
1. Database connection error
2. Invalid date range
3. Missing tenant data
4. Disk space full

**Solutions:**
1. Check database connectivity
2. Verify date format (YYYY-MM-DD)
3. Ensure tenantId is valid
4. Check uploads directory permissions

---

### Download Link Not Working

**Symptom:** 404 error when clicking download

**Possible Causes:**
1. File was deleted manually
2. Incorrect file path
3. Missing static file serving

**Solutions:**
1. Regenerate report
2. Check backend logs
3. Verify Express static middleware

---

### Slow Report Generation

**Symptom:** Reports take >30 seconds

**Possible Causes:**
1. Large dataset (>10,000 records)
2. Complex joins
3. Database performance

**Solutions:**
1. Add date range filtering
2. Optimize database indexes
3. Consider pagination
4. Cache frequent queries

---

## 📈 Future Enhancements

### Phase 2 Features:
- ✅ CSV export (implemented)
- ✅ JSON export (implemented)
- ⏳ PDF export with formatting
- ⏳ Excel export with multiple sheets
- ⏳ Chart/graph visualizations
- ⏳ Scheduled reports (daily/weekly/monthly)
- ⏳ Email delivery of reports
- ⏳ Report templates customization

### Phase 3 Features:
- ⏳ Dashboard widgets from reports
- ⏳ Real-time analytics
- ⏳ Custom report builder
- ⏳ API webhooks for report completion
- ⏳ Report sharing with external users
- ⏳ Data warehouse integration

---

## 📞 Support

For issues or questions:
- **Technical Lead:** System Administrator
- **Documentation:** This guide
- **Code Location:** 
  - Backend: `/backend/src/services/reportService.js`
  - Frontend: `/frontend/src/pages/admin/Reports.jsx`
  - API: `/backend/src/controllers/adminController.js`

---

**Last Updated:** December 8, 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅
