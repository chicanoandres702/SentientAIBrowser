// Feature: Browser Sync Service Test | Trace: tests/browser-sync-service.test.ts
import { syncTabToFirestore, updateTabInFirestore, removeTabFromFirestore, batchUpdateTabs, listenToTabs } from '../src/utils/browser-sync-service';

describe('browser-sync-service', () => {
  it('should export syncTabToFirestore', () => {
    expect(syncTabToFirestore).toBeDefined();
  });
  it('should export updateTabInFirestore', () => {
    expect(updateTabInFirestore).toBeDefined();
  });
  it('should export removeTabFromFirestore', () => {
    expect(removeTabFromFirestore).toBeDefined();
  });
  it('should export batchUpdateTabs', () => {
    expect(batchUpdateTabs).toBeDefined();
  });
  it('should export listenToTabs', () => {
    expect(listenToTabs).toBeDefined();
  });
});
