/*
AIDDE TRACE HEADER
Test: NotificationBanner
Why: Ensure notifications display and auto-dismiss
*/
import React from 'react';
import { render, act } from '@testing-library/react';
import NotificationBanner from './NotificationBanner';
import { notificationService } from './notification.service';

describe('NotificationBanner', () => {
  it('shows and auto-dismisses notifications', () => {
    jest.useFakeTimers();
    const { getByText, queryByText } = render(<NotificationBanner />);
    act(() => {
      notificationService.notify('info', 'Test notification');
      jest.advanceTimersByTime(100);
    });
    expect(getByText('Test notification')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(queryByText('Test notification')).toBeNull();
    jest.useRealTimers();
  });
});
