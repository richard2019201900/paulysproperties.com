# Firebase Cloud Functions Setup Guide

This guide helps you deploy Cloud Functions to automatically sync Firebase Auth with Firestore when you create or delete users from the admin panel.

## Prerequisites

1. Node.js installed (v18+)
2. Firebase CLI installed: `npm install -g firebase-tools`
3. Logged into Firebase: `firebase login`

## Quick Deploy Steps

### 1. Navigate to your project folder
```bash
cd /path/to/property-portal
```

### 2. Initialize Firebase (if not already done)
```bash
firebase init functions
```
- Select your project: `paulys-property-portal`
- Choose JavaScript
- Say NO to ESLint
- Say YES to install dependencies

### 3. Deploy the functions
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 4. Verify deployment
Go to Firebase Console → Functions tab to see:
- `createAuthUser` - Creates Auth users from admin panel
- `deleteAuthUser` - Deletes Auth users when you delete from admin panel  
- `listAuthUsers` - Lists all Auth users (for debugging)

## What These Functions Do

### createAuthUser
Called when you create a user from the admin panel's "Create User" tab.
- Creates the user in Firebase Auth
- Returns the UID so we can create their Firestore document

### deleteAuthUser  
Called when you delete a user from the admin panel.
- Deletes the user from Firebase Auth
- Prevents deletion of the admin account
- Safe to call even if user doesn't exist in Auth

### listAuthUsers
For debugging - lets you see all users in Firebase Auth.

## Security

These functions verify that:
1. The caller is authenticated
2. The caller's email is `richard2019201900@gmail.com` (master admin)

No one else can call these functions.

## Testing

After deployment, try creating or deleting a user from your admin panel:
1. Go to Admin Panel → Create User
2. Create a test user
3. Check Firebase Console → Authentication → Users
4. The user should appear automatically!

For deletion:
1. Delete a user from All Users
2. Check Firebase Console → Authentication → Users
3. The user should be gone automatically!

## Troubleshooting

### "Function not found" error
- Make sure functions are deployed: `firebase deploy --only functions`
- Check Functions tab in Firebase Console

### "Permission denied" error
- Make sure you're logged in as the admin account
- Check that your email matches `richard2019201900@gmail.com`

### Functions not deploying
- Run `cd functions && npm install` first
- Make sure you're on the Blaze (pay-as-you-go) plan - Cloud Functions require billing

## Costs

Firebase Cloud Functions have a generous free tier:
- 2 million invocations/month free
- 400,000 GB-seconds/month free

For a small admin panel, you'll likely never exceed the free tier.
