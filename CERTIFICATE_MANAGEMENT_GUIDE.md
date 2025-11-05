# Certificate Management System - Testing Guide

## Overview
A complete end-to-end certificate management system has been implemented with the following features:

## Features Implemented

### 1. **Certificate List Tab**
- View all certificates (issued, pending, revoked, expired)
- Search by certificate number, candidate name, or email
- Filter by status and course
- Statistics cards showing total, issued, pending, and revoked certificates
- Actions available:
  - **Download** certificates (for issued certificates)
  - **Send via Email** to candidates
  - **Revoke** certificates with reason
  - **Reissue** revoked certificates

### 2. **Pending Approvals Tab**
- View all pending certificate requests (enrollments with COMPLETED status)
- Filter by course and search
- Approve certificates with:
  - Certificate template selection
  - Grade assignment (optional)
  - Remarks/comments (optional)
- Reject certificates with reason
- Auto-generates certificate upon approval with:
  - Unique certificate number (CERT-{timestamp}-{random})
  - QR code with certificate data
  - Digital signature (SHA256 hash)
  - Issue date and optional expiry date

### 3. **Templates Tab**
- Create and manage certificate templates
- Template features:
  - Name and description
  - Design settings (colors, borders)
  - Content with placeholders: `{candidateName}`, `{courseName}`, `{issueDate}`
  - Active/Inactive toggle
- Edit existing templates
- Delete templates
- Template preview cards with metadata

### 4. **Verification Tab**
- Verify certificate authenticity by certificate number
- Shows complete certificate details:
  - Candidate information
  - Course details
  - Issue and expiry dates
  - Grade and remarks
  - Digital signature
  - Current status
- Visual status indicators (valid, revoked, expired)
- Quick search with enter key support

## Database Structure

### Certificate Model
```prisma
model Certificate {
  id                Int
  tenantId          Int
  enrollmentId      Int
  courseId          Int
  templateId        Int?
  certificateNumber String  @unique
  issueDate         DateTime
  expiryDate        DateTime?
  status            CertificateStatus  // PENDING, ISSUED, REVOKED, EXPIRED, REISSUED
  grade             String?
  remarks           String?
  qrCode            String?  // JSON data
  digitalSignature  String?  // SHA256 hash
  pdfUrl            String?
  issuedBy          Int?
}
```

### CertificateTemplate Model
```prisma
model CertificateTemplate {
  id          Int
  tenantId    Int
  name        String
  description String?
  design      Json?  // Colors, fonts, borders
  content     Json?  // Header, body, footer with placeholders
  isActive    Boolean
  createdBy   Int?
}
```

## API Endpoints

### Certificate Management
- `GET /api/admin/certificates` - Get all certificates with filters
- `GET /api/admin/certificates/:id` - Get certificate by ID
- `POST /api/admin/certificates/generate` - Generate single certificate
- `POST /api/admin/certificates/bulk-generate` - Bulk generate certificates
- `GET /api/admin/certificates/:id/download` - Download certificate PDF
- `POST /api/admin/certificates/:id/send` - Send certificate via email
- `POST /api/admin/certificates/verify` - Verify certificate by number
- `PUT /api/admin/certificates/:id/revoke` - Revoke certificate
- `POST /api/admin/certificates/:id/reissue` - Reissue revoked certificate
- `GET /api/admin/certificates/statistics` - Get certificate statistics

### Template Management
- `GET /api/admin/certificate-templates` - Get all templates
- `GET /api/admin/certificate-templates/:id` - Get template by ID
- `POST /api/admin/certificate-templates` - Create template
- `PUT /api/admin/certificate-templates/:id` - Update template
- `DELETE /api/admin/certificate-templates/:id` - Delete template

## Testing Instructions

### Step 1: Login
1. Navigate to `http://localhost:5173/login`
2. Login with admin credentials:
   - Email: `admin@labourmobility.com`
   - Password: `admin123`

### Step 2: Navigate to Certificate Management
1. Click on **"Certificates"** in the sidebar
2. You should see 4 tabs: **Certificates**, **Pending Approvals**, **Templates**, **Verification**

### Step 3: View Templates
1. Click on the **"Templates"** tab
2. You should see 1 default template created by the seed script
3. Try creating a new template:
   - Click **"Create Template"**
   - Fill in:
     - Name: "Advanced Certificate"
     - Description: "Advanced completion certificate"
     - Customize colors and content
   - Click **"Create"**

### Step 4: Approve Certificates
1. Click on the **"Pending Approvals"** tab
2. You should see 5 candidates with COMPLETED enrollments
3. Click **"Approve"** on one:
   - Select a template (or use default)
   - Enter grade (e.g., "A", "95%", "Distinction")
   - Add remarks (optional)
   - Click **"Approve & Generate"**
4. Certificate will be generated with ISSUED status

### Step 5: View Issued Certificates
1. Click on the **"Certificates"** tab
2. You should see the approved certificate(s)
3. Statistics cards will show updated counts
4. Try the following actions:
   - **Download**: Download the certificate
   - **Send**: Send via email (enter email address)
   - **Revoke**: Revoke the certificate (provide reason)

### Step 6: Verify Certificates
1. Click on the **"Verification"** tab
2. Copy a certificate number from the Certificates tab
3. Paste it in the search box and click **"Verify"**
4. You should see complete certificate details with status

### Step 7: Test Filters and Search
1. Go back to **"Certificates"** tab
2. Try searching by:
   - Candidate name
   - Email
   - Certificate number
3. Filter by:
   - Status (Issued, Pending, Revoked)
   - Course
4. Click **"Refresh"** to reload data

## Test Data Created

The seed script (`backend/scripts/seedCertificateData.js`) created:
- **1 tenant**: Default Organization
- **1 course**: Professional Construction Safety Training
- **5 candidate users**: candidate1@test.com through candidate5@test.com
- **5 enrollments**: All with COMPLETED status
- **1 certificate template**: Default Certificate Template

## Production-Ready Features

1. **Multi-tenant Support**: All data is scoped to tenantId
2. **Role-Based Access**: Only admins can access certificate management
3. **Audit Trail**: Created by and updated by tracking
4. **Data Validation**: Frontend and backend validation
5. **Error Handling**: Comprehensive error messages
6. **Real-time Updates**: Statistics update after actions
7. **Security**: Digital signatures and QR codes for verification
8. **Status Management**: Proper workflow from PENDING → ISSUED → REVOKED/REISSUED
9. **Bulk Operations**: Support for bulk certificate generation
10. **Email Integration**: Ready for email service integration

## Navigation

The certificate management is accessed from:
- **Sidebar**: Admin → Certificates
- **Route**: `/admin/certificates`
- **Component**: `/frontend/src/pages/admin/CertificateManagement.jsx`

## Key Components

1. `/frontend/src/components/certificates/CertificateList.jsx` - Main list view
2. `/frontend/src/components/certificates/CertificateApprovalQueue.jsx` - Approval workflow
3. `/frontend/src/components/certificates/CertificateTemplates.jsx` - Template management
4. `/frontend/src/components/certificates/CertificateVerification.jsx` - Verification system

## Backend Controller

All logic is in `/backend/src/controllers/adminController.js`:
- Certificate generation with QR codes and signatures
- Template CRUD operations
- Certificate lifecycle management (issue, revoke, reissue)
- Verification logic
- Statistics aggregation

## Next Steps for Production

1. **PDF Generation**: Integrate a PDF library (e.g., PDFKit, Puppeteer) to generate actual certificate PDFs
2. **Email Service**: Connect to email provider (SendGrid, AWS SES) for certificate delivery
3. **QR Code Library**: Use proper QR code generation library (qrcode, node-qrcode)
4. **File Storage**: Integrate cloud storage (AWS S3, Azure Blob) for certificate PDFs
5. **Notifications**: Send notifications to candidates when certificates are issued
6. **Certificate Expiry**: Implement automated expiry date checks and notifications
7. **Bulk Download**: Add ability to download multiple certificates as ZIP
8. **Certificate History**: Track all changes (revocations, reissues) in audit log

## Troubleshooting

### No pending approvals showing?
- Run the seed script: `cd backend && node scripts/seedCertificateData.js`
- Ensure enrollments have COMPLETED status

### Certificate tables don't exist?
- Run migration: `cd backend && npx prisma migrate dev`

### Frontend not loading?
- Clear browser cache (Ctrl + Shift + R)
- Check console for errors
- Verify backend is running on correct port

### Backend errors?
- Check `.env` file has correct DATABASE_URL
- Ensure MySQL is running
- Check backend terminal for error messages

## Color Theme

The system now uses a deep blue theme:
- **Primary**: #1e40af (Deep Blue)
- **Secondary**: #78BE21 (Lime Green)
- **Success**: #10b981
- **Warning**: #f59e0b
- **Error**: #ef4444

All pages including login and signup now display with the deep blue theme.
