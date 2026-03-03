/*
AIDDE TRACE HEADER
Test: Proxy Health Check
Why: Ensure Android app can connect to GHCR proxy container
*/
import { checkProxyHealth } from './proxyHealth.utils';

describe('checkProxyHealth', () => {
  it('returns true for valid proxy endpoint', async () => {
    // Replace with a real or mock endpoint for testing
    const result = await checkProxyHealth('wss://echo.websocket.org');
    expect(result).toBe(true);
  });
  it('returns false for invalid proxy endpoint', async () => {
    const result = await checkProxyHealth('wss://invalid-endpoint');
    expect(result).toBe(false);
  });
});
