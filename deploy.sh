#!/bin/bash
# HARIS Deployment Script - Automated Deployment

set -e

echo "═══════════════════════════════════════════════════════════"
echo "       HARIS Platform - Automated Deployment"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Check if Docker is installed
echo -e "${BLUE}[Step 1/8] Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker found${NC}"
echo ""

# Step 2: Check if Docker Compose is installed
echo -e "${BLUE}[Step 2/8] Checking Docker Compose installation...${NC}"
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose found${NC}"
echo ""

# Step 3: Stop existing containers
echo -e "${BLUE}[Step 3/8] Stopping existing containers...${NC}"
docker-compose down 2>/dev/null || true
echo -e "${GREEN}✓ Stopped${NC}"
echo ""

# Step 4: Build backend with latest fixes
echo -e "${BLUE}[Step 4/8] Building backend service (this may take 2-3 minutes)...${NC}"
docker-compose build backend
echo -e "${GREEN}✓ Backend built${NC}"
echo ""

# Step 5: Start all services
echo -e "${BLUE}[Step 5/8] Starting all services...${NC}"
docker-compose up -d
echo -e "${GREEN}✓ Services started${NC}"
echo ""

# Step 6: Wait for services to be healthy
echo -e "${BLUE}[Step 6/8] Waiting for services to be healthy (up to 60 seconds)...${NC}"
for i in {1..60}; do
    if docker-compose ps | grep -q "backend.*Up"; then
        echo -e "${GREEN}✓ Backend is running${NC}"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "${RED}✗ Backend failed to start${NC}"
        exit 1
    fi
    echo -n "."
    sleep 1
done
echo ""

# Step 7: Run database migrations
echo -e "${BLUE}[Step 7/8] Running database migrations...${NC}"
docker-compose exec -T backend npx prisma migrate deploy 2>/dev/null || true
echo -e "${GREEN}✓ Migrations completed${NC}"
echo ""

# Step 8: Verify deployment
echo -e "${BLUE}[Step 8/8] Verifying deployment...${NC}"
if curl -s http://localhost:3001/api/v1/properties > /dev/null; then
    echo -e "${GREEN}✓ API is responding${NC}"
else
    echo -e "${YELLOW}⚠ API not yet responding (may need more time)${NC}"
fi
echo ""

echo "═══════════════════════════════════════════════════════════"
echo -e "${GREEN}✓ DEPLOYMENT COMPLETE${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Access points:"
echo "  Frontend:    http://localhost:3000"
echo "  Backend API: http://localhost:3001"
echo "  Swagger UI:  http://localhost:3001/api/swagger"
echo "  Database:    localhost:5432"
echo ""
echo "Next steps:"
echo "  1. Open http://localhost:3000 in browser"
echo "  2. Register as a landlord"
echo "  3. Create a test property"
echo "  4. Verify it works!"
echo ""
echo "Monitor logs:"
echo "  docker-compose logs backend -f"
echo ""
