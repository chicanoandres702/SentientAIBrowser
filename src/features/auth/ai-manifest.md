# AI Manifest: Auth 🤖

> [!IMPORTANT]
> **AI Consumption Note**: This manifest is optimized for agent context ingestion. It defines the "Identity" of the Auth feature.

## 🧬 Capability Summary
| Goal | Agent Action | Boundary |
| --- | --- | --- |
| User Login | `useAuth().login(email, pass)` | Firebase client-side only |
| Session Status | Observe `useAuth().user` | Global context (AuthContext) |
| Configuration | Read `firebase-config.ts` | No env vars used (Hardcoded) |

## 💾 State Persistence Pattern
- **Persistence Layer**: `firebase/auth` internal local storage.
- **State Synchronization**: Managed via `onAuthStateChanged` in the `useAuth` hook.
- **Token Validity**: Automatically refreshed by Firebase SDK; agents should not manage tokens manually.

## 🚧 Critical Boundaries (DO NOT BREAK)
1. **No External Env Dependence**: Client-side Firebase keys must remain hardcoded in `firebase-config.ts` per [ADR-001].
2. **Hook-Only Access**: All components MUST access auth state via the `useAuth()` custom hook, never directly via the context or Firebase SDK.
3. **Traceability**: Every file in this feature MUST link back to `src/features/auth/trace.md`.

## 🧠 Context Inheritance
- **Relevant KI**: `firebase-mcp-server`
- **Related ADRs**: [ADR-001: Firebase Consolidation]
- **Issue Track**: `milestone/v1.0/firebase-prod`

---
*Created via AI Constitution Section 11 [AI-Native Context]*
