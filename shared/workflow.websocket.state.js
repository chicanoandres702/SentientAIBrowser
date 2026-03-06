// Feature: Workflow State Management | Trace: shared/workflow.websocket.state.js
let userWorkflows = {};
function getUserWorkflows(user) {
  if (!user) return {};
  if (!userWorkflows[user.uid]) userWorkflows[user.uid] = {};
  return userWorkflows[user.uid];
}
module.exports = { getUserWorkflows };
