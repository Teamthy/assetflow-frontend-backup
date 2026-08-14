# AssetFlow Onboarding and User-Flow Compliance Analysis

Date: 2026-07-15

## Scope

This document evaluates the current implementation of the AssetFlow client against the supplied onboarding and user-flow specification. The review focuses on the core onboarding paths for:

- Account creator onboarding
- Invited staff onboarding
- Import onboarding
- Role-based dashboard entry
- Core route coverage for the main product experience

## Executive Summary

Overall status: Partial compliance.

The product currently covers the core skeleton of the onboarding experience, but it does not yet fully match the strict flow described in the specification. The strongest areas are:

- Registration and login flow entry points
- A multi-step onboarding wizard for the primary admin
- Invitation acceptance and redirect to dashboard
- Role-based dashboard rendering for several user roles
- Asset import entry and import form flow

The biggest gaps are:

- The one-time welcome screen is not currently surfaced as designed
- The persistent onboarding checklist/banner is not implemented
- Invited staff do not receive a role-specific welcome experience or first-action guidance
- Team invitation management is mocked rather than fully wired to the product flow
- Several specification elements such as contextual onboarding tips, empty-state prompts, and richer import success experiences are not yet implemented

## Overall Compliance Score

| Area | Status | Notes |
|---|---|---|
| Registration and account creation | Partial | Register page exists and creates auth state, but not all spec wording and validation details are implemented |
| Welcome screen and setup guidance | Partial | Onboarding wizard exists, but the one-time welcome experience is not active in the current flow |
| Setup wizard | Partial | Basic four-step flow exists, but it does not fully reflect the spec’s richer policy and branch logic |
| Import onboarding | Partial | Import page exists and supports template/download/upload flow, but the experience is simpler than the spec |
| Invited staff flow | Partial | Accept-invite page exists and redirects to dashboard, but the richer staff welcome and role guidance are not implemented |
| Role-based dashboards | Partial | Role-based render exists for several roles, but the spec’s first-action prompts are not present |
| Team management flow | Weak | Team page exists, but invitation sending is mocked and not fully functional |
| Contextual onboarding and empty states | Weak | Not implemented in the current client |

## Compliance by Flow

### 1. Account Creator Onboarding

#### Status: Partial

Implemented:

- Registration page exists at [src/app/(auth)/register/page.tsx](../src/app/(auth)/register/page.tsx)
- Registration creates auth state and redirects into onboarding at [src/app/(onboarding)/onboarding/page.tsx](../src/app/(onboarding)/onboarding/page.tsx)
- The onboarding wizard includes four high-level steps: organization profile, accounting policy, branches, and assets
- The asset step routes to import at [src/app/(dashboard)/assets/import/page.tsx](../src/app/(dashboard)/assets/import/page.tsx)

Gaps:

- The spec expects a dedicated one-time welcome experience immediately after registration. The current onboarding page defaults to the wizard rather than surfacing the welcome screen first.
- The spec emphasizes a more polished setup flow with richer policy defaults, multi-branch logic, and a stronger “aha moment” around import. The current implementation is functional but slimmer.
- The spec expects a persistent setup checklist/banner on the dashboard. That is not present.

### 2. Invited Staff Onboarding

#### Status: Partial

Implemented:

- Invitation acceptance route exists at [src/app/(auth)/accept-invite/[token]/page.tsx](../src/app/(auth)/accept-invite/[token]/page.tsx)
- The page validates the invite token, shows organization and role, collects name/password, and sets auth before redirecting to the dashboard
- Role-based dashboard rendering is wired in [src/app/(dashboard)/dashboard/page.tsx](../src/app/(dashboard)/dashboard/page.tsx)

Gaps:

- The spec requires a more polished acceptance form with stronger messaging and clearer success state. The current UI is functional but not fully aligned with the intended experience.
- The spec expects a role-specific welcome screen after invite acceptance. This is not implemented.
- The spec expects role-specific first-action prompts on the dashboard. Those prompts are not present in the current implementation.

### 3. Import Onboarding Flow

#### Status: Partial

Implemented:

- The import route exists at [src/app/(dashboard)/assets/import/page.tsx](../src/app/(dashboard)/assets/import/page.tsx)
- The page includes template download, upload, preview, confirm, and results steps
- The flow supports file validation and import results feedback

Gaps:

- The spec expects a more guided and persuasive import experience, including stronger onboarding messaging and clearer “magic moment” framing.
- The current page does not include the richer preview summary and onboarding context messaging called for by the spec.
- The spec expects import success to lead into a highly structured next-step experience. That is only partially surfaced here.

### 4. Role-Based Dashboard Experience

#### Status: Partial

Implemented:

- Dashboard role mapping exists in [src/app/(dashboard)/dashboard/page.tsx](../src/app/(dashboard)/dashboard/page.tsx)
- Role-specific dashboard components are present for:
  - [src/components/dashboard/BranchManagerDashboard.tsx](../src/components/dashboard/BranchManagerDashboard.tsx)
  - [src/components/dashboard/FinanceDashboard.tsx](../src/components/dashboard/FinanceDashboard.tsx)
  - [src/components/dashboard/AuditorDashboard.tsx](../src/components/dashboard/AuditorDashboard.tsx)

Gaps:

- The spec expects strong role-specific first actions after onboarding. The current dashboards are mainly informational widgets and do not explicitly guide a new user to their first task.
- The spec expects a more tailored first-week experience. This is not yet implemented.

### 5. Team Management Flow

#### Status: Weak

Implemented:

- The team management page exists at [src/app/(dashboard)/settings/team/page.tsx](../src/app/(dashboard)/settings/team/page.tsx)
- The UI includes active members, pending invitations, and an invite modal

Gaps:

- The page is currently mocked. Invitation sending is not connected to the backend workflow described in the spec.
- The spec expects pending invitations, role-based management, and a proper invite lifecycle. The UI exists, but the product flow is not fully operational.

### 6. Contextual Onboarding and Empty States

#### Status: Weak

Implemented:

- Some empty states exist in shared UI patterns, but they are not tailored to the onboarding spec

Gaps:

- The spec expects context-aware onboarding tips on first visits to major sections such as assets, depreciation, and audit.
- The spec expects empty-state onboarding prompts for assets, branches, and maintenance. These are not fully implemented.
- The spec expects a persistent checklist. That is absent.

## Specific Compliance Findings

### What is already aligned well

1. The product has a clear primary-admin onboarding path.
2. The app routes users into onboarding after registration.
3. The import route is present and usable.
4. The invited-staff route is present and functional enough to complete an account creation flow.
5. Role-based dashboard entry is implemented.

### What still needs to be built to match the spec

1. One-time welcome screen after registration
2. Persistent onboarding progress/banner on the dashboard
3. Role-specific welcome screens after invitation acceptance
4. Role-specific “first actions” guidance on the dashboard
5. Stronger import experience aligned to the “Excel-first” onboarding philosophy
6. Real team invite lifecycle and management flow
7. Contextual onboarding prompts and empty-state guidance

## Recommended Priorities

### P0 — Must have for spec compliance

- Activate the one-time welcome experience after registration
- Implement the dashboard onboarding banner/checklist
- Build role-specific invited-staff welcome screens and first-action prompts
- Replace mocked team invitation behavior with real invite flow support

### P1 — High value improvements

- Strengthen the import experience with onboarding-oriented messaging and success guidance
- Add contextual tips on first visit to key sections
- Add onboarding-aware empty states for assets, branches, and maintenance

### P2 — Polish and maturity

- Add richer policy defaults and branch setup logic matching the spec more closely
- Improve copy, journey sequencing, and role-specific messaging

## Conclusion

The current implementation has a usable onboarding foundation, but it is not yet fully compliant with the approved onboarding philosophy and user-flow specification. The biggest gap is not technical capability; it is product flow completeness. The product currently supports the journey at a functional level, but the experience is still missing the more deliberate guidance, storytelling, and role-specific clarity that the spec demands.

If the goal is strict spec compliance, the next step should be to implement the missing onboarding experience layers in this order:

1. Welcome screen and dashboard onboarding banner
2. Invited-staff role-specific welcome experience
3. Real team invite flow
4. Contextual onboarding and empty-state prompts
5. Import experience polish
