# ═══════════════════════════════════════════════════════════════
# SPORTSFEST — INTER-COLLEGE SPORTS EVENTS PORTAL
# MASTER ENGINEERING & DESIGN PROMPT
# Prepared by: Senior Prompt Engineer
# Stack: MERN (MongoDB · Express.js · React.js · Node.js)
# ═══════════════════════════════════════════════════════════════

---

## 0. MISSION STATEMENT

Build a full-stack **Inter-College Sports Events Portal** called **SportsFest**.
The platform has two distinct panels:

| Panel | Purpose |
|---|---|
| **Admin Panel** | Authorized admin feeds upcoming sports events from colleges/schools |
| **User Panel** | Students browse, filter, and register for sports events |

The entire platform uses a **strict Black & White theme** with
**liquid glassmorphism effects**, a **macOS-style dock navigation**,
**dark/light mode toggle**, and **premium custom typography**.

---

## 1. TECH STACK

| Layer | Technology |
|---|---|
| Frontend | React.js (Vite) + React Router v6 |
| Styling | Tailwind CSS v3 + custom CSS for glassmorphism |
| State Management | Zustand (lightweight, no Redux boilerplate) |
| Backend | Node.js + Express.js |
| Database | MongoDB (Mongoose ODM) |
| Authentication | JWT (access token + refresh token) + bcryptjs |
| File Uploads | Multer (ID card image upload) |
| Email | Nodemailer (registration confirmation emails) |
| PDF Export | jsPDF + jsPDF-autotable (registration slip) |
| QR Code | qrcode npm package (unique QR per registration) |
| Deployment | Frontend → Vercel · Backend → Render · DB → MongoDB Atlas |
| Version Control | Git + GitHub (main / dev / feature/* branches) |

---

## 2. DESIGN SYSTEM

### 2.1 Color Palette (Black & White Core)

```
--color-white:        #FFFFFF
--color-off-white:    #F5F5F5
--color-light-gray:   #E0E0E0
--color-mid-gray:     #9E9E9E
--color-dark-gray:    #1A1A1A
--color-pure-black:   #000000
--color-glass-white:  rgba(255,255,255,0.08)
--color-glass-border: rgba(255,255,255,0.18)
--color-glass-dark:   rgba(0,0,0,0.35)
--color-accent:       #FFFFFF  (white glow in dark mode)
--color-accent-dark:  #111111  (black shadow in light mode)
```

### 2.2 Typography — Font Roles

Use these Google Fonts. Import all via `@import` in `index.css`:

| Role | Font Family | Use Case |
|---|---|---|
| Display / Hero | `Bebas Neue` | Big headings, event titles, score counters |
| UI / Body | `Space Grotesk` | Paragraphs, labels, body text |
| Accent / Stylistic | `Cormorant Garamond` | Taglines, quotes, sub-headings |
| Data / Mono | `JetBrains Mono` | Dates, IDs, roll numbers, code/form data |
| Decorative | `Playfair Display` | Admin panel section headers |

```css
/* import example */
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;1,300&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:wght@500;700&display=swap');
```

### 2.3 Glassmorphism Card Mixin

```css
.glass-card {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* Light mode override */
[data-theme="light"] .glass-card {
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

### 2.4 Liquid Glass Effect

Apply a subtle animated shimmer sweep on glass cards:

```css
.glass-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    rgba(255,255,255,0.12) 0%,
    transparent 50%,
    rgba(255,255,255,0.04) 100%
  );
  pointer-events: none;
}
```

### 2.5 macOS-Style Dock Navigation

- Fixed at bottom of screen
- Icons magnify on hover (scale + translate-Y) using CSS transitions
- Glass background with blur
- Shows tooltip label above each icon on hover
- Icons: Home, Events, My Registrations, Profile, Logout (user side)
- Icons: Dashboard, Add Event, All Events, Registrations, Logout (admin side)

```css
.dock {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  padding: 10px 20px;
  background: rgba(255,255,255,0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 24px;
  z-index: 1000;
}

.dock-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s;
}

.dock-icon:hover {
  transform: scale(1.45) translateY(-10px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}
```

### 2.6 Dark / Light Mode Toggle

- Toggle switch (sun/moon icon) fixed at top-right corner
- Store preference in `localStorage`
- `data-theme` attribute on `<html>` tag drives all CSS variable swaps
- Default: Dark mode

---

## 3. ROUTE TREE

```
/                         → Redirect based on auth state
/login                    → Unified Login Page (Admin or User)
/register                 → User First-Time Registration

/user/                    → User Panel (Protected)
  home                    → Events feed (latest first)
  events                  → All events with full filter panel
  events/:id              → Single event detail page
  events/:id/apply        → Student registration form
  my-registrations        → Registered events list
  profile                 → User profile & settings

/admin/                   → Admin Panel (Protected — Admin only)
  dashboard               → Stats overview
  add-event               → Feed new event form
  events                  → All events table (Edit / Delete)
  events/:id/edit         → Edit existing event
  registrations           → View all student registrations
  registrations/:eventId  → Registrations per event (with export)
```

---

## 4. AUTHENTICATION SYSTEM

### 4.1 Login Page (`/login`)

- Clean full-screen page
- `Bebas Neue` large heading: **"SPORTSFEST"**
- Sub: `"Inter-College Sports Events Portal"` in `Cormorant Garamond`
- Single glass card in center with:
  - Email input
  - Password input
  - "Login" button
  - "New here? Register" link (→ `/register`)
- On submit: backend detects if credentials match admin → routes to `/admin/dashboard`
  else → routes to `/user/home`

### 4.2 Admin Credentials (Hardcoded in `.env`)

```env
ADMIN_EMAIL=gobinath5671@gmail.com
ADMIN_PASSWORD=Gobin@th.31
```

> Admin password is also bcrypt-hashed and stored in DB on first server start (seed script).
> Admin cannot self-register; credentials are controlled via `.env`.

### 4.3 User Registration (`/register`)

First-time flow:
- Full Name
- Email
- College Name
- Department, Year, Section
- Roll Number
- Password (+ Confirm Password)
- Phone Number

After register → auto-login → `/user/home`

On subsequent visits → `/login` → enter email + password → `/user/home`

### 4.4 JWT Strategy

- `accessToken` (expires: 1h) — stored in `httpOnly` cookie
- `refreshToken` (expires: 7d) — stored in `httpOnly` cookie
- `/auth/refresh` endpoint silently refreshes access token
- Axios interceptor in frontend handles 401 → auto-refresh → retry request

---

## 5. DATABASE SCHEMA (MongoDB / Mongoose)

### 5.1 `users` Collection

```js
{
  _id: ObjectId,
  fullName: String,           // required
  email: { type: String, unique: true, required: true },
  passwordHash: String,       // bcrypt
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  collegeName: String,
  department: String,
  year: String,
  section: String,
  rollNumber: String,
  phone: String,
  profilePicture: String,     // URL (optional)
  createdAt: Date,
  updatedAt: Date
}
```

### 5.2 `events` Collection

```js
{
  _id: ObjectId,
  collegeName: { type: String, required: true },
  eventName: { type: String, required: true },
  eventDate: { type: Date, required: true },
  reportingTime: String,                   // e.g. "8:30 AM"
  venue: String,                           // Ground / Indoor Stadium / Specific Court
  chiefGuest: String,
  categories: [{ type: String, enum: ['Men', 'Women', 'Both'] }],
  sportsAndGames: [String],                // array of sport names
  tournamentFormat: { type: String, enum: ['Knockout', 'League', 'Athletics', 'Mixed'] },
  eligibility: String,
  prizes: {
    cashPrizes: String,
    medals: Boolean,
    overallChampionship: Boolean,
    details: String
  },
  entryFee: {
    perTeam: Number,
    perPlayer: Number,
    isFree: Boolean
  },
  generalRules: String,
  dresscode: String,
  registrationDeadline: Date,
  registrationLink: String,               // external link (optional)
  contactDetails: {
    physicalDirectorName: String,
    physicalDirectorPhone: String,
    sportsCapitainName: String,
    sportsCapitainPhone: String,
    email: String
  },
  eventPoster: String,                    // uploaded image URL (optional)
  status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' },
  targetAudience: { type: String, enum: ['College', 'School', 'Both'] },
  createdBy: { type: ObjectId, ref: 'User' },
  createdAt: Date,
  updatedAt: Date
}
```

### 5.3 `registrations` Collection

```js
{
  _id: ObjectId,
  eventId: { type: ObjectId, ref: 'Event', required: true },
  studentId: { type: ObjectId, ref: 'User' },   // if logged in
  registrationCode: String,                      // unique auto-generated e.g. "SF-2025-00123"
  qrCodeData: String,                            // base64 QR image

  // Student info at time of registration (snapshot)
  fullName: { type: String, required: true },
  rollNumber: { type: String, required: true },
  department: String,
  year: String,
  section: String,
  collegeName: String,
  selectedSport: { type: String, required: true },
  eventCategory: String,                         // e.g. "Badminton Singles", "100m Sprint"
  teamDetails: {
    isTeamGame: Boolean,
    teamName: String,
    captainName: String,
    members: [String]
  },
  idCardUrl: String,                             // Multer uploaded image path
  contactNumber: { type: String, required: true },
  emailId: { type: String, required: true },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  medicalDeclaration: {
    fitnessConfirmed: Boolean,
    bloodGroup: String
  },
  paymentReceipt: {
    transactionId: String,
    receiptUrl: String,
    isPaid: Boolean
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  appliedAt: Date,
  updatedAt: Date
}
```

---

## 6. BACKEND API — EXPRESS.JS

### 6.1 Auth Routes `/api/auth`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/register` | User registration | Public |
| POST | `/login` | Login (admin + user) | Public |
| POST | `/logout` | Clear cookies | Private |
| POST | `/refresh` | Refresh access token | Private |
| GET | `/me` | Get current user info | Private |

### 6.2 Event Routes `/api/events`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/` | Get all events (with filters) | Public |
| GET | `/:id` | Get single event details | Public |
| POST | `/` | Create new event | Admin only |
| PUT | `/:id` | Update event | Admin only |
| DELETE | `/:id` | Delete event | Admin only |
| PATCH | `/:id/status` | Toggle status (upcoming/ongoing/completed) | Admin only |
| GET | `/stats/overview` | Events count by status | Admin only |

#### Filter Query Params for `GET /api/events`:
```
?status=upcoming|ongoing|completed
?sport=cricket|football|...
?targetAudience=College|School|Both
?date=2025-07-15           (exact date)
?fromDate=...&toDate=...   (date range)
?college=<name>
?format=Knockout|League|Athletics
?search=<keyword>          (eventName or collegeName)
?page=1&limit=12           (pagination)
?sortBy=date|createdAt&order=asc|desc
```

### 6.3 Registration Routes `/api/registrations`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/:eventId` | Register student for event | User (logged in) |
| GET | `/my` | Get current user's registrations | User |
| GET | `/event/:eventId` | All registrations for an event | Admin |
| GET | `/` | All registrations (with search/filter) | Admin |
| PATCH | `/:id/status` | Approve / Reject registration | Admin |
| GET | `/:id/receipt` | Download registration PDF | User |
| GET | `/event/:eventId/export` | Export as CSV or text file | Admin |

### 6.4 User Routes `/api/users`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/profile` | Get own profile | User |
| PUT | `/profile` | Update profile | User |
| POST | `/profile/picture` | Upload profile picture | User |
| GET | `/` | Get all users | Admin |

### 6.5 Upload Route `/api/upload`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/id-card` | Upload student ID card image (Multer) |
| POST | `/event-poster` | Upload event poster image (Admin) |

### 6.6 Backend Middleware

- `authMiddleware` — verify JWT from httpOnly cookie
- `adminMiddleware` — check `role === 'admin'`
- `rateLimiter` — express-rate-limit (100 req/15min per IP)
- `helmet` — security headers
- `cors` — allow frontend origin only
- `morgan` — HTTP logging
- `errorHandler` — global error middleware with consistent JSON error shape

---

## 7. ADMIN PANEL — UI & FEATURES

### 7.1 Dashboard (`/admin/dashboard`)

Glass cards showing live stats:
- Total Events | Upcoming | Ongoing | Completed
- Total Registrations | Pending | Approved | Rejected
- Recent 5 events (mini table)
- Recent 5 registrations (mini table)
- Quick action buttons: "+ Add Event", "View All Registrations"

Font: `Playfair Display` for section headers, `Space Grotesk` for data.

### 7.2 Add Event Form (`/admin/add-event`)

Multi-step glass form (4 steps with progress bar):

**Step 1 — Basic Info**
- College Name (text input)
- Event Name (text input)
- Event Date (date picker)
- Reporting Time (time picker)
- Target Audience (College / School / Both — radio buttons)
- Event Poster Upload (image, optional)

**Step 2 — Venue & People**
- Venue (Ground / Indoor Stadium / Specific Court / Custom — with free-text)
- Chief Guest / Inaugurator (text input)
- Categories (Men / Women / Both — multi-select checkboxes)
- Contact: Physical Director Name + Phone
- Contact: Student Sports Captain Name + Phone
- Contact Email

**Step 3 — Sports & Format**
- Which Games Available:
  - Checkbox grid: Basketball, Football, Soccer, Volleyball, Track & Field, Baseball, Swimming, Badminton, Tennis, Cricket
  - "+ Add Custom Sport" (free text entry, push to array)
- Tournament Format (Knockout / League / Athletics / Mixed — radio)
- Eligibility / Target Audience (textarea)

**Step 4 — Fees, Prizes & Deadline**
- Entry Fee:
  - Toggle: Free / Paid
  - If Paid: Per Team (₹) + Per Player (₹)
- Prizes & Trophies:
  - Cash Prizes (text)
  - Medal toggle
  - Overall Championship toggle
  - Prize Details (textarea)
- General Rules (textarea with markdown support, preview toggle)
- Kit / Dress Code (text input)
- Registration Deadline (date + time picker)
- External Registration Link (URL, optional)

**Form Actions:** Save as Draft | Publish Event

### 7.3 All Events Table (`/admin/events`)

- Searchable, sortable table
- Columns: College · Event Name · Date · Sports · Status · Registrations Count · Actions
- Actions per row: View · Edit · Delete · Toggle Status
- Bulk actions: Select All → Delete / Export
- Pagination (10 per page)

### 7.4 Registrations View (`/admin/registrations`)

- Master table: All registrations across all events
- Filter by: Event · Status (Pending / Approved / Rejected) · Date
- Per registration row: Student Name, Roll No, Sport, Event, Applied On, Status, Actions
- Actions: Approve ✓ | Reject ✗ | View Full Details
- Per Event view: `/admin/registrations/:eventId`
  - Shows all registrations for that event
  - Export button: download as `.txt` file (formatted) or `.csv`

**Text File Export Format:**
```
SPORTSFEST — REGISTRATIONS EXPORT
Event: [Event Name] | [College Name] | [Date]
Generated: [Timestamp]
═══════════════════════════════════════
#1
Name: [Full Name]
Roll No: [Roll Number]
Dept/Year/Sec: [Department] [Year] [Section]
College: [College Name]
Sport: [Sport] — [Category]
Team: [Team Name] | Captain: [Captain Name]
Contact: [Phone] | [Email]
Emergency: [Name] — [Phone]
Blood Group: [Blood Group]
Payment: [Transaction ID / FREE]
Status: [APPROVED / PENDING / REJECTED]
Registration Code: SF-2025-XXXXX
───────────────────────────────────────
```

---

## 8. USER PANEL — UI & FEATURES

### 8.1 Home Page (`/user/home`)

- Full-screen **hero section** with animated text:
  - Big `Bebas Neue` headline: `"PLAY. COMPETE. WIN."`
  - Sub: `"Stay updated on every inter-college sports event near you"`
- Below hero: **"Latest Events"** — horizontal scrollable card row of 6 newest events
- Below that: **"Upcoming This Week"** — grid of cards
- **Floating Search Bar** (sticky top) — search by event name or college

### 8.2 Events Page (`/user/events`)

#### Filter Sidebar (left, collapsible on mobile):

| Filter | Options |
|---|---|
| Status | Upcoming / Ongoing / Completed (Finished / Past) |
| Target Audience | All / College / School |
| Sports | Checkbox list of all unique sports in DB |
| Tournament Format | Knockout / League / Athletics |
| Date Range | From Date — To Date picker |
| College | Searchable dropdown (all unique colleges) |
| Entry Fee | Free / Paid |

Filter pills shown above results. "Clear All" button.

#### Event Cards (right, grid 3-col desktop / 2-col tablet / 1-col mobile):

Each card (glass morphism):
- Event Poster (if uploaded) or sport icon placeholder
- College Name (top badge)
- Event Name (`Bebas Neue` large)
- Date + Reporting Time (JetBrains Mono)
- Venue pill
- Sport tags (max 3 shown + "+N more")
- Status badge (color: white glow = upcoming, gray = ongoing, dim = completed)
- "View Details →" button

#### Sort Options:
- Newest First | Oldest First | Date (Ascending) | Date (Descending)

### 8.3 Event Detail Page (`/user/events/:id`)

Full detail view:
- Event poster (if exists) as hero image with overlay text
- All event info displayed in organized glass panels:
  - Basic Info panel
  - Sports & Format panel
  - Prizes panel
  - Rules & Dress Code panel (markdown rendered)
  - Contact panel
- Countdown timer to event date (`JetBrains Mono` font)
- "Apply Now" button (→ `/user/events/:id/apply`) — disabled if deadline passed
- "Save Event" bookmark icon (stores in user profile)
- Share button (copy link / share native on mobile)

### 8.4 Event Registration Form (`/user/events/:id/apply`)

Glass form. Fields (all from the 10-point checklist):

1. **Full Name & Roll Number** — prefilled from user profile (editable)
2. **Department, Year & Section** — prefilled (editable)
3. **College Name** — prefilled (editable for inter-college context)
4. **Selected Sport** — dropdown of available sports in this event
   - **Specific Event Category** — dynamic sub-options (Singles/Doubles/100m etc.)
5. **Team Details** — shown only if selected sport is team-based:
   - Is this a team game? (toggle)
   - Team Name
   - Captain's Name
   - Members (dynamic add/remove fields)
6. **Valid College ID Card** — file upload (image, max 5MB) via Multer
7. **Student Contact Number & Email ID** — prefilled (editable)
8. **Emergency Contact** — Parent/Guardian Name + Phone + Relation
9. **Medical Fitness Declaration:**
   - Checkbox: "I declare I am medically fit to participate"
   - Blood Group (dropdown)
10. **Registration Fee:**
    - If event is free: "No entry fee required" message
    - If paid: Transaction ID input + Upload Payment Receipt (image)

**Submit** → Show confirmation modal with:
- Registration Code (e.g. `SF-2025-00123`)
- QR Code (unique to this registration)
- Option to Download PDF Slip
- Option to Download as Text File

### 8.5 My Registrations (`/user/my-registrations`)

- Cards for each registered event
- Status badge: Pending / Approved / Rejected
- Shows: Event Name, Date, Sport, Registration Code
- "Download Slip" button (PDF)
- "View QR Code" button

### 8.6 Profile Page (`/user/profile`)

- Display + edit user info
- Profile picture upload
- Bookmarked events list
- Change password section

---

## 9. ADDITIONAL FEATURES (Senior PE Additions)

### 9.1 Real-Time Status Auto-Update

Backend cron job (node-cron) runs every hour:
- If `eventDate < now` and `status === 'upcoming'` → set `status = 'ongoing'`
- If `eventDate < now - 1day` → set `status = 'completed'`

### 9.2 Event Countdown Timer

On event detail page, JavaScript `setInterval` countdown (days:hours:minutes:seconds)
displayed in `JetBrains Mono`. Hides when event starts.

### 9.3 Search Autocomplete

Live search bar (top of events page) with debounce (300ms).
Calls `GET /api/events?search=<query>&limit=5` and shows dropdown suggestions.

### 9.4 QR Code Registration Verification

- Each approved registration gets a unique QR code
- QR encodes: `SF-<eventId>-<registrationId>-<registrationCode>`
- Admin can scan QR (using phone camera) to verify on event day
- Future scope: QR scanner page in admin panel

### 9.5 PDF Registration Slip

Using `jsPDF`:
- SportsFest logo / header
- Student name, roll no, college
- Event details
- Sport and category
- Registration Code (large, bold)
- QR Code embedded
- "This slip must be presented at the venue" footer

### 9.6 Email Confirmation (Nodemailer)

Trigger email on:
1. User Registration → Welcome email
2. Event Registration Submitted → "Your registration is under review"
3. Registration Approved → "Congratulations! You are registered for [Event]" + PDF attached
4. Registration Rejected → "Unfortunately your registration was not approved" + reason

### 9.7 Bookmarks / Save Events

- Bookmark icon on every event card and detail page
- Stored in user's profile in MongoDB (`savedEvents: [ObjectId]`)
- Accessible from Profile page

### 9.8 Toast Notification System

Custom toast component (no external lib needed):
- Success (white) / Error (dark) / Info (gray)
- Slide-in from top-right, auto-dismiss after 3s

### 9.9 Skeleton Loaders

Every list (events, registrations) shows glass skeleton cards while API loads.
No blank screens.

### 9.10 Responsive Design

- Mobile-first Tailwind classes
- Dock hides labels on mobile, shows only icons
- Filter sidebar becomes a bottom sheet on mobile
- All tables become card lists on mobile

### 9.11 404 & Empty States

- Custom 404 page with `Bebas Neue` large "404" text
- Empty state illustrations for empty events list, empty registrations

### 9.12 Admin Event Duplicate

"Duplicate Event" button in admin events table — creates a copy of an event with a new date field blank, for recurring annual events.

### 9.13 Sports Category Intelligence

When admin selects a sport (e.g. "Badminton"), the Event Category sub-field
in the student form auto-populates with smart defaults:
- Badminton → Singles, Doubles, Mixed Doubles
- Football → Team (11-a-side), Team (7-a-side)
- Track & Field → 100m, 200m, 400m, 800m, 1500m, 4x100m Relay, Long Jump, High Jump, Shot Put, Javelin Throw
- Cricket → Team (11-a-side)
- etc.

### 9.14 Progressive Web App (PWA)

Add `manifest.json` + service worker for:
- "Add to Home Screen" on mobile
- Offline fallback page

---

## 10. FOLDER STRUCTURE

```
sportsfest/
├── client/                          # React (Vite)
│   ├── public/
│   │   └── manifest.json
│   ├── src/
│   │   ├── assets/                  # Fonts, icons, images
│   │   ├── components/
│   │   │   ├── common/              # Button, Input, Modal, Toast, Skeleton, Badge
│   │   │   ├── layout/              # Dock, Navbar, ThemeToggle, Layout
│   │   │   ├── cards/               # EventCard, RegistrationCard
│   │   │   └── forms/               # EventForm (multi-step), RegistrationForm
│   │   ├── pages/
│   │   │   ├── auth/                # Login.jsx, Register.jsx
│   │   │   ├── user/                # Home, Events, EventDetail, Apply, MyRegs, Profile
│   │   │   └── admin/               # Dashboard, AddEvent, EditEvent, AllEvents, AllRegs
│   │   ├── store/                   # Zustand stores: authStore, eventStore, uiStore
│   │   ├── hooks/                   # useAuth, useEvents, useRegistration, useTheme
│   │   ├── services/                # axios instance, api.js
│   │   ├── utils/                   # formatDate, generateQR, downloadPDF, exportTxt
│   │   ├── styles/                  # global.css, glass.css, dock.css, fonts.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                          # Node + Express
│   ├── config/
│   │   ├── db.js                    # MongoDB connection
│   │   └── mailer.js                # Nodemailer setup
│   ├── models/
│   │   ├── User.model.js
│   │   ├── Event.model.js
│   │   └── Registration.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── event.routes.js
│   │   ├── registration.routes.js
│   │   ├── user.routes.js
│   │   └── upload.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── event.controller.js
│   │   ├── registration.controller.js
│   │   └── user.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── admin.middleware.js
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js
│   ├── utils/
│   │   ├── generateToken.js
│   │   ├── generateCode.js          # SF-2025-XXXXX generator
│   │   ├── generateQR.js
│   │   ├── exportToText.js
│   │   └── emailTemplates.js
│   ├── jobs/
│   │   └── eventStatusCron.js       # node-cron status updater
│   ├── seeds/
│   │   └── adminSeed.js             # Seed admin from .env
│   ├── uploads/                     # Multer storage directory
│   ├── .env
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 11. ENVIRONMENT VARIABLES

### `server/.env`

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/sportsfest
JWT_ACCESS_SECRET=<strong_random_secret>
JWT_REFRESH_SECRET=<another_strong_secret>
JWT_ACCESS_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d
ADMIN_EMAIL=gobinath5671@gmail.com
ADMIN_PASSWORD=Gobin@th.31
CLIENT_URL=http://localhost:5173
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<your_gmail>
EMAIL_PASS=<app_password>
EMAIL_FROM=SportsFest <noreply@sportsfest.in>
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

### `client/.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 12. GITHUB BRANCHING STRATEGY

```
main          ← Production-ready, only merged via PR
dev           ← Integration branch
feature/*     ← All new features (e.g. feature/admin-event-form)
fix/*         ← Bug fixes
hotfix/*      ← Critical production fixes
```

Commit message convention: `type(scope): message`
```
feat(auth): add JWT refresh token rotation
fix(events): correct filter by date range
style(ui): update dock hover animation
docs: update README with deployment steps
```

---

## 13. DEPLOYMENT CHECKLIST

| Service | Platform | Notes |
|---|---|---|
| MongoDB | MongoDB Atlas | Free M0 cluster, whitelist all IPs (0.0.0.0) |
| Backend | Render (free tier) | Set all env vars in Render dashboard |
| Frontend | Vercel | Set `VITE_API_BASE_URL` to Render URL |
| File Uploads | Cloudinary (recommended) | Replace local Multer storage for production |

### Vercel `vercel.json` (for SPA routing):

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 14. README.MD STRUCTURE

```markdown
# SportsFest — Inter-College Sports Events Portal

## 🏆 Live Demo
[Live Link Here]

## 📋 Overview
[Brief description]

## 🛠️ Tech Stack
[Table]

## 🚀 Local Setup
### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### Clone & Install
\`\`\`bash
git clone https://github.com/<org>/sportsfest.git
cd sportsfest
# Install server deps
cd server && npm install
# Install client deps
cd ../client && npm install
\`\`\`

### Configure Environment
[Instructions to copy .env.example]

### Run Dev
\`\`\`bash
# Terminal 1 — Backend
cd server && npm run dev
# Terminal 2 — Frontend
cd client && npm run dev
\`\`\`

## 📡 API Endpoints
[Full table of all endpoints]

## 🗂️ Architecture
[ERD diagram and folder structure]

## 👥 Team
[Names and roles]
```

---

## 15. QUALITY GATES BEFORE FINAL SUBMISSION

- [ ] All API routes return consistent `{ success, data, message }` shape
- [ ] 401/403/404/500 errors all handled globally
- [ ] All forms have client-side + server-side validation
- [ ] Admin panel is inaccessible to student accounts (middleware enforced)
- [ ] File uploads limited to images only (mime-type check in Multer)
- [ ] No raw passwords in DB (all bcrypt hashed)
- [ ] No JWT secrets in frontend code
- [ ] Mobile responsive: tested on 375px width
- [ ] Dark mode + Light mode both fully functional
- [ ] Countdown timer stops and shows "Event Started" when date passes
- [ ] Empty state UI for no events / no registrations
- [ ] Registration disabled after deadline passes
- [ ] CORS configured for production URL only in production

---

## 16. FUTURE SCOPE (Post-Internship Enhancements)

- Live score updates (WebSocket / Socket.IO)
- Notification system (in-app + push via Firebase)
- College leaderboard / overall championship points tracker
- Student achievement badges (participated, won, runner-up)
- Event gallery (post-event photo uploads)
- Admin multi-user (multiple colleges can have their own admin sub-accounts)
- Mobile app (React Native using same backend)
- Government sports events integration (API from SAI / local bodies)

---

*Prompt engineered for SportsFest Internship — Full Stack Development*
*This document is the single source of truth for the entire project.*
*All team members must read and align with this before writing any code.*
