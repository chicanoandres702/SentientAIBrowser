// Feature: Tab Sync Types | Trace: README.md
// Why: isolated type file prevents circular imports when broker, capture service,
// and WS-actions all need the same message shapes.

/** All messages pushed server → client */
export type ServerMsg =
    | { type: 'url';        tabId: string; url: string; title: string }
    | { type: 'screenshot'; tabId: string; data: string; url: string }  // nav-triggered
    | { type: 'frame';      tabId: string; data: string; url: string }  // streaming interval
    | { type: 'cursor';     tabId: string; x: number; y: number }
    | { type: 'status';      tabId: string; message: string }
    | { type: 'task_status'; tabId: string; taskId: string; status: 'in_progress' | 'completed' | 'failed'; nextTaskId?: string }
    | { type: 'connected';   tabId: string };

/** Backward-compat alias — existing callers use TabSyncMessage unchanged */
export type TabSyncMessage = ServerMsg;

/** All messages sent client → server */
export type ClientMsg =
    | { type: 'click';    x: number; y: number; button?: 'left' | 'right' | 'middle' }
    | { type: 'dblclick'; x: number; y: number }
    | { type: 'move';     x: number; y: number }
    | { type: 'scroll';   deltaX: number; deltaY: number }
    | { type: 'drag';     fromX: number; fromY: number; toX: number; toY: number }
    | { type: 'type';     text: string }
    | { type: 'key';      key: string; modifiers?: string[] }
    | { type: 'navigate'; url: string };
