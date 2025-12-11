#!/bin/bash

# Setup Attendance Appeal Test Data
API_URL="http://localhost:5000/api"
ADMIN_EMAIL="admin@labourmobility.com"
ADMIN_PASSWORD="admin123"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "======================================"
echo "Setting Up Attendance Appeal Test"
echo "======================================"
echo ""

# Step 1: Admin Login
echo "Step 1: Admin Login"
echo "==================="
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

ADMIN_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken')

if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" == "null" ]; then
  echo "Failed to login as admin"
  exit 1
fi

echo -e "${GREEN}✓ Admin logged in${NC}"
echo ""

# Step 2: Get a candidate with enrollment
echo "Step 2: Get Candidate with Enrollment"
echo "======================================"
CANDIDATES=$(curl -s -X GET "$API_URL/admin/candidates?limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

# Find candidate with enrollments
CANDIDATE_ID=$(echo "$CANDIDATES" | jq -r '.data.candidates[] | select(.enrollments | length > 0) | .id' | head -1)
USER_ID=$(echo "$CANDIDATES" | jq -r ".data.candidates[] | select(.id == $CANDIDATE_ID) | .userId")
ENROLLMENT=$(echo "$CANDIDATES" | jq -r ".data.candidates[] | select(.id == $CANDIDATE_ID) | .enrollments[0]")
COURSE_ID=$(echo "$ENROLLMENT" | jq -r '.courseId')
CANDIDATE_NAME=$(echo "$CANDIDATES" | jq -r ".data.candidates[] | select(.id == $CANDIDATE_ID) | .fullName")

echo "Selected Candidate: $CANDIDATE_NAME (ID: $CANDIDATE_ID, User ID: $USER_ID)"
echo "Course ID: $COURSE_ID"
echo ""

# Step 3: Mark candidate as ABSENT
echo "Step 3: Mark Attendance as ABSENT"
echo "=================================="
TODAY=$(date +%Y-%m-%d)

ATTENDANCE_PAYLOAD=$(cat <<EOF
{
  "courseId": $COURSE_ID,
  "date": "$TODAY",
  "records": [{
    "studentId": $USER_ID,
    "status": "ABSENT",
    "remarks": "Test absence for appeal demonstration"
  }]
}
EOF
)

SAVE_RESPONSE=$(curl -s -X POST "$API_URL/admin/attendance" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$ATTENDANCE_PAYLOAD")

echo "$SAVE_RESPONSE" | jq '.'

SAVE_SUCCESS=$(echo "$SAVE_RESPONSE" | jq -r '.success')

if [ "$SAVE_SUCCESS" == "true" ]; then
  echo -e "${GREEN}✓ Attendance marked as ABSENT${NC}"
else
  echo "Failed to mark attendance"
  exit 1
fi
echo ""

# Step 4: Get the attendance record ID
echo "Step 4: Get Attendance Record ID"
echo "================================="
sleep 1
ATTENDANCE_RECORDS=$(curl -s -X GET "$API_URL/admin/attendance?courseId=$COURSE_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "$ATTENDANCE_RECORDS" | jq '.'

ATTENDANCE_ID=$(echo "$ATTENDANCE_RECORDS" | jq -r ".data.data[] | select(.date == \"${TODAY}T00:00:00.000Z\" or .date == \"$TODAY\") | .id" | head -1)

echo "Attendance Record ID: $ATTENDANCE_ID"
echo ""

# Step 5: Login as candidate and submit appeal
echo "Step 5: Get Candidate Login Credentials"
echo "========================================"

# Get candidate's user email
CANDIDATE_EMAIL=$(echo "$CANDIDATES" | jq -r ".data.candidates[] | select(.id == $CANDIDATE_ID) | .user.email")

echo "Candidate Email: $CANDIDATE_EMAIL"
echo ""
echo -e "${YELLOW}NOTE: To submit an appeal, the candidate needs to:${NC}"
echo "1. Login with their credentials"
echo "2. Navigate to Attendance page"
echo "3. Click 'Appeal' on the ABSENT record"
echo "4. Provide reason and supporting documents"
echo ""
echo -e "${GREEN}Test Setup Complete!${NC}"
echo ""
echo "======================================"
echo "Summary"
echo "======================================"
echo "Candidate: $CANDIDATE_NAME"
echo "Email: $CANDIDATE_EMAIL"
echo "Course ID: $COURSE_ID"
echo "Attendance ID: $ATTENDANCE_ID"
echo "Status: ABSENT"
echo "Date: $TODAY"
echo ""
echo "Next Steps:"
echo "1. Admin can view this attendance in Attendance Management"
echo "2. Candidate can submit an appeal (if they login)"
echo "3. Admin can review appeals in Appeals Management"
echo ""
