// AIDDE TRACE HEADER
// Unit tests for SubAction and TaskItem model
import { SubAction, SubtaskStatus, TaskItem } from './tasks.types';

describe('SubAction model', () => {
  it('should require a goal and status', () => {
    const sub: SubAction = {
      action: 'click',
      goal: 'Click the submit button',
      status: 'pending',
    };
    expect(sub.goal).toBeDefined();
    expect(['pending', 'running', 'finished', 'failed']).toContain(sub.status);
  });

  // TypeScript enforces allowed status values; invalid status is a compile-time error.
});

describe('TaskItem model', () => {
  it('should allow subActions with correct status', () => {
    const item: TaskItem = {
      id: 't1', tabId: 'tab1', title: 'Test', status: 'pending',
      subActions: [
        { action: 'type', goal: 'Type username', status: 'pending' },
        { action: 'click', goal: 'Click submit', status: 'finished' },
      ],
    };
    expect(item.subActions?.[0].status).toBe('pending');
    expect(item.subActions?.[1].status).toBe('finished');
  });
});
