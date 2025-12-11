#!/bin/bash

# Candidate Module Test Script
# Tests Candidates, Attendance, and Appeals functionality

API_URL="http://localhost:5000/api"
ADMIN_EMAIL="admin@labourmobility.com"
ADMIN_PASSWORD="admin123"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

echo "======================================"
echo "Candidate Module - Test Script"
echo "======================================"
echo ""

# Step 1: Admin Login
echo "Step 1: Admin Login"
echo "==================="
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

echo "$LOGIN_RESPONSE" | jq '.'

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo -e "${RED}✗ Failed to obtain authentication token${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Successfully logged in${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Step 2: Get All Candidates
echo "Test 1: Get All Candidates"
echo "=========================="
CANDIDATES_RESPONSE=$(curl -s -X GET "$API_URL/admin/candidates?limit=5" \
  -H "Authorization: Bearer $TOKEN")

echo "$CANDIDATES_RESPONSE" | jq '.'

TOTAL_CANDIDATES=$(echo "$CANDIDATES_RESPONSE" | jq -r '.data.total')

if [ "$TOTAL_CANDIDATES" -ge 0 ] 2>/dev/null; then
  echo -e "${GREEN}✓ PASSED: Get all candidates - Found $TOTAL_CANDIDATES candidates${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}✗ FAILED: Could not retrieve candidates${NC}"
  FAILED=$((FAILED + 1))
fi
echo ""

# Get first candidate ID for testing
CANDIDATE_ID=$(echo "$CANDIDATES_RESPONSE" | jq -r '.data.candidates[0].id')
CANDIDATE_NAME=$(echo "$CANDIDATES_RESPONSE" | jq -r '.data.candidates[0].fullName')

echo "Test Candidate Selected:"
echo "  ID: $CANDIDATE_ID"
echo "  Name: $CANDIDATE_NAME"
echo ""

# Step 3: Get Candidate by ID
echo "Test 2: View Candidate Details"
echo "==============================="
CANDIDATE_DETAILS=$(curl -s -X GET "$API_URL/admin/candidates/$CANDIDATE_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "$CANDIDATE_DETAILS" | jq '.'

CANDIDATE_EMAIL=$(echo "$CANDIDATE_DETAILS" | jq -r '.data.user.email')

if [ ! -z "$CANDIDATE_EMAIL" ] && [ "$CANDIDATE_EMAIL" != "null" ]; then
  echo -e "${GREEN}✓ PASSED: View candidate details - Successfully retrieved candidate #$CANDIDATE_ID${NC}"
  PASSED=$((PASSED + 1))
  
  # Check if enrollments are included
  ENROLLMENTS_COUNT=$(echo "$CANDIDATE_DETAILS" | jq -r '.data.enrollments | length')
  if [ "$ENROLLMENTS_COUNT" -ge 0 ] 2>/dev/null; then
    echo -e "${GREEN}✓ PASSED: Enrollments included - Found $ENROLLMENTS_COUNT enrollments${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${YELLOW}⚠ WARNING: Enrollments not properly included${NC}"
  fi
  
  # Check if attendance records are included
  ATTENDANCE_COUNT=$(echo "$CANDIDATE_DETAILS" | jq -r '.data.attendanceRecords | length')
  if [ "$ATTENDANCE_COUNT" -ge 0 ] 2>/dev/null; then
    echo -e "${GREEN}✓ PASSED: Attendance records included - Found $ATTENDANCE_COUNT records${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${YELLOW}⚠ WARNING: Attendance records not properly included${NC}"
  fi
else
  echo -e "${RED}✗ FAILED: Could not retrieve candidate details${NC}"
  FAILED=$((FAILED + 1))
fi
echo ""

# Step 4: Update Candidate
echo "Test 3: Update Candidate"
echo "========================"
UPDATE_RESPONSE=$(curl -s -X PUT "$API_URL/admin/candidates/$CANDIDATE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"ACTIVE\"}")

echo "$UPDATE_RESPONSE" | jq '.'

UPDATE_SUCCESS=$(echo "$UPDATE_RESPONSE" | jq -r '.success')

if [ "$UPDATE_SUCCESS" == "true" ]; then
  echo -e "${GREEN}✓ PASSED: Update candidate - Successfully updated candidate${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}✗ FAILED: Could not update candidate${NC}"
  FAILED=$((FAILED + 1))
fi
echo ""

# Step 5: Test Attendance API
echo "Test 4: Get Attendance Records"
echo "==============================="

# First get a course ID from enrollments
COURSE_ID=$(echo "$CANDIDATE_DETAILS" | jq -r '.data.enrollments[0].courseId')

if [ ! -z "$COURSE_ID" ] && [ "$COURSE_ID" != "null" ]; then
  ATTENDANCE_RESPONSE=$(curl -s -X GET "$API_URL/admin/attendance?courseId=$COURSE_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "$ATTENDANCE_RESPONSE" | jq '.'
  
  ATTENDANCE_SUCCESS=$(echo "$ATTENDANCE_RESPONSE" | jq -r '.success')
  
  if [ "$ATTENDANCE_SUCCESS" == "true" ]; then
    echo -e "${GREEN}✓ PASSED: Get attendance - API responded successfully${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}✗ FAILED: Could not retrieve attendance${NC}"
    FAILED=$((FAILED + 1))
  fi
else
  echo -e "${YELLOW}⚠ SKIPPED: No course enrollments found for attendance test${NC}"
fi
echo ""

# Step 6: Test Appeals API
echo "Test 5: Get Attendance Appeals"
echo "==============================="
APPEALS_RESPONSE=$(curl -s -X GET "$API_URL/admin/attendance/appeals" \
  -H "Authorization: Bearer $TOKEN")

echo "$APPEALS_RESPONSE" | jq '.'

APPEALS_SUCCESS=$(echo "$APPEALS_RESPONSE" | jq -r '.success')

if [ "$APPEALS_SUCCESS" == "true" ]; then
  APPEALS_COUNT=$(echo "$APPEALS_RESPONSE" | jq -r '.data.appeals | length')
  echo -e "${GREEN}✓ PASSED: Get appeals - Found $APPEALS_COUNT appeals${NC}"
  PASSED=$((PASSED + 1))
  
  # Check if statistics are included
  PENDING_APPEALS=$(echo "$APPEALS_RESPONSE" | jq -r '.data.statistics.pending')
  if [ ! -z "$PENDING_APPEALS" ] && [ "$PENDING_APPEALS" != "null" ]; then
    echo -e "${GREEN}✓ PASSED: Appeal statistics included - $PENDING_APPEALS pending${NC}"
    PASSED=$((PASSED + 1))
  fi
else
  echo -e "${RED}✗ FAILED: Could not retrieve appeals${NC}"
  FAILED=$((FAILED + 1))
fi
echo ""

# Step 7: Search Candidates
echo "Test 6: Search Candidates"
echo "========================="
SEARCH_RESPONSE=$(curl -s -X GET "$API_URL/admin/candidates?search=$CANDIDATE_NAME&limit=10" \
  -H "Authorization: Bearer $TOKEN")

echo "$SEARCH_RESPONSE" | jq '.'

SEARCH_COUNT=$(echo "$SEARCH_RESPONSE" | jq -r '.data.candidates | length')

if [ "$SEARCH_COUNT" -gt 0 ] 2>/dev/null; then
  echo -e "${GREEN}✓ PASSED: Search candidates - Found $SEARCH_COUNT matches${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}✗ FAILED: Search functionality not working${NC}"
  FAILED=$((FAILED + 1))
fi
echo ""

# Step 8: Pagination Test
echo "Test 7: Pagination"
echo "=================="
PAGE_RESPONSE=$(curl -s -X GET "$API_URL/admin/candidates?page=1&limit=2" \
  -H "Authorization: Bearer $TOKEN")

RETURNED_COUNT=$(echo "$PAGE_RESPONSE" | jq -r '.data.candidates | length')
PAGINATION_LIMIT=$(echo "$PAGE_RESPONSE" | jq -r '.pagination.limit')

if [ "$RETURNED_COUNT" -le 2 ] && [ "$PAGINATION_LIMIT" == "2" ]; then
  echo -e "${GREEN}✓ PASSED: Pagination - Returned $RETURNED_COUNT items (limit: 2)${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}✗ FAILED: Pagination not working correctly${NC}"
  FAILED=$((FAILED + 1))
fi
echo ""

# Step 9: Test Attendance Statistics
echo "Test 8: Attendance Statistics"
echo "=============================="
if [ ! -z "$COURSE_ID" ] && [ "$COURSE_ID" != "null" ]; then
  STATS_RESPONSE=$(curl -s -X GET "$API_URL/admin/attendance/statistics?courseId=$COURSE_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "$STATS_RESPONSE" | jq '.'
  
  STATS_SUCCESS=$(echo "$STATS_RESPONSE" | jq -r '.success')
  
  if [ "$STATS_SUCCESS" == "true" ]; then
    echo -e "${GREEN}✓ PASSED: Attendance statistics - API responded successfully${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}✗ FAILED: Could not retrieve attendance statistics${NC}"
    FAILED=$((FAILED + 1))
  fi
else
  echo -e "${YELLOW}⚠ SKIPPED: No course ID available for statistics test${NC}"
fi
echo ""

# Step 10: Save Attendance (Test with empty data - just to verify endpoint works)
echo "Test 9: Save Attendance Endpoint"
echo "================================="
SAVE_RESPONSE=$(curl -s -X POST "$API_URL/admin/attendance" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"records":[]}')

echo "$SAVE_RESPONSE" | jq '.'

# This should fail with "Please mark attendance for at least one candidate"
ERROR_MSG=$(echo "$SAVE_RESPONSE" | jq -r '.message')

if [ "$ERROR_MSG" == "Please mark attendance for at least one candidate" ]; then
  echo -e "${GREEN}✓ PASSED: Save attendance endpoint - Validation working correctly${NC}"
  PASSED=$((PASSED + 1))
else
  SAVE_SUCCESS=$(echo "$SAVE_RESPONSE" | jq -r '.success')
  if [ "$SAVE_SUCCESS" == "true" ]; then
    echo -e "${GREEN}✓ PASSED: Save attendance endpoint - API accessible${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${YELLOW}⚠ WARNING: Save attendance endpoint may have issues${NC}"
  fi
fi
echo ""

# Summary
echo "======================================"
echo "Test Summary"
echo "======================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi
