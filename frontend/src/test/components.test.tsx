import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ScoreBadge } from '../components/ScoreBadge';

describe('UI Component Unit Tests', () => {
  it('renders ScoreBadge with score number and severity label', () => {
    render(<ScoreBadge score={20} severity="CRITICAL" />);
    expect(screen.getByText('20')).toBeDefined();
    expect(screen.getByText('Critical')).toBeDefined();
  });

  it('renders ScoreBadge for Low severity properly', () => {
    render(<ScoreBadge score={3} severity="LOW" />);
    expect(screen.getByText('3')).toBeDefined();
    expect(screen.getByText('Low')).toBeDefined();
  });

  it('renders ScoreBadge for Medium severity properly', () => {
    render(<ScoreBadge score={9} severity="MEDIUM" />);
    expect(screen.getByText('9')).toBeDefined();
    expect(screen.getByText('Medium')).toBeDefined();
  });

  it('renders ScoreBadge for High severity properly', () => {
    render(<ScoreBadge score={16} severity="HIGH" />);
    expect(screen.getByText('16')).toBeDefined();
    expect(screen.getByText('High')).toBeDefined();
  });
});
