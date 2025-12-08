# Complete Test Guide: Cohort Application Workflow

## Prerequisites
✅ Backend running on: http://localhost:5000
✅ Frontend running on: http://localhost:5173

## Test Workflow

### Step 1: Create a Cohort (Admin)

1. **Login as Admin**
   - Navigate to: http://localhost:5173/
   - Use admin credentials

2. **Go to Cohorts**
   - Click "Cohorts" in the sidebar

3. **Create New Cohort**
   - Click "Create Cohort" button
   - Fill in the form:
     ```
     Cohort Code: TEST-2025-001
     Cohort Name: Test Cohort December 2025
     Course: (Select any course from dropdown)
     Lead Trainer: (Select any trainer)
     Start Date: 2025-12-15
     End Date: 2026-01-15
     Enrollment Deadline: 2025-12-14
     Max Capacity: 20
     Location: Nairobi, Kenya
     Description: Test cohort for application workflow
     Status: ENROLLMENT_OPEN (Important!)
     ```
   - Click "Create Cohort"
   - ✅ You should see success message
   - ✅ Cohort appears in the list

4. **Verify Cohort Creation**
   - Click on the newly created cohort
   - ✅ Cohort Details page opens
   - ✅ You should see "Enrollments" tab
   - ✅ Click "Enrollments" tab
   - ✅ You should see two sub-tabs:
     - "Applications (0)"
     - "Enrolled (0)"

### Step 2: Apply for Cohort (Candidate)

1. **Logout from Admin**
   - Click profile icon → Logout

2. **Login as Candidate**
   - Use candidate credentials
   - ✅ You should land on Candidate Dashboard

3. **Browse Available Cohorts**
   - You should see an alert: "🎉 New Training Cohorts Available!"
   - OR click "Browse Cohorts" in Quick Actions
   - OR navigate to: http://localhost:5173/candidate/browse-cohorts

4. **View Available Cohorts**
   - ✅ You should see "TEST-2025-001" cohort
   - ✅ It should show:
     - Cohort name and code
     - Course title
     - Start/End dates
     - Capacity (e.g., "20 / 20 spots left")
     - Enrollment deadline
     - "Apply Now" button (enabled)

5. **Apply to Cohort**
   - Click "Apply Now" button on TEST-2025-001
   - ✅ Confirmation dialog appears
   - ✅ Shows cohort details
   - Click "Submit Application"
   - ✅ Success notification: "Successfully applied to [cohort name]!"
   - ✅ Cohort disappears from browse list (already applied)

6. **Verify Application**
   - Click "My Applications" in sidebar
   - OR navigate to: http://localhost:5173/candidate/my-applications
   - ✅ You should see your application
   - ✅ Status: "APPLIED" (yellow/warning chip)
   - ✅ Vetting Status: "N/A" or "PENDING"
   - ✅ Progress bar shows some percentage
   - ✅ Applied On: Today's date

### Step 3: Review Application (Admin)

1. **Logout from Candidate**
   - Click profile icon → Logout

2. **Login as Admin**
   - Use admin credentials

3. **Navigate to Cohorts**
   - Click "Cohorts" in sidebar
   - ✅ You should see cohorts list

4. **Open the Test Cohort**
   - Click on "TEST-2025-001" cohort
   - ✅ Cohort Details page opens

5. **Check Applications Tab**
   - Click "Enrollments" tab (if not already selected)
   - ✅ You should see sub-tabs:
     - "Applications (1)" ← Should show count
     - "Enrolled (0)"
   - **IMPORTANT**: The sub-tabs should be visible!

6. **View Pending Applications**
   - Click "Applications (1)" sub-tab
   - ✅ You should see a table with:
     - Candidate: [Name]
     - Email: [Email]
     - Applied On: [Today's date]
     - Status: "APPLIED" (yellow chip with pending icon)
     - Actions: Two buttons
       - Green "Approve" button
       - Red "Reject" button

### Step 4: Approve Application (Admin)

1. **Open Browser Console** (F12)
   - Go to Console tab
   - ✅ You should see debug logs:
     ```
     Cohort Response: { success: true, data: {...} }
     Cohort Data: { id: X, cohortCode: "TEST-2025-001", enrollments: [...] }
     Enrollments: [{ id: X, candidateId: X, status: "APPLIED", ... }]
     ```

2. **Approve the Application**
   - Click green "Approve" button
   - ✅ Success notification: "Application approved successfully!"
   - ✅ Application disappears from "Applications" tab
   - ✅ "Applications (0)" count updates

3. **Verify Enrollment**
   - Click "Enrolled (1)" sub-tab
   - ✅ You should see the candidate in enrolled list
   - ✅ Status: "ENROLLED" or "APPROVED" (green/primary chip)
   - ✅ Enrollment Date: Today
   - ✅ Attendance: 0%
   - ✅ Assessments: 0 / 0
   - ✅ Vetting Status: "PENDING" (default chip)

### Step 5: Verify Candidate Status (Candidate)

1. **Logout from Admin**

2. **Login as Candidate**

3. **Check My Applications**
   - Navigate to: http://localhost:5173/candidate/my-applications
   - ✅ Application status changed to "ENROLLED" (green chip)
   - ✅ Progress bar increased
   - ✅ Progress tracker shows:
     - ✅ Application Submitted (completed)
     - ✅ Under Review (completed)
     - ✅ Enrolled (completed)
     - 🔄 Vetting Process (in progress)
     - ⏸️ Training Completed (pending)

4. **Check Dashboard**
   - Go to Dashboard
   - ✅ "My Cohorts" stat should show 1
   - ✅ "Enrolled" stat should show 1

---

## Alternative Test: Reject Application

If you want to test rejection instead:

### At Step 4 (Instead of Approving):

1. **Reject the Application**
   - Click red "Reject" button
   - ✅ Prompt appears: "Please provide a reason for rejection:"
   - Enter reason: "Insufficient prerequisites"
   - Click OK
   - ✅ Info notification: "Application rejected"
   - ✅ Application disappears from "Applications" tab

2. **Verify Candidate Status**
   - Login as candidate
   - Go to My Applications
   - ✅ Status: "REJECTED" (red chip)
   - ✅ Can apply to other cohorts

---

## Troubleshooting

### Issue 1: Applications Tab Shows (0) Even After Applying

**Check:**
1. Open browser console (F12)
2. Look for these logs:
   ```
   Cohort Response: ...
   Cohort Data: ...
   Enrollments: ...
   ```
3. If enrollments is empty `[]`, check backend:
   - Verify candidate actually applied
   - Check database: `SELECT * FROM cohort_enrollments WHERE cohortId = [ID];`

**Fix:**
- The code now handles both response formats: `cohortRes.data.data` and `cohortRes.data`
- Console logs will show which format is being used

### Issue 2: "Applications" Sub-tab Not Visible

**Check:**
- Make sure you're on "Enrollments" main tab
- Sub-tabs should appear immediately below
- Check if `cohort` state is loaded (console logs)

### Issue 3: Approve/Reject Buttons Don't Work

**Check:**
- Open Network tab in browser console
- Click Approve button
- Look for POST request to `/admin/cohort-applications/:id/approve`
- Check response:
  - 200 OK = Success
  - 400 = Validation error (e.g., cohort full)
  - 404 = Application not found
  - 500 = Server error

### Issue 4: Cohort Not Appearing in Browse Cohorts (Candidate)

**Reasons:**
1. Cohort status is NOT "ENROLLMENT_OPEN"
2. Cohort start date is in the past
3. Candidate already applied
4. Cohort is at full capacity

**Fix:**
- Set status to "ENROLLMENT_OPEN"
- Set future start date
- Check backend logs

---

## Database Verification

If you want to verify at database level:

```sql
-- Check cohort
SELECT * FROM cohorts WHERE cohortCode = 'TEST-2025-001';

-- Check applications
SELECT 
  ce.id,
  ce.status,
  ce.applicationDate,
  ce.approvalDate,
  c.firstName,
  c.lastName,
  coh.cohortName
FROM cohort_enrollments ce
JOIN candidates c ON ce.candidateId = c.id
JOIN cohorts coh ON ce.cohortId = coh.id
WHERE coh.cohortCode = 'TEST-2025-001';
```

---

## Expected Console Output

When you open the cohort details page, you should see:

```javascript
Cohort Response: {
  success: true,
  data: {
    id: 1,
    cohortCode: "TEST-2025-001",
    cohortName: "Test Cohort December 2025",
    enrollments: [
      {
        id: 1,
        cohortId: 1,
        candidateId: 2,
        status: "APPLIED",
        applicationDate: "2025-12-07T...",
        candidate: {
          id: 2,
          fullName: "John Doe",
          user: {
            email: "john@example.com"
          }
        }
      }
    ],
    // ... other fields
  }
}

Cohort Data: { id: 1, cohortCode: "TEST-2025-001", ... }
Enrollments: [{ id: 1, status: "APPLIED", ... }]
```

---

## Success Criteria

✅ Admin can create cohort with ENROLLMENT_OPEN status
✅ Candidate can see cohort in Browse Cohorts page
✅ Candidate can apply to cohort
✅ Application appears in candidate's "My Applications"
✅ Admin can see application in Cohort Details → Enrollments → Applications tab
✅ Applications tab shows count badge: "Applications (1)"
✅ Admin can approve application
✅ Approved candidate appears in "Enrolled" sub-tab
✅ Candidate sees status change to "ENROLLED"
✅ OR Admin can reject with reason
✅ Rejected candidate sees status "REJECTED"

---

## Next Steps After Testing

If test is successful:
- ✅ Remove console.log statements (optional)
- ✅ Add email notifications for approve/reject
- ✅ Add document upload for vetting
- ✅ Enhance rejection dialog (use Material-UI Dialog instead of prompt)

If test fails:
- 📋 Check browser console for errors
- 📋 Check backend terminal for errors
- 📋 Verify database entries
- 📋 Share error messages for debugging
