# Admin Dashboard - Complete Testing Checklist

## 🚀 Getting Started

### Login
1. Open browser: `http://localhost:5173`
2. Login with admin credentials:
   - **Email**: `admin@labourmobility.com`
   - **Password**: `admin123`
3. You should be redirected to the admin dashboard

---

## 📊 Dashboard Features to Test

### 1. KPI Metrics Cards (Home Dashboard)
**Location**: `/admin/dashboard`

**Test Each Card:**
- [ ] **Total Enrollments Card**
  - Displays enrollment count
  - Shows trend indicator (up/down arrow)
  - Shows percentage change
  - Click navigates to enrollments page
  
- [ ] **Active Trainees Card**
  - Shows candidate count
  - Trend indicator visible
  - Click navigates to candidates list
  
- [ ] **Monthly Completion Rate Card**
  - Displays percentage
  - Shows trend comparison
  - Click navigates to completion reports
  
- [ ] **Placement Percentage Card**
  - Shows placement rate
  - Trend indicator present
  - Click navigates to placement reports
  
- [ ] **Revenue Summary Card**
  - Displays formatted currency ($)
  - Shows revenue trend
  - Click navigates to financial reports
  
- [ ] **System Alerts Card**
  - Shows total alerts count
  - Critical/Warning/Info badges visible
  - Color coding (red if critical)
  - Click navigates to alerts page

**Expected Behavior:**
- All cards should load without errors
- Hover effect (card lifts slightly)
- Smooth animations
- Numbers formatted with commas
- Currency formatted correctly

---

## 👥 User Management

### 2. Users Page
**Location**: `/admin/users` (Click "Users" in sidebar)

**Features to Test:**
- [ ] **Search Functionality**
  - Type in search box
  - Results filter in real-time
  - Search works for name, email
  
- [ ] **Role Filter**
  - Select role from dropdown (Admin, Candidate, Trainer, etc.)
  - Table filters by selected role
  - "All Roles" shows everyone
  
- [ ] **Status Filter**
  - Select status (Active, Inactive, Suspended)
  - Table updates accordingly
  
- [ ] **Pagination**
  - Change rows per page (5, 10, 25, 50)
  - Navigate between pages
  - Page count updates correctly
  
- [ ] **User Actions**
  - Click "View" icon (eye) - should navigate to user details
  - Click "Edit" icon (pencil) - should open edit form
  - Click "Delete" icon (trash) - should show confirmation dialog
  
- [ ] **Delete Confirmation**
  - Click delete on any user
  - Confirmation dialog appears
  - "Cancel" closes dialog
  - "Delete" removes user (simulated)
  
- [ ] **Status Badges**
  - Active users show green badge
  - Inactive users show gray badge
  - Suspended users show red badge

---

## 📚 Course Management

### 3. Courses Page
**Location**: `/admin/courses` (Click "Courses" in sidebar)

**Features to Test:**
- [ ] **Create Course Button**
  - Click "Create Course" button in top-right
  - Should navigate to course creation wizard
  
- [ ] **Search Courses**
  - Type in search box
  - Filters by course name, code
  
- [ ] **Status Filter**
  - Filter by ACTIVE, DRAFT, COMPLETED, CANCELLED
  - Table updates with filtered results
  
- [ ] **Course Table**
  - View course code, title, category
  - See duration, dates, capacity
  - Status badges color-coded
  
- [ ] **Course Actions**
  - View button works
  - Edit button navigates to edit form
  
- [ ] **Pagination**
  - Navigate through pages
  - Change page size

### 4. Course Creation Wizard
**Location**: `/admin/courses/new`

**Step 1: Basic Information**
- [ ] Fill in course title (required)
- [ ] Enter course code (auto-uppercase)
- [ ] Select category from dropdown
- [ ] Type course description (rich text area)
- [ ] Add learning objectives (type and press Enter)
- [ ] Add prerequisites (type and press Enter)
- [ ] Click "Next" - should validate and move to step 2
- [ ] Try clicking "Next" with empty fields - should show error

**Step 2: Schedule & Duration**
- [ ] Select start date from date picker
- [ ] Select end date from date picker
- [ ] Choose start time (optional)
- [ ] Choose end time (optional)
- [ ] Enter duration (number)
- [ ] Select duration unit (days/weeks/months)
- [ ] Choose schedule type (weekdays/weekends/daily/custom)
- [ ] If custom: click day chips to select
- [ ] Click "Next" to proceed
- [ ] Click "Back" to return to step 1

**Step 3: Capacity & Fees**
- [ ] Enter maximum capacity (required, must be > 0)
- [ ] Enter minimum capacity (optional)
- [ ] Enter course fee (required, can be 0)
- [ ] Select currency (USD/EUR/GBP/CAD)
- [ ] Choose registration deadline (optional)
- [ ] Toggle "Allow Waitlist" switch
- [ ] Click "Next"

**Step 4: Trainer Assignment**
- [ ] Select primary trainer from autocomplete
- [ ] Search trainers by typing
- [ ] See trainer details (email, expertise)
- [ ] Select secondary trainers (multiple)
- [ ] Primary trainer shouldn't appear in secondary list
- [ ] Click "Next"

**Step 5: Materials Upload**
- [ ] Click "Upload Syllabus" button
- [ ] Select PDF/DOC file
- [ ] See uploaded file name
- [ ] Click X to remove file
- [ ] Click "Upload Course Materials" button
- [ ] Select multiple files
- [ ] See file list with sizes
- [ ] Remove individual files
- [ ] Click "Create Course" button

**Additional Features:**
- [ ] **Auto-Save**
  - Wait 30 seconds
  - "Auto-saving..." chip should appear briefly
  - Check browser console for "Auto-saved" message
  
- [ ] **Preview Button**
  - Click "Preview" in header
  - Modal opens showing course details
  - All entered data displayed
  - Close button works
  
- [ ] **Clone Button**
  - Click "Clone Existing"
  - Dialog opens
  - Can close dialog
  
- [ ] **Save Draft**
  - Click "Save Draft" button
  - Data saved to localStorage
  - Refresh page - data should persist

---

## 🎓 Certificate Approvals

### 5. Certificate Approvals Page
**Location**: `/admin/certificates`

**Features to Test:**
- [ ] **Statistics Cards**
  - Pending count displayed
  - Approved count displayed
  - Rejected count displayed
  - Icons and colors correct
  
- [ ] **Approval Table**
  - Lists certificate requests
  - Shows candidate name, course, trainer
  - Displays score/grade
  - Shows request date
  
- [ ] **Approve Certificate**
  - Click "Approve" button on any request
  - Confirmation dialog appears
  - Click "Confirm" to approve
  - Success message appears
  - Statistics update
  - Request removed from table
  
- [ ] **Reject Certificate**
  - Click "Reject" button
  - Dialog opens with reason field
  - Enter rejection reason (optional)
  - Click "Reject" to confirm
  - Success message shown
  - Statistics update

---

## 🏢 Companies Management

### 6. Companies Page
**Location**: `/admin/companies`

**Features to Test:**
- [ ] **Add Company Button**
  - Click "Add Company" in top-right
  - Should navigate to create form
  
- [ ] **Search Companies**
  - Type company name in search
  - Results filter dynamically
  
- [ ] **Industry Filter**
  - Select industry from dropdown
  - Table filters by industry
  
- [ ] **Status Filter**
  - Filter by Active/Inactive/Pending
  - Table updates
  
- [ ] **Company Table**
  - View company name, industry
  - See contact person, email, phone
  - Location displayed
  - Status badges color-coded
  
- [ ] **Company Actions**
  - View button works
  - Edit button works
  - Delete button shows confirmation
  
- [ ] **Pagination**
  - Navigate pages
  - Change rows per page

---

## 📈 Reports Module

### 7. Reports Page
**Location**: `/admin/reports`

**Features to Test:**
- [ ] **Report Configuration**
  - Select start date
  - Select end date
  - Choose export format (PDF/Excel/CSV)
  
- [ ] **Report Cards** (6 types)
  - User Analytics Report card
  - Course Performance Report card
  - Enrollment Statistics card
  - Company Partnership Report card
  - Certificate Issuance Report card
  - Financial Overview card
  
- [ ] **Generate Report**
  - Click "Generate Report" on any card
  - Loading state shows
  - Success message appears after 2 seconds
  - Check console for download trigger
  
- [ ] **Recent Reports Section**
  - Shows "No recent reports" message
  - Ready for future enhancement

---

## ⚙️ Settings Module

### 8. Settings Page
**Location**: `/admin/settings`

**Tab 1: General Settings**
- [ ] Edit system name
- [ ] Change system email
- [ ] Select timezone
- [ ] Choose date format
- [ ] Select language
- [ ] Choose currency
- [ ] Click "Save Settings"
- [ ] Success message appears

**Tab 2: Notification Settings**
- [ ] Toggle email notifications
- [ ] Toggle SMS notifications
- [ ] Toggle push notifications
- [ ] Enable/disable enrollment alerts
- [ ] Enable/disable certificate alerts
- [ ] Enable/disable system alerts
- [ ] Toggle weekly reports
- [ ] Toggle monthly reports
- [ ] Save changes

**Tab 3: Security Settings**
- [ ] Change minimum password length
- [ ] Toggle uppercase requirement
- [ ] Toggle lowercase requirement
- [ ] Toggle numbers requirement
- [ ] Toggle special characters requirement
- [ ] Enable two-factor authentication
- [ ] Set session timeout
- [ ] Set max login attempts
- [ ] Save settings

**Tab 4: Email Settings**
- [ ] Enter SMTP host
- [ ] Enter SMTP port
- [ ] Enter SMTP username
- [ ] Enter SMTP password (with show/hide toggle)
- [ ] Toggle TLS/SSL
- [ ] Set from email
- [ ] Set from name
- [ ] Save settings

**Tab 5: Appearance Settings**
- [ ] Choose primary color (color picker)
- [ ] Choose secondary color (color picker)
- [ ] Toggle dark mode
- [ ] Toggle compact mode
- [ ] Toggle sidebar collapsed
- [ ] Save settings

**Common Features:**
- [ ] Switch between tabs
- [ ] "Reset to Defaults" button works
- [ ] Changes persist per tab
- [ ] Success/error messages display

---

## 🎯 Navigation & Layout

### 9. Sidebar Navigation
**Test All Menu Items:**
- [ ] Dashboard link works
- [ ] Users link works
- [ ] Courses link works
- [ ] Certificate Approvals link works
- [ ] Companies link works
- [ ] Reports link works
- [ ] Settings link works
- [ ] Active menu item highlighted
- [ ] Icons displayed correctly

### 10. Top Navigation Bar
- [ ] User profile avatar visible
- [ ] Notification bell icon present
- [ ] Click profile - dropdown menu appears
- [ ] Logout button works
- [ ] System name displayed

---

## 🔍 Additional Features to Test

### 11. Loading States
- [ ] KPI cards show skeleton loading
- [ ] Tables show loading spinner
- [ ] Forms show loading during submit
- [ ] Buttons show loading state

### 12. Error Handling
- [ ] Empty tables show appropriate message
- [ ] Failed API calls show error alerts
- [ ] Form validation errors display
- [ ] Network errors handled gracefully

### 13. Responsive Design
- [ ] Open on mobile device/resize window
- [ ] Cards stack vertically on small screens
- [ ] Tables scroll horizontally if needed
- [ ] Sidebar collapses on mobile
- [ ] All features accessible on mobile

### 14. Data Display
- [ ] Numbers formatted with commas (1,250)
- [ ] Currency formatted correctly ($524,000)
- [ ] Dates formatted properly
- [ ] Status badges color-coded
- [ ] Percentages show decimals

### 15. Interactions
- [ ] Hover effects work on cards
- [ ] Buttons have hover states
- [ ] Links change cursor to pointer
- [ ] Smooth transitions/animations
- [ ] No console errors during navigation

---

## 🐛 Known Limitations (Backend Not Connected)

These features will show simulated data or mock responses:

1. **User Management**
   - User list may be empty or show dummy data
   - Delete won't actually remove from database
   - Edit forms may not save

2. **Course Creation**
   - Form submits but doesn't create actual course
   - Redirects after simulated success
   - Trainer list shows hardcoded trainers

3. **Certificate Approvals**
   - May show empty state or mock data
   - Approve/Reject simulated only

4. **Companies**
   - List may be empty
   - CRUD operations simulated

5. **Reports**
   - Report generation simulated
   - No actual PDF/Excel download yet

6. **Settings**
   - Changes save to state only
   - No backend persistence

---

## ✅ Success Criteria

Your admin dashboard is working correctly if:

- ✅ All pages load without JavaScript errors
- ✅ Navigation works smoothly
- ✅ KPI cards display and are clickable
- ✅ Forms validate input correctly
- ✅ Course creation wizard completes all 5 steps
- ✅ Tables show data with pagination
- ✅ Search and filters work
- ✅ Buttons trigger appropriate actions
- ✅ Loading states display correctly
- ✅ Success/error messages appear
- ✅ Responsive design works on all screen sizes
- ✅ No console errors during normal usage

---

## 🚀 Quick Test Flow (5 Minutes)

1. **Login** → admin@labourmobility.com / admin123
2. **Dashboard** → Click each KPI card, verify navigation
3. **Users** → Search, filter, view pagination
4. **Courses** → Click "Create Course", fill step 1-2, click Next/Back
5. **Certificates** → View table, click Approve button
6. **Companies** → Search and filter
7. **Reports** → Generate a report
8. **Settings** → Switch tabs, toggle some options
9. **Logout** → Click profile → Logout

---

## 📞 Testing Support

If you encounter any issues:
1. Check browser console (F12) for errors
2. Verify both servers are running
3. Clear browser cache and localStorage
4. Try different browser (Chrome/Firefox)
5. Check network tab for failed API calls

---

**Ready to Test!** 🎉

Open your browser and start testing: http://localhost:5173

Login and explore all the features listed above!
