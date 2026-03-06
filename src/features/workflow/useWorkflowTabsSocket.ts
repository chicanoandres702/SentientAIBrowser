// Feature: Workflow Tabs | Trace: src/features/workflow/useWorkflowTabsSocket.ts
import { useEffect, useState } from 'react';

export function useWorkflowTabsSocket(wsUrl: string, workflows: any[], aiConfidenceDecision: (context: string) => any, notificationService: any, setModal: any, setResults: any, setStepStatus: any) {
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectAttempts = 0;
    function connectWs() {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        setWsConnected(true);
        setLoading(false);
        reconnectAttempts = 0;
      };
      ws.onclose = () => {
        setWsConnected(false);
        setLoading(true);
        if (reconnectAttempts < 5) {
          setTimeout(connectWs, 1000 * (reconnectAttempts + 1));
          reconnectAttempts++;
        }
      };
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setResults((prev: any) => ({ ...prev, [data.workflowId]: data.result }));
        setLoading(false);
        setStepStatus((prev: any) => ({ ...prev, [data.workflowId]: 'completed' }));
        // AI confidence check: trigger modal if confidence is low
        const aiDecision = aiConfidenceDecision(data.result || '');
        if (aiDecision.confidence < 0.5) {
          notificationService.notify('warning', `AI is unsure for workflow ${data.workflowId}: ${aiDecision.question}`);
          setModal({
            question: aiDecision.question,
            options: aiDecision.options,
            onSelect: (opt: string) => {
              if (opt === 'Retry') setStepStatus((prev: any) => ({ ...prev, [data.workflowId]: 'pending' }));
              if (opt === 'Skip') setStepStatus((prev: any) => ({ ...prev, [data.workflowId]: 'completed' }));
              if (opt === 'Request Clarification') {
                setModal({
                  question: 'Please clarify your intent:',
                  options: ['Submit', 'Cancel'],
                  showInput: true,
                  inputLabel: 'Clarification:',
                  onSelect: (submitOpt: string, val: string) => {
                    setModal(null);
                  },
                });
                return;
              }
              setModal(null);
            },
          });
        } else {
          notificationService.notify('success', `Workflow ${data.workflowId} completed successfully.`);
        }
      };
    }
    connectWs();
    return () => { ws?.close(); };
  }, []);

  return { loading, wsConnected };
}
