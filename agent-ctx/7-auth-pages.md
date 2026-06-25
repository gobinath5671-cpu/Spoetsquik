# Task 7 — Auth Pages (LoginPage + RegisterPage)

Agent: full-stack-developer (auth pages)
Task ID: 7

## What was built
- `src/components/auth/LoginPage.tsx` — unified login (admin + student), Bebas Neue "SPORTSFEST" hero, glass card with email/password, admin demo click-to-fill chip, role-based redirect (admin → `admin-dashboard`, student → `user-home`)
- `src/components/auth/RegisterPage.tsx` — student registration, "JOIN THE ARENA" hero, 2-col glass form (Full Name, Email, Phone, Password+Confirm, College, Department, Roll No, Year select, Section select), client validation, on success auto-login + navigate to `user-home`
- `src/app/api/auth/login/route.ts` — RESTORED (was missing from disk despite being in worklog). GET (session check) + POST (email/password, scrypt verify, sets session cookie, returns full user payload with `role`).

## Patterns used
- `useAuthStore.setUser(data)` + `useUIStore.navigate(view)` for post-auth routing
- `useUIStore.pushToast({type, message})` for feedback
- `api("/api/auth/login" | "/api/auth/register", {method, body})` from `@/lib/api`
- `GlassCard` with `liquid` + `glow` for premium shimmer + glow
- Strict B&W theme tokens (`bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`) — no indigo/blue
- Fonts: `font-display` (Bebas Neue) for headlines, `font-accent` (Cormorant italic) for taglines, `font-mono` (JetBrains) for codes/credentials

## Lint status
- My two auth files: clean (0 errors, 0 warnings)
- Pre-existing issues in other agents' files: `EventCard.tsx` (warning), `user/UserHome.tsx` (setState-in-effect error) — out of scope

## Integration note for next agent
Wire into `src/app/page.tsx`:
```tsx
import { LoginPage } from "@/components/auth/LoginPage";
import { RegisterPage } from "@/components/auth/RegisterPage";
// inside the view switch:
case "login": return <LoginPage />;
case "register": return <RegisterPage />;
```
The default `view` in `ui-store` is `"login"` so the app boots straight into LoginPage.
