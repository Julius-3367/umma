# Vetting Process Guide

## Overview
The vetting process is a critical step in the candidate journey that verifies eligibility and clears candidates for certificate issuance.

## Current Implementation Status

### ✅ What's Already Built
1. **Vetting Data Model** (Database schema exists)
2. **Admin Vetting Dashboard** (`/admin/vetting`)
3. **Vetting Status in Application Tracking**
4. **Auto-Certificate Issuance** when vetting approved

### 🔄 What Needs Integration
1. Document upload interface for candidates
2. Email notifications for vetting status changes
3. Automated background check triggers

## Vetting Workflow

### Phase 1: Application Approval
1. Candidate applies to cohort
2. Admin approves application
3. **Status: ENROLLED**
4. **Vetting Status: PENDING**

### Phase 2: Vetting Process (Current - Manual)
```
PENDING → Document Collection
    ↓
IN_PROGRESS → Admin Review
    ↓
APPROVED/REJECTED → Final Decision
```

### Phase 3: Certificate Eligibility
Certificate is auto-issued when ALL criteria met:
1. ✅ Vetting Status = APPROVED
2. ✅ Attendance Rate ≥ 80%
3. ✅ All Assessments Passed
4. ✅ Cohort Status = COMPLETED

## Vetting Requirements

### Documents Required (Example - Customize per Country)
1. **Police Clearance Certificate**
   - Valid for 6 months
   - Criminal record check
   
2. **Medical Certificate**
   - Health fitness certification
   - Valid for 3 months
   
3. **Educational Certificates**
   - Proof of education level
   - Transcripts
   
4. **Identity Documents**
   - National ID / Passport
   - Birth Certificate
   
5. **References**
   - 2 professional references
   - Contact information verified

## Vetting Statuses

### PENDING
- **Meaning**: Awaiting document submission
- **Candidate Action**: Upload required documents
- **Admin Action**: None yet
- **Certificate**: Blocked

### IN_PROGRESS
- **Meaning**: Documents under review
- **Candidate Action**: Wait for review
- **Admin Action**: Review documents, conduct checks
- **Certificate**: Blocked

### APPROVED
- **Meaning**: All checks passed
- **Candidate Action**: None
- **Admin Action**: None
- **Certificate**: Eligible (if other criteria met)

### REJECTED
- **Meaning**: Failed vetting requirements
- **Candidate Action**: Appeal or re-apply
- **Admin Action**: Document rejection reason
- **Certificate**: Permanently blocked

## Admin Vetting Dashboard

### Current Features (Existing Page)
**Location**: `frontend/src/pages/admin/VettingDashboard.jsx`

**Features**:
- List of all candidates requiring vetting
- Filter by vetting status
- View candidate documents
- Update vetting status
- Add review notes

### How to Use
1. Navigate to `/admin/vetting`
2. View pending vetting records
3. Click on candidate to review documents
4. Update status:
   - Click "Approve" if all checks pass
   - Click "Reject" with reason if fails
5. Save changes

## Vetting in Application Tracking

### Candidate View
**Page**: `frontend/src/pages/candidate/MyApplications.jsx`

**Displays**:
- Vetting status chip (color-coded)
- Progress tracker showing vetting as step 4 of 5
- Alert when vetting pending
- Instructions to complete vetting

**Status Colors**:
- 🟡 PENDING - Yellow (Warning)
- 🔵 IN_PROGRESS - Blue (Info)
- 🟢 APPROVED - Green (Success)
- 🔴 REJECTED - Red (Error)

### Admin View
**Page**: `frontend/src/pages/admin/CohortApplications.jsx`

**Displays**:
- Vetting status for each application
- Count of pending vetting in statistics
- Quick access to vetting dashboard

## Automated Vetting Integration

### Recommended Services

#### 1. Background Checks
**Providers**:
- Checkr (US, Global)
- Sterling (International)
- First Advantage (Global)

**Integration**:
```javascript
// Example: Trigger background check on enrollment
async function initiateBGCheck(candidateId) {
  const response = await checkrAPI.createBackgroundCheck({
    candidate: candidateId,
    package: 'standard',
  });
  
  // Update vetting status to IN_PROGRESS
  await prisma.enrollment.update({
    where: { candidateId },
    data: { vettingStatus: 'IN_PROGRESS' }
  });
}
```

#### 2. Document Verification
**Providers**:
- Onfido (ID verification, Document OCR)
- Jumio (Identity verification)
- Trulioo (Global ID verification)

**Integration**:
```javascript
// Example: Verify uploaded documents
async function verifyDocument(documentUrl, type) {
  const result = await onfidoAPI.checkDocument({
    url: documentUrl,
    type: type, // 'passport', 'id_card', etc.
  });
  
  return result.status === 'clear';
}
```

#### 3. Criminal Record Checks
**Providers**:
- NCIS (Kenya)
- CriminalRecordAPI
- Country-specific providers

**Integration**:
```javascript
// Example: Kenya NCIS integration
async function checkCriminalRecord(idNumber) {
  const response = await ncisAPI.checkRecord(idNumber);
  return response.clearance === 'clean';
}
```

## Enhanced Vetting System (Recommended Implementation)

### Phase 1: Document Upload (Candidate Side)

**New Component**: `CandidateDocumentUpload.jsx`

```javascript
// Candidate uploads documents for vetting
const uploadVettingDocument = async (file, type) => {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('type', type); // 'police', 'medical', 'education', etc.
  
  await axios.post('/candidate/vetting/upload', formData);
};
```

**Features**:
- Drag-and-drop file upload
- Document type selection
- Progress indicator
- File validation (size, format)
- Preview before submit

### Phase 2: Automated Checks (Backend)

**New Service**: `vettingAutomationService.js`

```javascript
const initiateVettingProcess = async (enrollmentId) => {
  // 1. Create vetting record
  const vetting = await prisma.vettingRecord.create({
    data: {
      enrollmentId,
      status: 'PENDING',
    }
  });
  
  // 2. Trigger automated checks
  await Promise.all([
    checkBackgroundAPI(enrollment.candidateId),
    verifyDocuments(enrollment.candidateId),
    checkCriminalRecord(enrollment.candidateId),
  ]);
  
  // 3. Update status
  await prisma.vettingRecord.update({
    where: { id: vetting.id },
    data: { status: 'IN_PROGRESS' }
  });
  
  // 4. Notify candidate
  sendEmail(candidate.email, 'Vetting process started');
};
```

### Phase 3: Admin Review (Manual Override)

**Enhanced Dashboard**:
- View automated check results
- Manual review for edge cases
- Override automated decisions
- Add review notes

## Vetting Automation Service Integration

### Current File
**Location**: `backend/src/services/cohortAutomationService.js`

**Function**: `checkAndIssueCertificate()`

```javascript
// Current implementation checks:
if (
  enrollment.vettingStatus === 'APPROVED' &&  // ✅ Must pass vetting
  attendanceRate >= 80 &&                     // ✅ 80% attendance
  allAssessmentsPassed                         // ✅ All assessments
) {
  // Auto-issue certificate
}
```

## Notification Templates

### Vetting Started
**To**: Candidate
**Subject**: "Action Required: Complete Your Vetting Process"
```
Hi {firstName},

Congratulations on your enrollment in {cohortName}!

To complete your enrollment and be eligible for certification, please complete the vetting process:

1. Upload Police Clearance Certificate
2. Upload Medical Certificate
3. Upload Educational Certificates

Upload documents at: [Link to portal]

Deadline: {deadline}

Questions? Contact support@wti.org
```

### Vetting In Progress
**To**: Candidate
**Subject**: "Vetting Under Review"
```
Hi {firstName},

Your documents are being reviewed. This typically takes 3-5 business days.

We'll notify you once the review is complete.

Current Status:
- Documents Received: ✅
- Background Check: In Progress
- Criminal Record Check: In Progress
```

### Vetting Approved
**To**: Candidate
**Subject**: "Vetting Approved - You're All Set!"
```
Hi {firstName},

Great news! Your vetting process is complete and approved.

You are now fully eligible for certification upon completing:
- Attendance requirement (80%+)
- All course assessments

Keep up the great work in {cohortName}!
```

### Vetting Rejected
**To**: Candidate
**Subject**: "Vetting Status Update"
```
Hi {firstName},

Unfortunately, we were unable to complete your vetting process.

Reason: {rejectionReason}

If you believe this is an error, you can:
1. Contact our support team
2. Submit an appeal with additional documentation

Support: support@wti.org
```

## Database Schema (Existing)

### Enrollment Table
```sql
Enrollment {
  vettingStatus    String?   // PENDING, IN_PROGRESS, APPROVED, REJECTED
}
```

### VettingRecord Table (If exists)
```sql
VettingRecord {
  id                    Int       @id
  enrollmentId          Int
  status                String    // PENDING, IN_PROGRESS, APPROVED, REJECTED
  policeDocumentUrl     String?
  medicalDocumentUrl    String?
  educationDocumentUrl  String?
  reviewNotes           String?
  reviewedBy            Int?
  reviewedAt            DateTime?
  rejectionReason       String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}
```

## Quick Start Guide (For Admins)

### Manual Vetting Approval
1. Go to `/admin/vetting`
2. Find candidate with PENDING vetting
3. Review uploaded documents
4. Click "Approve" or "Reject"
5. If rejecting, provide reason
6. Save changes

### Bulk Vetting Approval
1. Go to `/admin/vetting`
2. Select multiple candidates (checkbox)
3. Click "Bulk Approve"
4. Confirm action

### Vetting Report
1. Go to `/admin/reports`
2. Select "Vetting Report"
3. Choose date range
4. Export as CSV/PDF

## API Endpoints

### Existing
```
GET    /admin/vetting/dashboard          // Vetting dashboard data
PUT    /admin/vetting/:id                // Update vetting status
```

### Recommended (To Add)
```
POST   /candidate/vetting/upload         // Upload vetting document
GET    /candidate/vetting/status         // Check my vetting status
GET    /candidate/vetting/requirements   // Get required documents
```

## Metrics to Track

### Vetting Performance
- Average time from PENDING → APPROVED
- Rejection rate
- Re-submission rate
- Documents requiring manual review

### Compliance
- % of enrollments with completed vetting
- % meeting vetting deadline
- Documents expiry tracking

## Best Practices

### For Candidates
1. **Upload Early**: Don't wait until the last minute
2. **Quality Scans**: Ensure documents are clear and readable
3. **Valid Documents**: Check expiry dates before upload
4. **Complete Set**: Upload all required documents at once

### For Admins
1. **Fast Review**: Review within 24-48 hours
2. **Clear Reasons**: Provide specific rejection reasons
3. **Consistent Standards**: Use same criteria for all
4. **Document Review**: Keep notes for audit trail

## Troubleshooting

### Issue: Vetting Status Stuck on PENDING
**Solution**: 
- Check if candidate uploaded all documents
- Verify automated checks completed
- Manually trigger review if needed

### Issue: Cannot Update Vetting Status
**Solution**:
- Ensure you have admin permissions
- Check if enrollment exists
- Verify vetting record created

### Issue: Certificate Not Auto-Issued Despite Approval
**Solution**:
- Check attendance rate (must be ≥ 80%)
- Verify all assessments passed
- Confirm cohort status is COMPLETED
- Check cohortAutomationService logs

## Summary

The vetting process is partially implemented with:
- ✅ Database schema
- ✅ Admin dashboard for manual review
- ✅ Status tracking in application view
- ✅ Auto-certificate trigger when approved

Next steps to complete:
- 🔄 Document upload interface for candidates
- 🔄 Email notifications
- 🔄 Integration with background check APIs
- 🔄 Automated document verification

The foundation is solid - additional features can be layered on as needed!
