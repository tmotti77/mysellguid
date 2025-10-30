#!/bin/bash

# MySellGuid API Testing Script
# This script tests all main API endpoints with the seeded data

BASE_URL="http://localhost:3000/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "MySellGuid API Testing Script"
echo "========================================"
echo ""

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}: $2"
    else
        echo -e "${RED}✗ FAILED${NC}: $2"
    fi
}

# Function to check if backend is running
check_backend() {
    echo "Checking if backend is running..."
    curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/../" > /tmp/status_code.txt
    STATUS=$(cat /tmp/status_code.txt)
    if [ "$STATUS" = "000" ]; then
        echo -e "${RED}✗ Backend is not running${NC}"
        echo "Start the backend with: cd backend && npm run start:dev"
        exit 1
    fi
    print_result 0 "Backend is running"
    echo ""
}

# Test 1: Database Seed
test_seed() {
    echo "Test 1: Database Seed"
    echo "----------------------"
    RESPONSE=$(curl -s -X POST "$BASE_URL/seed")
    USERS=$(echo $RESPONSE | grep -o '"users":[0-9]*' | cut -d':' -f2)
    STORES=$(echo $RESPONSE | grep -o '"stores":[0-9]*' | cut -d':' -f2)
    SALES=$(echo $RESPONSE | grep -o '"sales":[0-9]*' | cut -d':' -f2)

    if [ "$USERS" = "2" ] && [ "$STORES" = "5" ] && [ "$SALES" = "10" ]; then
        print_result 0 "Database seeded: $USERS users, $STORES stores, $SALES sales"
    else
        print_result 1 "Database seed failed"
    fi
    echo ""
}

# Test 2: User Authentication
test_auth() {
    echo "Test 2: User Authentication"
    echo "---------------------------"

    # Login
    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email": "test@mysellguid.com", "password": "password123"}')

    ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

    if [ ! -z "$ACCESS_TOKEN" ]; then
        print_result 0 "User login successful"
        echo $ACCESS_TOKEN > /tmp/mysellguid_token.txt

        # Test protected endpoint
        ME_RESPONSE=$(curl -s "$BASE_URL/users/me" -H "Authorization: Bearer $ACCESS_TOKEN")
        EMAIL=$(echo $ME_RESPONSE | grep -o '"email":"[^"]*"' | cut -d'"' -f4)

        if [ "$EMAIL" = "test@mysellguid.com" ]; then
            print_result 0 "Protected endpoint /users/me working"
        else
            print_result 1 "Protected endpoint failed"
        fi
    else
        print_result 1 "User login failed"
    fi
    echo ""
}

# Test 3: Geospatial Queries - Nearby Sales
test_nearby_sales() {
    echo "Test 3: Geospatial Queries - Nearby Sales"
    echo "------------------------------------------"

    # Tel Aviv center coordinates
    LAT=32.0853
    LNG=34.7818
    RADIUS=5000

    RESPONSE=$(curl -s "$BASE_URL/sales/nearby?lat=$LAT&lng=$LNG&radius=$RADIUS")
    COUNT=$(echo $RESPONSE | grep -o '"id"' | wc -l)

    if [ $COUNT -ge 5 ]; then
        print_result 0 "Nearby sales query returned $COUNT sales within ${RADIUS}m"

        # Check if distance is calculated
        DISTANCE=$(echo $RESPONSE | grep -o '"distance":[0-9.]*' | head -1 | cut -d':' -f2)
        if [ ! -z "$DISTANCE" ]; then
            print_result 0 "Distance calculation working (first result: ${DISTANCE}m)"
        else
            print_result 1 "Distance calculation failed"
        fi
    else
        print_result 1 "Nearby sales query failed (expected 10, got $COUNT)"
    fi
    echo ""
}

# Test 4: Geospatial Queries - Nearby Stores
test_nearby_stores() {
    echo "Test 4: Geospatial Queries - Nearby Stores"
    echo "-------------------------------------------"

    # Tel Aviv center coordinates
    LAT=32.0853
    LNG=34.7818
    RADIUS=5000

    RESPONSE=$(curl -s "$BASE_URL/stores/nearby?lat=$LAT&lng=$LNG&radius=$RADIUS")
    COUNT=$(echo $RESPONSE | grep -o '"id"' | wc -l)

    if [ $COUNT -eq 5 ]; then
        print_result 0 "Nearby stores query returned $COUNT stores within ${RADIUS}m"

        # Check store categories
        FASHION=$(echo $RESPONSE | grep -o '"category":"fashion"' | wc -l)
        ELECTRONICS=$(echo $RESPONSE | grep -o '"category":"electronics"' | wc -l)

        print_result 0 "Store categories: fashion($FASHION), electronics($ELECTRONICS), etc."
    else
        print_result 1 "Nearby stores query failed (expected 5, got $COUNT)"
    fi
    echo ""
}

# Test 5: Sales Search
test_sales_search() {
    echo "Test 5: Sales Search"
    echo "--------------------"

    # Search for "smartphone"
    RESPONSE=$(curl -s "$BASE_URL/sales/search?query=smartphone")
    COUNT=$(echo $RESPONSE | grep -o '"id"' | wc -l)

    if [ $COUNT -ge 1 ]; then
        print_result 0 "Sales search found $COUNT result(s) for 'smartphone'"
    else
        print_result 1 "Sales search failed"
    fi
    echo ""
}

# Test 6: Store Information
test_store_info() {
    echo "Test 6: Store Information"
    echo "-------------------------"

    # Get all stores and extract first store ID
    STORES_RESPONSE=$(curl -s "$BASE_URL/stores")
    STORE_ID=$(echo $STORES_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

    if [ ! -z "$STORE_ID" ]; then
        # Get specific store details
        STORE_RESPONSE=$(curl -s "$BASE_URL/stores/$STORE_ID")
        STORE_NAME=$(echo $STORE_RESPONSE | grep -o '"name":"[^"]*"' | cut -d'"' -f4)

        if [ ! -z "$STORE_NAME" ]; then
            print_result 0 "Store details retrieved: $STORE_NAME"
        else
            print_result 1 "Failed to get store details"
        fi
    else
        print_result 1 "Failed to get store list"
    fi
    echo ""
}

# Test 7: Sales by Store
test_sales_by_store() {
    echo "Test 7: Sales by Store"
    echo "----------------------"

    # Get all stores and extract first store ID
    STORES_RESPONSE=$(curl -s "$BASE_URL/stores")
    STORE_ID=$(echo $STORES_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

    if [ ! -z "$STORE_ID" ]; then
        # Get sales for this store
        SALES_RESPONSE=$(curl -s "$BASE_URL/sales/store/$STORE_ID")
        COUNT=$(echo $SALES_RESPONSE | grep -o '"id"' | wc -l)

        if [ $COUNT -ge 1 ]; then
            print_result 0 "Sales by store query returned $COUNT sale(s)"
        else
            print_result 1 "No sales found for store"
        fi
    else
        print_result 1 "Failed to get store ID"
    fi
    echo ""
}

# Run all tests
check_backend
test_seed
test_auth
test_nearby_sales
test_nearby_stores
test_sales_search
test_store_info
test_sales_by_store

echo "========================================"
echo "Testing Complete!"
echo "========================================"
echo ""
echo "To run individual tests, you can use:"
echo "  curl -X POST $BASE_URL/seed"
echo "  curl \"$BASE_URL/sales/nearby?lat=32.0853&lng=34.7818&radius=5000\""
echo "  curl \"$BASE_URL/stores/nearby?lat=32.0853&lng=34.7818&radius=5000\""
echo ""
