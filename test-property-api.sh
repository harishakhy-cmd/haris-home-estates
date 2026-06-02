#!/bin/bash

# HARIS Property API Test Script
# Tests if the property creation API is working correctly

echo "======================================"
echo "HARIS Property API Health Check"
echo "======================================"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if backend is running
echo -e "${YELLOW}[1/5] Checking if backend is running on port 3001...${NC}"
if nc -z localhost 3001 2>/dev/null; then
  echo -e "${GREEN}✓ Backend is running${NC}"
else
  echo -e "${RED}✗ Backend is not running on port 3001${NC}"
  echo "Start backend with: npm run start:dev or docker-compose up"
  exit 1
fi
echo

# Test 2: Check Swagger UI
echo -e "${YELLOW}[2/5] Checking Swagger UI...${NC}"
RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3001/api/swagger)
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "301" ]; then
  echo -e "${GREEN}✓ Swagger UI accessible${NC}"
else
  echo -e "${RED}✗ Swagger UI returned status: $RESPONSE${NC}"
fi
echo

# Test 3: Check API health - List properties (no auth required)
echo -e "${YELLOW}[3/5] Testing GET /api/v1/properties...${NC}"
RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/properties-response.json http://localhost:3001/api/v1/properties)
if [ "$RESPONSE" = "200" ]; then
  echo -e "${GREEN}✓ Properties endpoint working${NC}"
  COUNT=$(jq '.data | length' /tmp/properties-response.json 2>/dev/null || echo "?")
  echo "  Found $COUNT properties"
else
  echo -e "${RED}✗ Properties endpoint returned status: $RESPONSE${NC}"
  cat /tmp/properties-response.json
fi
echo

# Test 4: Check if database is connected
echo -e "${YELLOW}[4/5] Checking database connection...${NC}"
RESPONSE=$(curl -s http://localhost:3001/api/v1/properties)
if echo "$RESPONSE" | grep -q "error\|Error"; then
  echo -e "${RED}✗ Database error detected:${NC}"
  echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
else
  echo -e "${GREEN}✓ Database appears to be connected${NC}"
fi
echo

# Test 5: Check if Docker services are running (if Docker is available)
if command -v docker &> /dev/null; then
  echo -e "${YELLOW}[5/5] Checking Docker services...${NC}"
  if docker-compose ps 2>/dev/null | grep -q "haris-backend"; then
    STATUS=$(docker-compose ps 2>/dev/null | grep "haris-backend" | awk '{print $5}')
    echo "  Backend status: $STATUS"
  fi
  if docker-compose ps 2>/dev/null | grep -q "haris-postgres"; then
    HEALTH=$(docker-compose ps 2>/dev/null | grep "haris-postgres" | awk '{print $6}')
    echo "  Database status: $HEALTH"
    if [[ "$HEALTH" == "Up"* ]]; then
      echo -e "${GREEN}✓ Docker services appear healthy${NC}"
    else
      echo -e "${YELLOW}⚠ Database may not be fully healthy${NC}"
    fi
  fi
else
  echo -e "${YELLOW}[5/5] Docker not available (skipping)${NC}"
fi
echo

echo "======================================"
echo "API Test Summary"
echo "======================================"
echo -e "${GREEN}If all tests passed, you can now:${NC}"
echo "1. Go to http://localhost:3000/dashboard/landlord"
echo "2. Click 'Create listing'"
echo "3. Fill in property details"
echo "4. Click 'Save listing'"
echo
echo -e "${YELLOW}API Documentation:${NC}"
echo "- Swagger UI: http://localhost:3001/api/swagger"
echo "- Base URL: http://localhost:3001/api/v1"
echo
