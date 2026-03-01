# Component: Universal Contract Mandate

Implicit context causes AI hallucinations. Type safety eliminates them.

## Core Language Law

| Language | Enforcement | Forbidden |
|----------|-------------|-----------|
| TypeScript | `strict` interfaces only | `any` |
| Python | Type hints + Pydantic/Dataclasses | Untyped functions |
| Go | Explicit structs | `interface{}` without justification |
| Rust | Native types + derive macros | `unwrap()` without error handling |
| C# | `internal sealed` + SOLID | `dynamic`, `object` |
| PHP | PHP 8+ `strict_types=1` | Untyped parameters |

## Models as the Universal Source of Truth
- Every DB read/write maps to a defined Struct/Class/Model
- Every API request/response body is strongly typed
- Dynamic guessing is strictly forbidden

## Centralized Models Directory
All domain models live in ONE location per project:

| Stack | Location |
|-------|----------|
| TypeScript/JS | `src/models/` or `src/types/` |
| Python | `core/entities/` or `src/models/` |
| Go | `pkg/types/` |
| C# | `Core/Entities/` |

**The AI's first step in any generation is importing from this directory.**

## Contract Change Protocol
Before modifying any model/type file:
1. Output a diff (before/after)
2. List all files that import this model
3. **HALT — require explicit user confirmation**
4. After confirmation: update all consumers atomically

Delegate to `type-enforcer` agent for all type validation.
