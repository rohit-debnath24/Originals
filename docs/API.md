# 📡 API Documentation

## Base URL

```
Development: http://localhost:3001/api
```

## Authentication

Currently, the API uses user IDs for authentication. In production, implement JWT tokens with wallet signature verification.

---

## Endpoints

### Users

#### Create User

```http
POST /api/users
```

**Request Body:**
```json
{
  "name": "Alice",
  "walletAddressUSDC": "0x1234...abcd",
  "phone": "+91-9876543210",
  "upiId": "alice@paytm"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Alice",
    "walletAddressUSDC": "0x1234...abcd",
    "createdAt": "2024-12-14T10:00:00Z"
  }
}
```

#### Get User by Wallet Address

```http
GET /api/users/wallet/:address
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Alice",
    "walletAddressUSDC": "0x1234...abcd",
    "hasPin": true
  }
}
```

#### Set PIN

```http
POST /api/users/:id/pin
```

**Request Body:**
```json
{
  "pin": "1234"
}
```

**Response:**
```json
{
  "success": true,
  "message": "PIN set successfully"
}
```

---

### Quotes

#### Create Quote

Creates a new quote by running the Dutch auction to find the best rate.

```http
POST /api/quotes
```

**Request Body:**
```json
{
  "senderId": "user-uuid",
  "receiverUpiId": "merchant@paytm",
  "amountINR": 5000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "quote-uuid",
    "amountINR": 5000,
    "amountUSDC": 56.38,
    "effectiveRate": 88.68,
    "senderFeeUSDC": 0.28,
    "status": "ready",
    "computationProgress": 100,
    "bucketAllocations": [
      {
        "bucketId": "bucket-gamma",
        "bucketName": "🌟 Gamma Pool",
        "amountINR": 5000,
        "amountUSDC": 56.38,
        "rate": 88.68
      }
    ],
    "expiresAt": "2024-12-14T10:02:00Z",
    "expiresInSeconds": 120
  }
}
```

#### Get Quote

```http
GET /api/quotes/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "quote-uuid",
    "status": "ready",
    "amountINR": 5000,
    "amountUSDC": 56.38,
    "effectiveRate": 88.68,
    "expiresInSeconds": 95
  }
}
```

---

### Payments

#### Initiate Payment

```http
POST /api/payments
```

**Request Body:**
```json
{
  "quoteId": "quote-uuid",
  "senderId": "user-uuid",
  "pin": "1234"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "payment-uuid",
    "status": "initiated",
    "amountINR": 5000,
    "amountUSDC": 56.38,
    "receiverUpiId": "merchant@paytm"
  }
}
```

#### Get Payment Status

```http
GET /api/payments/:id/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "payment-uuid",
    "status": "completed",
    "amountINR": 5000,
    "amountUSDC": 56.38,
    "completedAt": "2024-12-14T10:01:30Z"
  }
}
```

#### Get User Transactions

```http
GET /api/payments/user/:userId
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "payment-uuid",
      "status": "completed",
      "amountINR": 5000,
      "amountUSDC": 56.38,
      "receiverUpiId": "merchant@paytm",
      "createdAt": "2024-12-14T10:00:00Z"
    }
  ]
}
```

---

### Buckets (Liquidity Pools)

#### List All Buckets

```http
GET /api/buckets
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "bucket-gamma",
      "name": "🌟 Gamma Pool",
      "baseRate": 88.5,
      "spreadPercent": 0.2,
      "availableLiquidityINR": 80000,
      "healthScore": 100,
      "successProbability": 0.99,
      "status": "active"
    }
  ]
}
```

#### Get Bucket Details

```http
GET /api/buckets/:id
```

---

### Investors

#### Get Investor Positions

```http
GET /api/investors/:userId/positions
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "position-uuid",
      "bucketId": "bucket-gamma",
      "bucketName": "🌟 Gamma Pool",
      "principalINR": 80000,
      "sharePercent": 100,
      "earnedUSDC": 45.67,
      "withdrawableUSDC": 45.67
    }
  ]
}
```

#### Deposit to Bucket

```http
POST /api/investors/deposit
```

**Request Body:**
```json
{
  "investorId": "user-uuid",
  "bucketId": "bucket-gamma",
  "amountINR": 50000
}
```

#### Withdraw from Position

```http
POST /api/investors/withdraw
```

**Request Body:**
```json
{
  "positionId": "position-uuid",
  "amountUSDC": 25.00
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `NOT_FOUND` | 404 | Resource not found |
| `INVALID_PIN` | 401 | Wrong PIN provided |
| `QUOTE_EXPIRED` | 400 | Quote has expired |
| `INSUFFICIENT_LIQUIDITY` | 400 | Not enough liquidity |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limits

In production, implement rate limiting:

| Endpoint | Limit |
|----------|-------|
| `POST /quotes` | 10/min |
| `POST /payments` | 5/min |
| `GET /*` | 100/min |

---

## Webhooks (Planned)

```http
POST /webhooks/payment-status
```

Webhook payload for payment status updates:

```json
{
  "event": "payment.completed",
  "data": {
    "paymentId": "payment-uuid",
    "status": "completed",
    "amountINR": 5000,
    "timestamp": "2024-12-14T10:01:30Z"
  }
}
```
