// Feature: Cursor Controller Logic | Trace: src/hooks/useCursorController.ts

import React from 'react';
import { render, act } from '@testing-library/react';
import { useCursorController } from '../src/hooks/useCursorController';

function TestComponent({ onResult }: { onResult: (controller: any) => void }) {
  const controller = useCursorController(800, 600);
  React.useEffect(() => {
    onResult(controller);
  }, [controller, onResult]);
  return null;
}

describe('useCursorController logic', () => {
  it('should initialize controller with default dimensions', () => {
    let controllerResult: any = null;
    const TestComponent: React.FC = () => {
      const controller = useCursorController(800, 600);
      React.useEffect(() => {
        controllerResult = controller;
      }, [controller]);
      return null;
    };
    act(() => {
      render(React.createElement(TestComponent));
    });
    expect(controllerResult).not.toBeNull();
    if (controllerResult) {
      // The controllerResult is an object with a 'cursor' property
      expect(controllerResult.cursor).toBeDefined();
      expect(controllerResult.cursor.x).toBe(0);
      expect(controllerResult.cursor.y).toBe(0);
      expect(controllerResult.cursor.visible).toBe(false);
      expect(controllerResult.cursor.effect).toBe('idle');
    }
  });
});
