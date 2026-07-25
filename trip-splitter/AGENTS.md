# AGENTS.md

# Trip Splitter Agent Guide

This document describes the architecture, conventions, and expectations for
agents working in this repository.

Read this file before making changes.

When this guide conflicts with the repository, prefer the repository.
Always inspect the existing code before editing.

---

# Project Overview

Trip Splitter is a React + TypeScript web application for tracking shared trip
expenses and calculating balances and settlements.

Current stack:

- React
- TypeScript
- Vite
- React Router
- Firebase Authentication
- Cloud Firestore
- Vitest

---

# Core Philosophy

The project intentionally separates:

- UI
- business logic
- persistence

Business logic should be reusable regardless of whether data comes from
Firestore, a mock repository, or another backend.

Avoid coupling React components directly to Firebase.

Whenever possible:

UI
→ Repository Interface
→ Repository Implementation
→ Firestore

---

# Repository Architecture

Repository interfaces define the application's persistence contract.

Current repositories include:

- TripRepository
- FirestoreTripRepository
- MockTripRepository

Repository composition:

- repositoryInstance

The application currently uses the Firestore implementation via
repositoryInstance.

Whenever TripRepository changes:

- update FirestoreTripRepository
- update MockTripRepository
- keep both implementations behaviorally consistent

React components should never directly read or write Firestore.

Repositories should return domain models, never Firestore snapshots.

Firestore-specific mapping belongs only inside FirestoreTripRepository.

---

# React Responsibilities

Pages should:

- load data
- manage page state
- call repository methods
- manage loading state
- manage error state
- perform navigation

Presentational components should:

- receive props
- display UI
- invoke callbacks

Presentational components should not:

- call Firestore
- call repository methods
- perform routing
- calculate business logic

Example:

ExpenseCard should receive:

- onEdit()
- onDelete()

ExpenseCard should not know what repository is being used.

---

# Business Logic

Business rules belong outside React.

Never duplicate financial calculations inside pages or components.

Existing business logic includes:

- equal split calculation
- balance calculation
- settlement calculation
- currency helpers

Reuse these whenever possible.

---

# Money Rules

All persisted money is stored as integer cents.

Correct:

1500

Incorrect:

15.00

Only convert between dollars and cents at UI boundaries.

Never persist floating point currency values.

---

# Firestore Structure

Trips

```
trips/{tripId}
```

Members

```
trips/{tripId}/members/{memberId}
```

Expenses

```
trips/{tripId}/expenses/{expenseId}
```

Preserve existing field names unless a task explicitly requires a schema
migration.

Use Firebase server timestamps where appropriate.

---

## Authentication

Anonymous Firebase authentication is initiated during application startup.

The application currently begins rendering before authentication is guaranteed
to have completed, so repository methods must not assume a current user is
already available.

Repository methods performing authenticated writes should verify that
`auth.currentUser` is not null.

`deleteExpense` is a known exception that has not yet been brought into
alignment with this rule.

Do not introduce a different authentication pattern without explicit approval.

---

# TypeScript Rules

The project uses:

erasableSyntaxOnly

Do NOT use constructor parameter properties.

Incorrect:

```ts
constructor(
    private readonly db: Firestore
) {}
```

Correct:

```ts
private readonly db: Firestore;

constructor(db: Firestore) {
    this.db = db;
}
```

Additional rules:

- prefer `import type`
- avoid `any`
- avoid non-null assertions unless necessary
- preserve strict typing
- avoid suppressing compiler errors

---

# Forms

Reusable forms should:

- accept initial values
- expose submit callbacks
- avoid persistence logic

Pages are responsible for calling repositories.

---

# Mutation Pattern

Unless the feature requires otherwise:

1. Validate input
2. Prevent duplicate submission
3. Set saving state
4. Clear previous errors
5. Perform required business calculations
6. Call repository
7. Reload or navigate
8. Display friendly errors
9. Clear saving state in finally

Reuse existing mutation patterns before inventing new ones.

---

# Error Handling

Display user-friendly errors.

Log underlying errors for debugging.

Never silently ignore repository or Firebase failures.

Handle missing:

- trips
- expenses
- members

explicitly.

---

# Scope Control

Prefer focused changes.

Avoid broad refactors.

Avoid introducing new libraries.

Avoid changing architecture unless requested.

Avoid renaming files or APIs without good reason.

Preserve existing behavior outside the requested feature.

---

# Code Style

Prefer consistency over cleverness.

Follow existing naming conventions.

Reuse existing components before creating new ones.

Keep functions small and focused.

Avoid unnecessary abstractions.

If an existing pattern already solves the problem, use it.

---

# Working Process

Before editing:

1. Inspect relevant files.
2. Identify existing patterns.
3. Explain the intended approach.
4. Ask for clarification only if required.

Do not assume this document is perfectly current.

Always verify routes, types, scripts, and repository APIs against the codebase.

---

# After Completing Work

Summarize:

- files changed
- important implementation decisions
- build results
- test results
- remaining manual testing

Do not claim builds or tests passed unless they were actually run.

If a build or test fails:

- report it
- determine whether it is related to your changes
- fix it when appropriate
- identify unrelated pre-existing failures

---

# Testing

Run at minimum:

```bash
npm run build
```

Run relevant tests whenever:

- business logic changes
- repository behavior changes
- existing tested functionality changes

---

# Current Status

This section is informational only.

Verify against the repository before relying on it.

Implemented:

- Firebase Authentication
- Firestore
- Repository pattern
- Mock repository
- Trip creation
- Trip loading
- Trip listing
- Trip deletion
- Expense creation
- Expense editing
- Expense deletion
- Equal split calculations
- Balance calculations
- Settlement calculations
- Loading states
- Error handling

Likely next work:

- Member management
- Trip editing
- Sharing
- Multi-user support

---

# Agent Expectations

When planning:

- explain your reasoning briefly
- identify tradeoffs
- minimize unnecessary complexity

When implementing:

- preserve architecture
- avoid unrelated edits
- finish the feature completely

When reviewing:

- look for bugs
- identify architecture drift
- suggest improvements consistent with this repository

The goal is to leave the project cleaner than it was found while preserving
its existing architecture and style.

## Known Current Limitations

These are known project limitations, not bugs for every task.

- The Firestore and Mock repositories are not yet behaviorally identical.
- Expense editing always recalculates equal splits.
- Delete mutations currently have simpler loading/error handling than create/edit.

## Current Project Conventions

Trip loading is centralized through:

- `useTrip()`
- `useTripOutlet()`

`TripDashboardPage` owns trip state for nested trip pages.

Nested trip pages receive:

- `trip`
- `reload`

through router outlet context.

Expense creation and editing pages load trips independently.

Expense dates are stored as `YYYY-MM-DD` strings.

`FirestoreTripRepository` assembles complete `Trip` aggregates from the trip
document and its member and expense subcollections.

`MockTripRepository` assembles trips from in-memory data.

## Current automated tests cover:

- calculateEqualSplits
- calculateBalances
- calculateSettlements
- MockTripRepository.getTrips
- MockTripRepository.deleteTrip

Repository, routing, UI, and Firebase behavior currently have little or no automated test coverage.
