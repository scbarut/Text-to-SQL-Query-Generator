import { describe, it, expect } from 'vitest';
import { parseApiError } from '../../services/api';

describe('parseApiError', () => {
  it('identifies security violations correctly from error message', () => {
    const error1 = parseApiError(400, 'Security violation: Detected blocked SQL keyword: DROP');
    expect(error1.isSecurityViolation).toBe(true);
    expect(error1.title).toBe('Security Violation');

    const error2 = parseApiError(400, 'Prompt injection attempt detected');
    expect(error2.isSecurityViolation).toBe(true);
    expect(error2.title).toBe('Security Violation');

    const error3 = parseApiError(400, 'Prohibited multi-statement query detected');
    expect(error3.isSecurityViolation).toBe(true);
    expect(error3.title).toBe('Security Violation');
  });

  it('identifies standard query rejections', () => {
    const error = parseApiError(400, 'Only SELECT and WITH queries are supported');
    expect(error.isSecurityViolation).toBe(false);
    expect(error.title).toBe('Query Rejection');
  });

  it('identifies rate limit errors (status 429)', () => {
    const error = parseApiError(429, 'Rate limit exceeded: 30 requests per minute');
    expect(error.isRateLimit).toBe(true);
    expect(error.title).toBe('Rate Limit Exceeded');
  });

  it('identifies server errors (status 500)', () => {
    const error = parseApiError(500, 'Internal server error');
    expect(error.isServerError).toBe(true);
    expect(error.title).toBe('Server Error');
  });
});

