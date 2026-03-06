// Feature: Task Sync Service | Trace: shared/task-sync.service.ts
import { syncTaskToFirestore, updateTaskInFirestore, removeTaskFromFirestore, listenToTasks, hydrateTasksFromFirestore } from '../src/utils/task-sync-service';

describe('task-sync-service', () => {
  it('should export syncTaskToFirestore', () => {
    expect(syncTaskToFirestore).toBeDefined();
  });
  it('should export updateTaskInFirestore', () => {
    expect(updateTaskInFirestore).toBeDefined();
  });
  it('should export removeTaskFromFirestore', () => {
    expect(removeTaskFromFirestore).toBeDefined();
  });
  it('should export listenToTasks', () => {
    expect(listenToTasks).toBeDefined();
  });
  it('should export hydrateTasksFromFirestore', () => {
    expect(hydrateTasksFromFirestore).toBeDefined();
  });
});
