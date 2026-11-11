import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SqlPreview } from '../SqlPreview';

describe('SqlPreview', () => {
  it('renders SQL code block, explanation, and verified badge', () => {
    const html = renderToStaticMarkup(
      <SqlPreview
        sql="SELECT department, COUNT(*) FROM employees GROUP BY department"
        explanation="Calculates headcounts by department."
        defaultExpanded={true}
      />
    );

    expect(html).toContain('Generated SQL');
    expect(html).toContain('Verified SELECT');
    expect(html).toContain('Calculates headcounts by department.');
    expect(html).toContain('SELECT department, COUNT(*) FROM employees GROUP BY department');
    expect(html).toContain('Copy SQL');
  });

  it('renders collapsed state when defaultExpanded is false', () => {
    const html = renderToStaticMarkup(
      <SqlPreview
        sql="SELECT * FROM departments"
        explanation="Lists all departments."
        defaultExpanded={false}
      />
    );

    expect(html).toContain('Generated SQL');
    expect(html).toContain('Verified SELECT');
    expect(html).not.toContain('Lists all departments.');
  });
});

