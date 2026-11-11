import { DatabaseSchemaResponse, ColumnMetadata } from '../components/SchemaExplorer';
import { AnalysisData } from '../components/ChartView';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface QueryResponse {
  sql: string;
  explanation: string;
  columns: ColumnMetadata[];
  rows: (string | number | boolean | null)[][];
  total_count: number;
}

export interface ApiError {
  status: number;
  title: string;
  message: string;
  isSecurityViolation: boolean;
  isRateLimit: boolean;
  isServerError: boolean;
}

export function parseApiError(status: number, rawDetail: unknown): ApiError {
  let detailMessage = `Server responded with status ${status}`;

  if (typeof rawDetail === 'string') {
    detailMessage = rawDetail;
  } else if (Array.isArray(rawDetail)) {
    detailMessage = rawDetail
      .map((item: { msg?: string }) => item?.msg || JSON.stringify(item))
      .join('; ');
  } else if (rawDetail && typeof rawDetail === 'object') {
    const errObj = rawDetail as Record<string, unknown>;
    if (typeof errObj.message === 'string') {
      detailMessage = errObj.message;
    } else if (typeof errObj.detail === 'string') {
      detailMessage = errObj.detail;
    } else {
      detailMessage = JSON.stringify(rawDetail);
    }
  }

  const lower = detailMessage.toLowerCase();
  const isSecurityViolation =
    lower.includes('security') ||
    lower.includes('injection') ||
    lower.includes('blocked') ||
    lower.includes('prohibited');

  const isRateLimit = status === 429;
  const isServerError = status >= 500;

  let title = 'Query Error';
  if (isRateLimit) {
    title = 'Rate Limit Exceeded';
  } else if (isServerError) {
    title = 'Server Error';
  } else if (isSecurityViolation) {
    title = 'Security Violation';
  } else {
    title = 'Query Rejection';
  }

  return {
    status,
    title,
    message: detailMessage,
    isSecurityViolation,
    isRateLimit,
    isServerError,
  };
}

export class AppApiError extends Error {
  public apiError: ApiError;

  constructor(apiError: ApiError) {
    super(apiError.message);
    this.name = 'AppApiError';
    this.apiError = apiError;
  }
}

export async function fetchSchemaApi(): Promise<DatabaseSchemaResponse> {
  const response = await fetch(`${API_BASE_URL}/schema`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new AppApiError(parseApiError(response.status, errorData?.detail));
  }
  return response.json();
}

export async function refreshSchemaApi(): Promise<DatabaseSchemaResponse> {
  const response = await fetch(`${API_BASE_URL}/refresh-schema`, {
    method: 'POST',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new AppApiError(parseApiError(response.status, errorData?.detail));
  }
  return response.json();
}

export async function executeQueryApi(question: string): Promise<QueryResponse> {
  const cleanQuestion = question.trim();
  const response = await fetch(`${API_BASE_URL}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question: cleanQuestion }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new AppApiError(parseApiError(response.status, errorData?.detail));
  }

  return response.json();
}

export interface AnalyzePayload {
  columns: ColumnMetadata[];
  rows: (string | number | boolean | null)[][];
  user_request?: string;
  use_llm?: boolean;
}

export async function analyzeQueryApi(payload: AnalyzePayload): Promise<AnalysisData> {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      columns: payload.columns.map((c) => ({ name: c.name, type: c.type })),
      rows: payload.rows,
      user_request: payload.user_request,
      use_llm: payload.use_llm ?? false,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new AppApiError(parseApiError(response.status, errorData?.detail));
  }

  return response.json();
}

