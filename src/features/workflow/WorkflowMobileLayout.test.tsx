/*
AIDDE TRACE HEADER
File: WorkflowMobileLayout.test.tsx
Feature: Mobile-optimized workflow layout with embedded controls and info
Why: Ensure all controls and info are visible and usable on mobile, with option to embed step navigator and modals
*/
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { WorkflowMobileLayout } from './WorkflowMobileLayout';

const workflows = [
  { id: 'step1', label: 'Step 1', results: 'Result 1' },
  { id: 'step2', label: 'Step 2', results: 'Result 2' },
];

describe('WorkflowMobileLayout', () => {
  it('renders all controls and info', () => {
    const { getByText } = render(<WorkflowMobileLayout workflows={workflows} embedNavigator={true} />);
    expect(getByText('Workflow')).toBeInTheDocument();
    expect(getByText('Step 1')).toBeInTheDocument();
    expect(getByText('Step 2')).toBeInTheDocument();
    expect(getByText('Run')).toBeInTheDocument();
    expect(getByText('Pause')).toBeInTheDocument();
    expect(getByText('Stop')).toBeInTheDocument();
  });

  it('shows modal on step modify', () => {
    const { getByText, queryByText } = render(<WorkflowMobileLayout workflows={workflows} embedNavigator={true} />);
    fireEvent.click(getByText('Step 1'));
    fireEvent.click(getByText('Step 1')); // Simulate modify
    expect(queryByText('Modify Step')).toBeTruthy();
    expect(getByText('Mark Active')).toBeInTheDocument();
    expect(getByText('Mark Completed')).toBeInTheDocument();
  });

  it('renders without navigator if embedNavigator is false', () => {
    const { queryByText } = render(<WorkflowMobileLayout workflows={workflows} embedNavigator={false} />);
    expect(queryByText('Step 1')).toBeNull();
    expect(queryByText('Step 2')).toBeNull();
  });
});
