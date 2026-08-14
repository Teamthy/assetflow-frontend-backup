# AssetFlow Frontend: Onboarding & User Flow Specification Compliance Analysis

## Scope

This document reviews the current frontend implementation against the onboarding and invited-user workflow described in the recent specification and test plan for AssetFlow. The analysis focuses on the end-to-end experience from account registration through onboarding, asset import, dashboard entry, invited-staff acceptance, and role-specific post-login experience.

## Executive Summary

The frontend is largely aligned with the core onboarding and invited-user journey. The main path from registration to onboarding wizard, asset import, dashboard landing, and role-based dashboard rendering is implemented and consistent with the intended workflow.

Overall compliance is strong for the core flow, with the following caveats:

- The onboarding wizard is implemented well, but the dedicated "welcome" phase is not actually reachable in the current code.
- The invited-staff acceptance flow is implemented, but some team-invite management behavior is still mocked and not fully integrated with the backend.
- The post-onboarding UX is functional, but the welcome banner and some completion-state transitions are not fully wired to the intended experience.

## Compliance Snapshot

| Area | Specification expectation | Current frontend status | Compliance |
| --- | --- | --- | --- |
| Account registration | New user can create an account and become a first-time organizer | Implemented in [src/app/(auth)/register/page.tsx](../src/app/(auth)/register/page.tsx) | Strong |
| First-login onboarding | User is routed into a guided onboarding wizard after account creation | Implemented in [src/app/(onboarding)/onboarding/page.tsx](../src/app/(onboarding)/onboarding/page.tsx) | Strong |
| Onboarding steps | Organization profile, policy, branches, and assets steps are presented in sequence | Implemented through onboarding step components | Strong |
| Post-onboarding navigation | User can proceed to asset import and then reach dashboard | Implemented through the onboarding flow and redirect handling | Strong |
| Invite acceptance | Invited staff can view invitation and create account | Implemented in [src/app/(auth)/accept-invite/[token]/page.tsx](../src/app/(auth)/accept-invite/[token]/page.tsx) | Strong |
| Role-based landing | Invited users land on a role-appropriate dashboard | Implemented in [src/app/(dashboard)/dashboard/page.tsx](../src/app/(dashboard)/dashboard/page.tsx) and role dashboards | Strong |
| Team management UI | Team members and invite management screen is available | Implemented in [src/app/(dashboard)/settings/team/page.tsx](../src/app/(dashboard)/settings/team/page.tsx) | Partial |
| Reports access | Reports hub and audit dashboard are reachable from the dashboard flow | Implemented in [src/app/(dashboard)/reports/page.tsx](../src/app/(dashboard)/reports/page.tsx) and [src/app/(dashboard)/reports/audit/page.tsx](../src/app/(dashboard)/reports/audit/page.tsx) | Strong |

## Detailed Findings

### 1. Registration and initial account setup

Implemented in [src/app/(auth)/register/page.tsx](../src/app/(auth)/register/page.tsx).

What is working:
- The register page collects first name, last name, email, password, and organization name.
- It calls the registration API and persists auth state using the auth store.
- It sets the first-login state and redirects to the onboarding route.

Compliance assessment:
- This satisfies the core registration requirement well.
- The implementation uses a role of `primary_admin` by default for newly registered org owners, which fits a first-time admin setup.

### 2. Onboarding wizard experience

Implemented in [src/app/(onboarding)/onboarding/page.tsx](../src/app/(onboarding)/onboarding/page.tsx) with step components in:
- [src/components/onboarding/StepOrgProfile.tsx](../src/components/onboarding/StepOrgProfile.tsx)
- [src/components/onboarding/StepAccountingPolicy.tsx](../src/components/onboarding/StepAccountingPolicy.tsx)
- [src/components/onboarding/StepBranches.tsx](../src/components/onboarding/StepBranches.tsx)

What is working:
- The page presents a guided multi-step flow.
- The sequence covers organization profile, accounting policy, branches, and assets.
- Progress is tracked via the onboarding store.
- Users can skip or continue through steps.
- The flow ends with a completion screen and redirect to the dashboard.

Compliance assessment:
- The onboarding flow is strong and matches the expected structure.
- The main gap is that the dedicated welcome phase is not actually activated by the current state logic, so that UX layer is effectively unreachable.

### 3. Asset import and post-onboarding routing

Implemented in [src/app/(dashboard)/assets/import/page.tsx](../src/app/(dashboard)/assets/import/page.tsx).

What is working:
- The import experience is available as a dedicated route with a step-based wizard.
- The onboarding flow can redirect users to `/assets/import?from=onboarding`.
- The page exposes a visible import heading and upload workflow consistent with the spec.

Compliance assessment:
- Strong alignment with the intended post-onboarding asset import flow.
- The current implementation is appropriate for the spec and works well as a targeted onboarding follow-up.

### 4. Dashboard routing and role-specific landing

Implemented in [src/app/(dashboard)/dashboard/page.tsx](../src/app/(dashboard)/dashboard/page.tsx) and the dashboard component map.

Role dashboards reviewed:
- [src/components/dashboard/BranchManagerDashboard.tsx](../src/components/dashboard/BranchManagerDashboard.tsx)
- [src/components/dashboard/FinanceDashboard.tsx](../src/components/dashboard/FinanceDashboard.tsx)
- [src/components/dashboard/AuditorDashboard.tsx](../src/components/dashboard/AuditorDashboard.tsx)

What is working:
- The dashboard route selects the role-specific component based on the user role.
- Branch manager, finance user, and auditor roles each render the expected headings and experience.
- The main admin/dashboard landing page is also present and functional.

Compliance assessment:
- This is one of the strongest parts of the frontend implementation.
- Role-specific landing is implemented in a clear and maintainable way.

### 5. Invitation acceptance flow

Implemented in [src/app/(auth)/accept-invite/[token]/page.tsx](../src/app/(auth)/accept-invite/[token]/page.tsx).

What is working:
- The page validates an invitation token.
- It shows invitation context, including organization name and role.
- It collects first name, last name, and password.
- On success, it sets auth state and redirects to the dashboard.

Compliance assessment:
- The main invitation acceptance flow is implemented well and aligns with the spec.
- The UI is robust enough for the core experience, though it still relies on the backend for preview and acceptance endpoints.

### 6. Team management and invite UI

Implemented in [src/app/(dashboard)/settings/team/page.tsx](../src/app/(dashboard)/settings/team/page.tsx).

What is working:
- The team page exists and includes a visible heading and invite action.
- There is a modal for inviting members.

Current limitation:
- The page currently mocks team-management behavior and surfaces a toast stating that the invitation endpoint is not yet available.
- Pending invitations and member lists are not yet backed by a real data source.

Compliance assessment:
- Partially compliant.
- The shell and experience are present, but the implementation does not yet fully satisfy a production-ready team-management spec.

### 7. Reports and audit access

Implemented in:
- [src/app/(dashboard)/reports/page.tsx](../src/app/(dashboard)/reports/page.tsx)
- [src/app/(dashboard)/reports/audit/page.tsx](../src/app/(dashboard)/reports/audit/page.tsx)

What is working:
- The reports hub exposes the expected cards and links.
- The audit dashboard page is reachable and displays audit-related information.
- The navigation from the dashboard to audit and reports is consistent with the onboarding and post-onboarding workflow.

Compliance assessment:
- Strong alignment with the specification.

## Areas to Improve

### 1. Make the welcome onboarding phase reachable

The current onboarding page defines a separate welcome phase, but the initial component state is set to `wizard`, so that screen is effectively not reached in the current implementation.

Recommendation:
- Either wire the welcome phase into the intended user journey or remove it to avoid confusion.

### 2. Finish the team invite experience

The team page currently renders a basic UI, but invitation actions are mocked with a placeholder toast.

Recommendation:
- Connect the team page to the backend invitation endpoints once support is available.
- Ensure pending invites and staff membership data render from real API responses.

### 3. Strengthen post-onboarding completion states

The onboarding completion screen and welcome banner are present in the code, but their activation paths are not fully aligned with the intended experience.

Recommendation:
- Ensure the completion and welcome transitions appear in the flow as designed, especially after first-login onboarding.

### 4. Keep E2E selectors resilient

The current Playwright selectors target visible headings and button labels that are appropriate for the current UI. Preserving these stable selectors is important for the onboarding regression suite.

Recommendation:
- Keep headings such as `Import your asset register`, `Team members`, `Reports`, `Good ...`, and role-specific dashboard headings as stable anchors in tests.

## Overall Assessment

The frontend currently delivers a strong implementation of the core AssetFlow onboarding and invited-user flow:

- Registration and onboarding are well covered.
- Invited-staff acceptance is implemented.
- Role-specific dashboards are present and aligned with the intended experience.
- Reports and audit entry points are accessible and coherent.

The primary gaps are in the completeness of the post-onboarding experience and the maturity of the team-invite management experience, rather than in the core onboarding route structure itself.

## Suggested Compliance Rating

- Core onboarding flow: 90%
- Invite acceptance flow: 85%
- Role-based dashboard routing: 90%
- Team management experience: 60%
- Overall frontend alignment with the stated workflow: 85%
