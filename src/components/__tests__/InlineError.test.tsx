import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { InlineError } from '../InlineError';

describe('InlineError', () => {
  it('renders security violation with amber theme and policy note', () => {
    const html = renderToStaticMarkup(
      <InlineError
        title="Security Violation"
        message="Blocked keyword DROP detected"
        isSecurityViolation={true}
      />
    );

    expect(html).toContain('Security Violation');
    expect(html).toContain('Blocked keyword DROP detected');
    expect(html).toContain('Defense-in-depth policy active');
    expect(html).toContain('bg-amber-50');
  });

  it('renders standard query rejection with red theme without defense policy note', () => {
    const html = renderToStaticMarkup(
      <InlineError
        title="Query Rejection"
        message="Only SELECT queries allowed"
        isSecurityViolation={false}
      />
    );

    expect(html).toContain('Query Rejection');
    expect(html).toContain('Only SELECT queries allowed');
    expect(html).not.toContain('Defense-in-depth policy active');
    expect(html).toContain('bg-red-50');
  });
});

