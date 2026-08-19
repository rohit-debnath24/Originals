// ============================================
// API TYPES (Request/Response wrappers)
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// QR code data structure
export interface QRCodeData {
  type: 'payment';
  version: 1;
  receiverId: string;
  receiverName: string;
  amount?: number; // Optional pre-set amount
}
