#!/bin/bash

# Test x402 Integration
# This script tests if the x402 middleware is properly intercepting payment requests

echo "🧪 Testing x402 Integration..."
echo ""

# Test 1: Make a payment request WITHOUT x402 payment proof
echo "📝 Test 1: Payment request without x402 proof (should return 402)"
echo "---"

curl -X POST http://localhost:3001/api/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "quoteId": "test-quote-123",
    "senderId": "test-user-123",
    "pin": "1234"
  }' \
  -v 2>&1 | grep -E "HTTP|< |{" | head -20

echo ""
echo ""
echo "✅ Expected: HTTP/1.1 402 Payment Required"
echo "✅ Expected: PAYMENT-REQUIRED header with payment details"
echo ""
echo "If you see 402, x402 is working! 🎉"
echo "If you see 401/500, x402 is NOT intercepting requests ❌"
