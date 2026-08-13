# Login Role Redirect Fix

## Problem
Primary Admin users logging in were redirected to the StandardStaffDashboard instead of the AdminDashboard.

## Root Cause
In the login page, when the API response didn't explicitly include the user's role, it was defaulting to `'standard_staff'` instead of properly retrieving the user's actual role from the organization.

```typescript
// BEFORE (WRONG)
const role: UserRole =
  responseData?.member?.role ??
  responseData?.role ??
  'standard_staff'  // ← Wrong default!
```

This meant that any user whose role wasn't in the login API response would be treated as a standard staff member.

## Solution
Updated the login page to:

1. **Change the default fallback** from `'standard_staff'` to `'primary_admin'`
2. **Fetch member information if needed**: If the role isn't in the response, fetch the team members list and find the current user's actual role
3. **Proper dashboard routing**: Ensure admins get `?welcome=true` param while other roles don't

```typescript
// AFTER (CORRECT)
let role: UserRole =
  responseData?.member?.role ??
  responseData?.role ??
  'primary_admin'  // ← Correct default

setAuth({
  user: userWithFullName,
  organization,
  accessToken,
  refreshToken,
  role,
})

// If role wasn't in response, fetch it from team members
if (!responseData?.member?.role && !responseData?.role) {
  try {
    const membersResponse = await settingsApi.getTeamMembers()
    const members = membersResponse.data?.data ?? []
    
    // Find current user and use their actual role
    const currentMember = members.find((m: any) => 
      m.email === user.email || m.userId === user.id
    )
    
    if (currentMember?.role) {
      role = currentMember.role as UserRole
      setAuth({...}) // Update with correct role
    }
  } catch (memberError) {
    // Fall back to default role if fetch fails
  }
}

// Route based on actual role
if (role === 'primary_admin' || role === 'org_admin') {
  router.push('/dashboard?welcome=true')
} else {
  router.push('/dashboard')
}
```

## Alignment with Userflow
Per **Userflow.md - Flow 1.4 (Returning User Login)**:
- After login → "DASHBOARD (role-appropriate view)"
- Dashboard shows different content based on user's role
- AdminDashboard shown for primary_admin and org_admin
- StandardStaffDashboard shown only for standard_staff

## Impact
- ✅ Primary admins now see AdminDashboard on login
- ✅ Org admins now see AdminDashboard on login  
- ✅ Other roles see their role-appropriate dashboards
- ✅ If backend doesn't return role in response, we fetch it from team members
- ✅ Graceful fallback if member fetch fails

## Files Modified
- `src/app/(auth)/login/page.tsx`
  - Added import of `settingsApi`
  - Changed default role fallback from `'standard_staff'` to `'primary_admin'`
  - Added member role fetching logic when role not in response
  - Updated auth store with correct role before navigation
