#!/bin/bash

# x402 Integration Test Suite
# Tests the complete x402 payment flow

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           x402 Integration Test Suite                         ║"
echo "║           Crypto → INR Instant Payments App                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:3001"
HEALTH_ENDPOINT="$BACKEND_URL/health"
PAYMENT_ENDPOINT="$BACKEND_URL/api/payments"

# Test Results
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

echo "═══════════════════════════════════════════════════════════════"
echo "Test 1: Backend Health Check"
echo "═══════════════════════════════════════════════════════════════"
echo ""

HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_ENDPOINT)

if [ "$HEALTH_RESPONSE" = "200" ]; then
    print_result 0 "Backend is running and healthy"
    echo -e "${BLUE}   Endpoint: $HEALTH_ENDPOINT${NC}"
else
    print_result 1 "Backend health check failed (HTTP $HEALTH_RESPONSE)"
    echo -e "${RED}   Make sure backend is running: cd apps/server && npm run dev${NC}"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "Test 2: x402 Middleware Returns 402 (Without Payment)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

PAYMENT_RESPONSE=$(curl -s -X POST $PAYMENT_ENDPOINT \
    -H "Content-Type: application/json" \
    -d '{
        "quoteId": "test-quote-123",
        "senderId": "user-alice",
        "pin": "1234"
    }' \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$PAYMENT_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$PAYMENT_RESPONSE" | sed '$d')

echo -e "${BLUE}HTTP Status Code: $HTTP_CODE${NC}"
echo ""

if [ "$HTTP_CODE" = "402" ]; then
    print_result 0 "x402 middleware correctly returns 402 Payment Required"
else
    print_result 1 "Expected HTTP 402, got HTTP $HTTP_CODE"
fi

echo ""
echo "─────────────────────────────────────────────────────────────"
echo "Response Body:"
echo "─────────────────────────────────────────────────────────────"
echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
echo ""

# Parse and validate response structure
if echo "$RESPONSE_BODY" | jq -e '.x402Version' > /dev/null 2>&1; then
    X402_VERSION=$(echo "$RESPONSE_BODY" | jq -r '.x402Version')
    print_result 0 "Response contains x402Version: $X402_VERSION"
else
    print_result 1 "Response missing x402Version field"
fi

if echo "$RESPONSE_BODY" | jq -e '.accepts[0].network' > /dev/null 2>&1; then
    NETWORK=$(echo "$RESPONSE_BODY" | jq -r '.accepts[0].network')
    if [ "$NETWORK" = "base-sepolia" ]; then
        print_result 0 "Network correctly set to base-sepolia"
    else
        print_result 1 "Expected network 'base-sepolia', got '$NETWORK'"
    fi
else
    print_result 1 "Response missing network field"
fi

if echo "$RESPONSE_BODY" | jq -e '.accepts[0].payTo' > /dev/null 2>&1; then
    PAY_TO=$(echo "$RESPONSE_BODY" | jq -r '.accepts[0].payTo')
    print_result 0 "Payment address found: $PAY_TO"
else
    print_result 1 "Response missing payTo address"
fi

if echo "$RESPONSE_BODY" | jq -e '.accepts[0].maxAmountRequired' > /dev/null 2>&1; then
    AMOUNT=$(echo "$RESPONSE_BODY" | jq -r '.accepts[0].maxAmountRequired')
    if [ "$AMOUNT" = "1000" ]; then
        print_result 0 "Price correctly set to 1000 (0.001 USDC)"
    else
        print_result 1 "Expected amount 1000, got $AMOUNT"
    fi
else
    print_result 1 "Response missing maxAmountRequired field"
fi

if echo "$RESPONSE_BODY" | jq -e '.accepts[0].asset' > /dev/null 2>&1; then
    ASSET=$(echo "$RESPONSE_BODY" | jq -r '.accepts[0].asset')
    USDC_ADDRESS="0x036CbD53842c5426634e7929541eC2318f3dCF7e"
    if [ "$ASSET" = "$USDC_ADDRESS" ]; then
        print_result 0 "USDC token address correct (Base Sepolia)"
    else
        print_result 1 "Expected USDC address $USDC_ADDRESS, got $ASSET"
    fi
else
    print_result 1 "Response missing asset (token) address"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "Test 3: x402 Configuration Validation"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check if .env file exists
if [ -f "apps/server/.env" ]; then
    print_result 0 "Backend .env file exists"
    
    # Check for required variables
    if grep -q "COMPANY_WALLET_ADDRESS" apps/server/.env; then
        WALLET_ADDRESS=$(grep "COMPANY_WALLET_ADDRESS" apps/server/.env | cut -d'=' -f2)
        print_result 0 "COMPANY_WALLET_ADDRESS configured: $WALLET_ADDRESS"
    else
        print_result 1 "COMPANY_WALLET_ADDRESS not found in .env"
    fi
    
    if grep -q "X402_FACILITATOR_URL" apps/server/.env; then
        FACILITATOR_URL=$(grep "X402_FACILITATOR_URL" apps/server/.env | cut -d'=' -f2)
        print_result 0 "X402_FACILITATOR_URL configured: $FACILITATOR_URL"
    else
        print_result 1 "X402_FACILITATOR_URL not found in .env"
    fi
    
    if grep -q "X402_NETWORK" apps/server/.env; then
        X402_NETWORK=$(grep "X402_NETWORK" apps/server/.env | cut -d'=' -f2)
        print_result 0 "X402_NETWORK configured: $X402_NETWORK"
    else
        print_result 1 "X402_NETWORK not found in .env"
    fi
else
    print_result 1 "Backend .env file not found"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "Test Summary"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ ALL TESTS PASSED - x402 IS WORKING! 🎉               ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Next Steps:"
    echo "1. Fund a burner wallet with test USDC on Base Sepolia"
    echo "2. Test end-to-end payment flow from frontend"
    echo "3. Monitor on-chain transactions on Base Sepolia explorer"
    echo ""
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ SOME TESTS FAILED - CHECK CONFIGURATION               ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Make sure backend is running: cd apps/server && npm run dev"
    echo "2. Check .env file exists: ls apps/server/.env"
    echo "3. Verify environment variables are loaded"
    echo "4. Check x402 middleware is applied before routes"
    echo ""
    exit 1
fi
