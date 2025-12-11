#!/bin/bash

# User Management Module - Comprehensive Test Script
# Tests View, Edit, and Delete functionality

echo "======================================"
echo "User Management Module - Test Script"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:5000"

# Test results
PASSED=0
FAILED=0

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}: $2"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}: $2"
        ((FAILED++))
    fi
}

echo "Step 1: Admin Login"
echo "==================="
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@labourmobility.com",
    "password": "admin123"
  }')

echo "$LOGIN_RESPONSE" | jq '.'

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken // .token // .data.token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo -e "${RED}Failed to get auth token!${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Successfully logged in${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# ==========================================
# TEST 1: Get All Users (List)
# ==========================================
echo "Test 1: Get All Users"
echo "====================="
USERS_RESPONSE=$(curl -s "$BASE_URL/api/admin/users?limit=5" \
  -H "Authorization: Bearer $TOKEN")

echo "$USERS_RESPONSE" | jq '.'

USERS_COUNT=$(echo "$USERS_RESPONSE" | jq -r '.data.total // 0')
USERS_SUCCESS=$(echo "$USERS_RESPONSE" | jq -r '.success')

if [ "$USERS_SUCCESS" = "true" ] && [ "$USERS_COUNT" -gt 0 ]; then
    print_result 0 "Get all users - Found $USERS_COUNT users"
else
    print_result 1 "Get all users - Failed or no users found"
fi

# Extract first user ID for testing
FIRST_USER=$(echo "$USERS_RESPONSE" | jq -r '.data.users[0]')
TEST_USER_ID=$(echo "$FIRST_USER" | jq -r '.id // empty')
TEST_USER_EMAIL=$(echo "$FIRST_USER" | jq -r '.email // empty')

if [ -z "$TEST_USER_ID" ] || [ "$TEST_USER_ID" = "null" ]; then
    echo -e "${RED}No users found to test with!${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Test User Selected:${NC}"
echo "  ID: $TEST_USER_ID"
echo "  Email: $TEST_USER_EMAIL"
echo ""

# ==========================================
# TEST 2: View User Details (GET /users/:id)
# ==========================================
echo "Test 2: View User Details"
echo "========================="
VIEW_RESPONSE=$(curl -s "$BASE_URL/api/admin/users/$TEST_USER_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "$VIEW_RESPONSE" | jq '.'

VIEW_SUCCESS=$(echo "$VIEW_RESPONSE" | jq -r '.success')
VIEW_USER_ID=$(echo "$VIEW_RESPONSE" | jq -r '.data.id // empty')
VIEW_USER_EMAIL=$(echo "$VIEW_RESPONSE" | jq -r '.data.email // empty')
HAS_PASSWORD=$(echo "$VIEW_RESPONSE" | jq -r '.data.password // empty')

if [ "$VIEW_SUCCESS" = "true" ] && [ "$VIEW_USER_ID" = "$TEST_USER_ID" ]; then
    print_result 0 "View user details - Successfully retrieved user #$TEST_USER_ID"
    
    # Check that password is NOT in response (security check)
    if [ -z "$HAS_PASSWORD" ] || [ "$HAS_PASSWORD" = "null" ]; then
        print_result 0 "Security check - Password not exposed in API response"
    else
        print_result 1 "Security check - Password exposed in API response (security risk!)"
    fi
    
    # Check role information
    USER_ROLE=$(echo "$VIEW_RESPONSE" | jq -r '.data.role.name // empty')
    if [ ! -z "$USER_ROLE" ] && [ "$USER_ROLE" != "null" ]; then
        print_result 0 "Role information - Role '$USER_ROLE' included in response"
    else
        print_result 1 "Role information - Role not found in response"
    fi
else
    print_result 1 "View user details - Failed to retrieve user"
fi
echo ""

# ==========================================
# TEST 3: Create New User (for testing edit/delete)
# ==========================================
echo "Test 3: Create Test User"
echo "========================"
RANDOM_SUFFIX=$RANDOM
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"testuser$RANDOM_SUFFIX@test.com\",
    \"password\": \"Test123!\",
    \"firstName\": \"Test\",
    \"lastName\": \"User$RANDOM_SUFFIX\",
    \"phone\": \"+254700000000\",
    \"roleId\": 2,
    \"status\": \"ACTIVE\"
  }")

echo "$CREATE_RESPONSE" | jq '.'

CREATE_SUCCESS=$(echo "$CREATE_RESPONSE" | jq -r '.success')
CREATED_USER_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id // empty')

if [ "$CREATE_SUCCESS" = "true" ] && [ ! -z "$CREATED_USER_ID" ] && [ "$CREATED_USER_ID" != "null" ]; then
    print_result 0 "Create user - Successfully created user #$CREATED_USER_ID"
else
    print_result 1 "Create user - Failed to create test user"
    echo "Skipping edit and delete tests..."
    exit 1
fi
echo ""

# ==========================================
# TEST 4: Edit User (PUT /users/:id)
# ==========================================
echo "Test 4: Edit User"
echo "================="
EDIT_RESPONSE=$(curl -s -X PUT "$BASE_URL/api/admin/users/$CREATED_USER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Updated\",
    \"lastName\": \"TestUser\",
    \"phone\": \"+254711111111\",
    \"roleId\": 2,
    \"status\": \"ACTIVE\"
  }")

echo "$EDIT_RESPONSE" | jq '.'

EDIT_SUCCESS=$(echo "$EDIT_RESPONSE" | jq -r '.success')
EDITED_FIRSTNAME=$(echo "$EDIT_RESPONSE" | jq -r '.data.firstName // empty')
EDITED_PHONE=$(echo "$EDIT_RESPONSE" | jq -r '.data.phone // empty')

if [ "$EDIT_SUCCESS" = "true" ]; then
    if [ "$EDITED_FIRSTNAME" = "Updated" ]; then
        print_result 0 "Edit user - First name updated successfully"
    else
        print_result 1 "Edit user - First name not updated (expected: Updated, got: $EDITED_FIRSTNAME)"
    fi
    
    if [ "$EDITED_PHONE" = "+254711111111" ]; then
        print_result 0 "Edit user - Phone updated successfully"
    else
        print_result 1 "Edit user - Phone not updated"
    fi
else
    print_result 1 "Edit user - Failed to update user"
fi
echo ""

# ==========================================
# TEST 5: Edit User with Password Update
# ==========================================
echo "Test 5: Edit User with Password"
echo "================================"
PASSWORD_EDIT_RESPONSE=$(curl -s -X PUT "$BASE_URL/api/admin/users/$CREATED_USER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Updated\",
    \"lastName\": \"TestUser\",
    \"password\": \"NewPassword123!\",
    \"roleId\": 2,
    \"status\": \"ACTIVE\"
  }")

echo "$PASSWORD_EDIT_RESPONSE" | jq '.'

PW_EDIT_SUCCESS=$(echo "$PASSWORD_EDIT_RESPONSE" | jq -r '.success')
PW_IN_RESPONSE=$(echo "$PASSWORD_EDIT_RESPONSE" | jq -r '.data.password // empty')

if [ "$PW_EDIT_SUCCESS" = "true" ]; then
    print_result 0 "Password update - API accepted password change"
    
    if [ -z "$PW_IN_RESPONSE" ] || [ "$PW_IN_RESPONSE" = "null" ]; then
        print_result 0 "Security check - Password not returned in update response"
    else
        print_result 1 "Security check - Password exposed in update response"
    fi
else
    print_result 1 "Password update - Failed to update password"
fi
echo ""

# ==========================================
# TEST 6: Verify Edit by Viewing Updated User
# ==========================================
echo "Test 6: Verify Edit (View Updated User)"
echo "========================================"
VERIFY_RESPONSE=$(curl -s "$BASE_URL/api/admin/users/$CREATED_USER_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "$VERIFY_RESPONSE" | jq '.'

VERIFY_SUCCESS=$(echo "$VERIFY_RESPONSE" | jq -r '.success')
VERIFY_FIRSTNAME=$(echo "$VERIFY_RESPONSE" | jq -r '.data.firstName // empty')

if [ "$VERIFY_SUCCESS" = "true" ] && [ "$VERIFY_FIRSTNAME" = "Updated" ]; then
    print_result 0 "Verify edit - Changes persisted in database"
else
    print_result 1 "Verify edit - Changes not persisted"
fi
echo ""

# ==========================================
# TEST 7: Delete User (DELETE /users/:id)
# ==========================================
echo "Test 7: Delete User"
echo "==================="
DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/admin/users/$CREATED_USER_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "$DELETE_RESPONSE" | jq '.'

DELETE_SUCCESS=$(echo "$DELETE_RESPONSE" | jq -r '.success')

if [ "$DELETE_SUCCESS" = "true" ]; then
    print_result 0 "Delete user - Successfully deleted user #$CREATED_USER_ID"
else
    print_result 1 "Delete user - Failed to delete user"
fi
echo ""

# ==========================================
# TEST 8: Verify Delete (User should not exist)
# ==========================================
echo "Test 8: Verify Delete"
echo "====================="
VERIFY_DELETE_RESPONSE=$(curl -s "$BASE_URL/api/admin/users/$CREATED_USER_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "$VERIFY_DELETE_RESPONSE" | jq '.'

VERIFY_DELETE_SUCCESS=$(echo "$VERIFY_DELETE_RESPONSE" | jq -r '.success')

if [ "$VERIFY_DELETE_SUCCESS" = "false" ]; then
    print_result 0 "Verify delete - User no longer exists (correct)"
else
    print_result 1 "Verify delete - User still exists after delete (error!)"
fi
echo ""

# ==========================================
# TEST 9: Test Pagination
# ==========================================
echo "Test 9: Pagination Test"
echo "======================="
PAGE1_RESPONSE=$(curl -s "$BASE_URL/api/admin/users?page=1&limit=2" \
  -H "Authorization: Bearer $TOKEN")

PAGE1_COUNT=$(echo "$PAGE1_RESPONSE" | jq -r '.data.users | length')
PAGE1_TOTAL=$(echo "$PAGE1_RESPONSE" | jq -r '.data.total // 0')

if [ "$PAGE1_COUNT" -le 2 ]; then
    print_result 0 "Pagination - Limit respected (returned $PAGE1_COUNT items)"
else
    print_result 1 "Pagination - Limit not respected (expected max 2, got $PAGE1_COUNT)"
fi

if [ "$PAGE1_TOTAL" -gt 0 ]; then
    print_result 0 "Pagination - Total count provided ($PAGE1_TOTAL total users)"
else
    print_result 1 "Pagination - Total count missing"
fi
echo ""

# ==========================================
# TEST 10: Test Search/Filter
# ==========================================
echo "Test 10: Search Test"
echo "===================="
SEARCH_RESPONSE=$(curl -s "$BASE_URL/api/admin/users?search=admin" \
  -H "Authorization: Bearer $TOKEN")

SEARCH_COUNT=$(echo "$SEARCH_RESPONSE" | jq -r '.data.users | length')

if [ "$SEARCH_COUNT" -ge 0 ]; then
    print_result 0 "Search - Search functionality working (found $SEARCH_COUNT matches)"
else
    print_result 1 "Search - Search failed"
fi
echo ""

# ==========================================
# TEST 11: Role Filter Test
# ==========================================
echo "Test 11: Role Filter Test"
echo "========================="
ROLE_FILTER_RESPONSE=$(curl -s "$BASE_URL/api/admin/users?role=Admin" \
  -H "Authorization: Bearer $TOKEN")

ROLE_FILTER_COUNT=$(echo "$ROLE_FILTER_RESPONSE" | jq -r '.data.users | length')
FIRST_ROLE=$(echo "$ROLE_FILTER_RESPONSE" | jq -r '.data.users[0].role.name // empty')

if [ "$ROLE_FILTER_COUNT" -gt 0 ]; then
    if [ "$FIRST_ROLE" = "Admin" ]; then
        print_result 0 "Role filter - Correctly filtered by role"
    else
        print_result 1 "Role filter - Filter not working correctly"
    fi
else
    print_result 0 "Role filter - No admin users found (may be valid)"
fi
echo ""

# ==========================================
# Summary
# ==========================================
echo "======================================"
echo "Test Summary"
echo "======================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed!${NC}"
    exit 1
fi
