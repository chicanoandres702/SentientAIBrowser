// ...existing code...
// Proxy connection health check utility
export async function checkProxyHealth(proxyUrl: string): Promise<boolean> {
  try {
    const ws = new WebSocket(proxyUrl);
    return await new Promise(resolve => {
      ws.onopen = () => { ws.close(); resolve(true); };
      ws.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}
