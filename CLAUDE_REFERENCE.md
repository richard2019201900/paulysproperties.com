# PaulysProperties.com - Claude Reference Guide

> **INSTRUCTION TO CLAUDE:** Read this document completely before making any code changes.
> This project has 280+ commits of development history. Many bugs have been fixed - don't reintroduce them.

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
- **Backend:** Firebase Firestore + Auth + Cloud Functions
- **Hosting:** GitHub Pages
- **Build Process:** NONE - direct file editing

---

## 📁 File Structure

```
paulysproperties.com/
├── index.html           # Main HTML - all page structure and modals
├── js/
│   ├── app.js           # Property details, stats page, RTO wizard, eviction
│   ├── ui.js            # Dashboard, admin panel, reports, modals
│   ├── services.js      # Firebase operations, TierService, PropertyDataService
│   ├── state.js         # State management
│   ├── data.js          # Base properties (1-14), owner mappings
│   ├── components.js    # Photo services, reusable components
│   ├── notifications.js # Notification system (admin + rent due)
│   ├── gamification.js  # XP, levels, leaderboard system
│   ├── filters.js       # Property filtering logic
│   ├── migration.js     # Data migration utilities
│   └── config.js        # Firebase configuration
├── functions/
│   └── index.js         # Cloud Functions (cleanup, migration)
├── migrate.html         # Migration page
├── CLAUDE_REFERENCE.md  # This file
└── PROJECT_HISTORY.md   # Full commit history
```

### File Responsibilities

| File | Contains |
|------|----------|
| **app.js** | `renderPropertyStatsContent()`, RTO wizard, eviction system, inline editing |
| **ui.js** | `renderOwnerDashboard()`, 8-tile dashboard, admin panel, Elite Reports |
| **services.js** | `PropertyDataService`, `TierService`, Firebase listeners |
| **notifications.js** | Admin notifications, rent due alerts, premium tracking |
| **gamification.js** | XP awards, level system, leaderboard, achievements |
| **state.js** | Global state management |

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
├── paymentHistory/      # Sub-docs per property
└── gamification         # {migrationCompleted: true}

users/                   # User documents by UID
adminNotifications/      # Admin panel notifications
userNotifications/       # User dashboard notifications
upgradeHistory/          # Tier change audit log
photoServiceRequests/    # Photo service requests
rentToOwnContracts/      # RTO contract documents
gamificationProfiles/    # User XP and level data
```

---

## ⚠️ MANDATORY Rules

### 1. NEVER Use Browser Storage
```javascript
// ❌ FORBIDDEN - will break the app
localStorage.setItem(...)
sessionStorage.setItem(...)
window.someVariable = ...

// ✅ CORRECT - use Firestore
db.collection('settings').doc('docName').set(...)
```

### 2. ALWAYS Work from /home/claude/
```bash
# ❌ NEVER copy wholesale from uploads
cp /mnt/user-data/uploads/app.js /home/claude/app.js  # DESTROYS SESSION WORK

# ✅ CORRECT - work in place
view /home/claude/app.js
str_replace /home/claude/app.js ...
```

### 3. ALWAYS Validate Syntax
```bash
node -c filename.js
```
**Never deliver without syntax check.**

### 4. ALWAYS Copy to Output
```bash
cp /home/claude/file.js /mnt/user-data/outputs/file.js
```

### 5. Use Surgical Edits
- Use `str_replace` for targeted changes
- Read surrounding code BEFORE editing
- Don't rewrite entire functions unnecessarily

### 6. Provide Detailed Git Commits
```bash
git commit -m "Short summary

- Detailed change 1
- Detailed change 2
- Bug fix explanation"
```

---

## 🐛 KNOWN BUGS - DO NOT REINTRODUCE

### 1. "444 Bug" (Commits d28ee98, 6c2f7d5, 5752170, 21ecf6b)
**Problem:** Properties show wrong data
**Cause:** Stale property overrides persist after deletion
**Solution:** Clear overrides when creating/deleting properties

### 2. Availability Collection Bug (Commit a03fa56)
**Problem:** Availability doesn't sync
**Cause:** Auto-fix code wrote to WRONG collection
**Solution:** ALWAYS write to `propertyAvailability`, NEVER `propertyOverrides`

### 3. Key Type Mismatch (Commit 123de4f)
**Problem:** Availability state corruption
**Cause:** Firestore keys are strings, JS uses numbers
**Solution:** Consistent key handling with `parseInt()`

### 4. Admin Financial Calculations (Commit f8a1d5b)
**Problem:** Admin sees ALL properties in income totals
**Cause:** Using getOwnerProperties() for financials
**Solution:** Use getOwnedProperties() for all financial calculations

### 5. Property Description Field
**Problem:** Description shows N/A in RTO contracts
**Cause:** Description stored in `location` field, not `description`
**Solution:** Use `p.location` or `PropertyDataService.getValue(id, 'location', '')`

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

---

## 📊 Current Features

### Dashboard (8 Tiles)
**Row 1 - Income by Frequency:**
- Daily Income (actuals only)
- Weekly Income (actuals only)
- Biweekly Income (actuals only)
- Monthly Income (estimated - sum of all frequencies converted)

**Row 2 - Property Stats:**
- Total Listings
- Rented Properties
- Available Properties
- Premium Listings

### Rent-to-Own (RTO) Wizard
**Elite-only feature** with 4 steps:
1. **Parties** - Select buyer/seller (auto-populate from renter/owner)
2. **Financial Terms** - Purchase price, down payment (slider + manual), term length
3. **Review** - Full agreement preview
4. **Contract Generated** - Copy text, download image, save to Firestore

**Key Calculations:**
- Final Payment = PMA Government Minimum (by property type) + 10% Realtor Fee
- Monthly Payment = (Purchase - Down - Final Base) ÷ (Months - 1)

**PMA Government Minimums:**
| Category | Minimum | + 10% Fee | Total |
|----------|---------|-----------|-------|
| Walk-In House | $1.5M | $150K | $1.65M |
| Instance 1000+ | $1.2M | $120K | $1.32M |
| Hotel 1050 | $900K | $90K | $990K |
| Instance 800-900 | $800K | $80K | $880K |
| Hotel 800 | $750K | $75K | $825K |
| Apartment 600 | $700K | $70K | $770K |

### Eviction System
- 3-day overdue warning: "scheduled for eviction in 24 hours"
- Eviction modal with copy message and keys checkbox
- Records eviction in payment history
- Clears renter info and marks available

### Gamification
- XP awards for actions (profile, listings, rentals)
- 8 levels with celebration banners
- Public leaderboard page
- Firestore-based (no browser storage)

### Premium Advertising
- $10K/week for featured listing
- 7-day trial available
- Admin tracking with payment dates, due dates, urgency colors

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

## 📝 Recent Session Changes (Dec 24-25, 2024)

### RTO Wizard V4
- Footer branding: "PaulysProperties.com" + dynamic year
- Step 1: Two-radio simplification (Use Current vs Enter Manually)
- Down payment: Editable manual input + decimal percentages (e.g., 4.12%)
- Final payment: PMA Government minimums by property category
- Elite-only restriction with upgrade overlay
- Square image format (1000x1000) for contracts
- Property description fix (uses `location` field)
- Label change: "Amount for Monthly" → "Remaining Balance to Finance"

### Bug Fixes
- Eviction error: `recordPaymentHistory` → `logPayment`
- Property description: reads from `location` field, not `description`

---

*Last updated: December 25, 2024*
*Based on 280+ commits*
