/*
AIDDE TRACE HEADER
Test: NotificationBanner accessibility and mobile
Why: Ensure notifications are accessible and mobile-optimized
*/
import React from 'react';
import { render } from '@testing-library/react';
import NotificationBanner from './NotificationBanner';
import { notificationService } from './notification.service';

describe('NotificationBanner accessibility and mobile', () => {
  it('has role status and aria-live polite', () => {
    const { container } = render(<NotificationBanner />);
    const banner = container.querySelector('div[role="status"]');
    expect(banner).toBeTruthy();
    expect(banner?.getAttribute('aria-live')).toBe('polite');
  });
  it('renders with maxWidth and wordBreak for mobile', () => {
    notificationService.notify('info', 'Mobile test notification');
    const { getByText } = render(<NotificationBanner />);
    const notif = getByText('Mobile test notification');
    expect(notif).toHaveStyle('max-width: 100%');
    expect(notif).toHaveStyle('word-break: break-word');
  });
});
