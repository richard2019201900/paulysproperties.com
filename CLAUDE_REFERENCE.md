# PaulysProperties.com - Claude Reference Guide

> **INSTRUCTION TO CLAUDE:** Read this document completely before making any code changes.
> This project has 228+ commits of development history. Many bugs have been fixed - don't reintroduce them.

---

## 🎯 Project Overview

**PaulysProperties.com** is a Firebase-powered rental property management portal for **GTA V FiveM roleplay servers**.

### Key Context
- "Text in city" = Contact via in-game phone (not real phones)
- Currency is in-game money (GTA$)
- PMA = Property Management Authority (in-game government)
- Users are roleplayers managing virtual properties

### Links
- **Live Site:** https://richard2019201900.github.io/paulysproperties.com/
- **GitHub:** https://github.com/richard2019201900/paulysproperties.com

### Tech Stack
- **Frontend:** Vanilla JavaScript (NO frameworks)
- **Styling:** Tailwind CSS
- **Backend:** Firebase Firestore + Auth
- **Hosting:** GitHub Pages
- **Build Process:** NONE - direct file editing

---

## 📁 File Structure

```
paulysproperties.com/
├── index.html           # Main HTML - all page structure and modals
├── js/
│   ├── app.js           # Property details, stats page, inline editing
│   ├── ui.js            # Dashboard, admin panel, reports, modals
│   ├── services.js      # Firebase operations, TierService, data sync
│   ├── data.js          # Base properties (1-14), owner mappings
│   ├── components.js    # Photo services, reusable components
│   ├── notifications.js # Admin notification system
│   └── config.js        # Firebase configuration
├── styles.css           # Custom CSS beyond Tailwind
├── CLAUDE_REFERENCE.md  # This file
└── PROJECT_HISTORY.md   # Full 228-commit history
```

### File Responsibilities

| File | Contains |
|------|----------|
| **app.js** | `renderPropertyStatsContent()`, `startEditTile()`, `saveTileEdit()`, image management |
| **ui.js** | `renderOwnerDashboard()`, `renderProperties()`, admin panel, Elite Reports, user management |
| **services.js** | `PropertyDataService`, `TierService`, Firebase listeners, `saveAvailability()` |
| **data.js** | Base `properties[]` (IDs 1-14), `ownerPropertyMap`, `propertyOwnerEmail` |
| **components.js** | Photo services modal and promo bar |
| **notifications.js** | Admin notifications (new users, listings, upgrades, premium) |

---

## 🔑 Critical Concepts

### User Tiers
| Tier | Listings | Monthly Cost | Badge |
|------|----------|--------------|-------|
| Starter | 1 | Free | 🌱 |
| Pro | 3 | $25,000 | ⭐ |
| Elite | Unlimited | $50,000 | 👑 |
| Owner/Admin | ∞ | N/A | 👑 |

**Master Admin:** `richard2019201900@gmail.com`
**Check:** `TierService.isMasterAdmin(email)`

### Property Data Flow
```
Base Property (data.js IDs 1-14)
        ↓
User-created properties (settings/properties)
        ↓
Field overrides (settings/propertyOverrides)
        ↓
PropertyDataService.getValue(id, field, default)
        ↓
Final displayed value
```

### CRITICAL: Ownership vs Viewing
```javascript
// For VIEWING - admin sees ALL properties for management
getOwnerProperties()

// For FINANCIALS - only properties user actually OWNS
getOwnedProperties()
```

**Income tiles, reports, analytics MUST use `getOwnedProperties()`**

### Availability State
```javascript
// RENTED (occupied)
state.availability[propertyId] === false

// AVAILABLE (vacant)
state.availability[propertyId] === true  // or undefined
```

### Firestore Structure
```
settings/
├── properties           # {[id]: propertyData}
├── propertyAvailability # {[id]: true/false}
├── propertyOverrides    # {[id]: {field: value}}
├── ownerPropertyMap     # {[email]: [id1, id2]}
└── paymentHistory/      # Sub-docs per property

users/                   # User documents by UID
adminNotifications/      # Admin panel notifications
userNotifications/       # User dashboard notifications
upgradeHistory/          # Tier change audit log
photoServiceRequests/    # Photo service requests
```

---

## ⚠️ MANDATORY Rules

### 1. ALWAYS Validate Syntax
```bash
node -c filename.js
```
**Never deliver without syntax check.**

### 2. ALWAYS Copy to Output
```bash
cp /home/claude/file.js /mnt/user-data/outputs/file.js
```

### 3. Use Surgical Edits
- Use `str_replace` for targeted changes
- Read surrounding code BEFORE editing
- Don't rewrite entire functions unnecessarily

### 4. Respect Existing Patterns
- Use `$('elementId')` not `document.getElementById`
- Use `PropertyDataService.getValue()` for property data
- Use `showToast()` for notifications
- Use `openModal()`/`closeModal()` for modals

---

## 🐛 KNOWN BUGS - DO NOT REINTRODUCE

### 1. "444 Bug" (Commits d28ee98, 6c2f7d5, 5752170, 21ecf6b)
**Problem:** Properties show wrong data
**Cause:** Stale property overrides persist after deletion
**Solution:** Clear overrides when creating/deleting properties
```javascript
delete state.propertyOverrides[propertyId];
```

### 2. Availability Collection Bug (Commit a03fa56)
**Problem:** Availability doesn't sync
**Cause:** Auto-fix code wrote to WRONG collection
**Solution:** ALWAYS write to `propertyAvailability`, NEVER `propertyOverrides`
```javascript
// CORRECT
await db.collection('settings').doc('propertyAvailability').set(...)

// WRONG - DO NOT DO THIS
await db.collection('settings').doc('propertyOverrides').set(...)
```

### 3. Key Type Mismatch (Commit 123de4f)
**Problem:** Availability state corruption
**Cause:** Firestore keys are strings, JS uses numbers
**Solution:** Consistent key handling
```javascript
const id = parseInt(firestoreKey);
```

### 4. PropertyOverrides Parsing (Commit 0d0b74a)
**Problem:** Display data loss on page load
**Cause:** Incorrect parsing of flat Firestore structure
**Solution:** Proper nested object reconstruction in subscribeAll()

### 5. Faulty Deletion Listener (Commit 31401a6)
**Problem:** Properties disappearing
**Cause:** Overly aggressive deletion sync
**Solution:** Careful listener implementation with proper checks

### 6. Admin Financial Calculations (Commit f8a1d5b)
**Problem:** Admin sees ALL properties in income totals
**Cause:** Using getOwnerProperties() for financials
**Solution:** Use getOwnedProperties() for all financial calculations

---

## 🔧 Common Code Patterns

### Element Access
```javascript
const el = $('elementId');  // Custom function, NOT jQuery
```

### Property Data
```javascript
// Reading (ALWAYS use this)
const value = PropertyDataService.getValue(propertyId, 'fieldName', defaultValue);

// Finding property
const prop = properties.find(p => p.id === propertyId);
```

### Firestore Operations
```javascript
// Write with merge
await db.collection('settings').doc('docName').set({ 
    [key]: value 
}, { merge: true });

// Real-time listener (check for duplicates!)
if (window.someUnsubscribe) window.someUnsubscribe();
window.someUnsubscribe = db.collection(...).onSnapshot(...);
```

### Notifications
```javascript
showToast('Message', 'success');  // or 'error', 'info'
```

### Modals
```javascript
openModal('modalId');
closeModal('modalId');
```

### Admin Check
```javascript
if (TierService.isMasterAdmin(auth.currentUser?.email)) {
    // Admin-only code
}
```

### Email Normalization
```javascript
const email = user.email.toLowerCase();  // ALWAYS lowercase
```

---

## 📋 Common Tasks

### Adding Editable Field (Property Stats)
1. Add HTML in `app.js` → `renderPropertyStatsContent()`
2. Handle special types in `startEditTile()`
3. Add save logic in `saveTileEdit()`
4. Ensure Firestore persistence

### Adding Dashboard Tile
1. Find grid in `ui.js` → `renderOwnerDashboard()`
2. Add tile HTML with gradient + onclick
3. Add calculation in `calculateTotals()` if financial
4. Remember: use `getOwnedProperties()` for financials

### Adding Admin Notification
1. Create notification where event occurs
2. Add rendering in `renderAdminNotifications()`
3. Map badge color (blue=users, green=listings, amber=upgrades, gold=premium)
4. Add dismiss handler

### Modifying Financial Calculations
1. **MUST use `getOwnedProperties()`**
2. Update `calculateTotals()` in ui.js
3. Update breakdown panels if showing details
4. Update Elite Reports if affected

---

## 🚀 Deployment

User runs after receiving files:
```bash
cp ~/Downloads/app.js js/app.js
cp ~/Downloads/ui.js js/ui.js

git add .
git commit -m "Description of changes"
git push origin main
```

GitHub Pages auto-deploys (< 1 minute).

---

## 📊 Current Features

### Public
- Property browsing with filters
- Property detail pages with galleries
- Contact system (copy phone)
- Mobile responsive

### Owner Dashboard
- Income tiles (weekly/monthly) with flip breakdowns
- Property table with inline editing
- Payment tracking (frequency, last paid, due date)
- Reminder script generation
- Elite Reports (4 tabs)

### Admin Dashboard
- 8 stat tiles with flip details
- User management (create, upgrade, delete)
- 4 notification types with colored badges
- Activity log
- CSV export
- Property reassignment
- Photo services management
- VIP leads tracking

### Payment System
- 4 frequencies: Daily, Weekly, Biweekly, Monthly
- Auto-calculated due dates
- Payment ledger with history
- Delete payment capability
- **Frequency MUST be set before payment date**

### Photo Services
- Per Photo: $10,000
- Premium Bundle: $125,000 (6-7 photos + video + 4 weeks premium)
- Collapsible promo bar
- Copy & Notify workflow

### Elite Reports (4 tabs)
1. Overview - Summary tiles, occupancy chart
2. Revenue - Income by payment frequency
3. Occupancy - Rented vs available lists
4. Top Performers - Medal rankings

---

## 📝 Code Style

### JavaScript
- `const`/`let` only (no `var`)
- Template literals for HTML
- `async`/`await` for Firebase
- Debug logging: `console.log('[ModuleName]', ...)`

### HTML/CSS
- Tailwind utility classes
- Gradient patterns for tiles
- Standard spacing: `p-4`, `gap-3`, `rounded-xl`

### Naming
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- DOM IDs: `camelCase`

---

## 🔍 Before Making Changes

1. **Read PROJECT_HISTORY.md** for context on past decisions
2. **Search for existing implementations** of similar features
3. **Check the Known Bugs section** above
4. **Understand the data flow** (PropertyDataService)
5. **Test edge cases** (logged out, no properties, Firestore failure)

---

*Last updated: December 15, 2024*
*Based on 228 commits over 13 days*
