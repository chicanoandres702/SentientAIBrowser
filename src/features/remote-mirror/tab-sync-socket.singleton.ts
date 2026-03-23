// Feature: Remote Input | Why: Module-level WS send function for the service layer.
// useTabSyncSocket calls setWsSend(send) on connection so remote-mirror.service can dispatch
// mouse/keyboard actions without threading the send function through the component tree.
/*
 * [Parent Feature/Milestone] Remote Input
 * [Child Task/Issue] WebSocket action singleton
 * [Subtask] setWsSend set by useTabSyncSocket; wsSend called by remote-mirror.service
 * [Upstream] useTabSyncSocket -> [Downstream] remote-mirror.service.ts
 * [Law Check] 28 lines | Passed 100-Line Law
 */

/** Mirror of proxy-tab-sync.broker's ClientMsg — duplicated to avoid server/client bundle bleed */
export type ClientMsg =
    | { type: 'click';    x: number; y: number; button?: 'left' | 'right' | 'middle' }
    | { type: 'dblclick'; x: number; y: number }
    | { type: 'move';     x: number; y: number }
    | { type: 'scroll';   deltaX: number; deltaY: number }
    | { type: 'drag';     fromX: number; fromY: number; toX: number; toY: number }
    | { type: 'type';     text: string }
    | { type: 'key';      key: string; modifiers?: string[] }
    | { type: 'navigate'; url: string };

// Why: module-level so any service file can call wsSend without holding a React ref.
let _send: ((msg: ClientMsg) => void) | null = null;

/** Called by useTabSyncSocket each time a new socket opens. */
export const setWsSend = (fn: (msg: ClientMsg) => void): void => { _send = fn; };

/** Fire-and-forget: sends msg over the live WS, silently no-ops if not connected. */
export const wsSend = (msg: ClientMsg): void => { _send?.(msg); };
