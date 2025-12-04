const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const MASTER_ADMIN_EMAIL = 'richard2019201900@gmail.com';

// Verify the caller is the master admin
async function verifyAdmin(context) {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }
    
    if (context.auth.token.email !== MASTER_ADMIN_EMAIL) {
        throw new functions.https.HttpsError('permission-denied', 'Only admin can perform this action');
    }
    
    return true;
}

// Create a new Auth user (callable from admin panel)
exports.createAuthUser = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);
    
    const { email, password, displayName } = data;
    
    if (!email || !password) {
        throw new functions.https.HttpsError('invalid-argument', 'Email and password required');
    }
    
    try {
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: displayName || email.split('@')[0]
        });
        
        console.log('Created user:', userRecord.uid, email);
        
        return {
            success: true,
            uid: userRecord.uid,
            email: userRecord.email
        };
    } catch (error) {
        console.error('Error creating user:', error);
        
        if (error.code === 'auth/email-already-exists') {
            throw new functions.https.HttpsError('already-exists', 'This email is already registered');
        }
        
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// Delete an Auth user by email (callable from admin panel)
exports.deleteAuthUser = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);
    
    const { email } = data;
    
    if (!email) {
        throw new functions.https.HttpsError('invalid-argument', 'Email required');
    }
    
    // Prevent admin from deleting themselves
    if (email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
        throw new functions.https.HttpsError('permission-denied', 'Cannot delete admin account');
    }
    
    try {
        // Get user by email
        const userRecord = await admin.auth().getUserByEmail(email);
        
        // Delete the user
        await admin.auth().deleteUser(userRecord.uid);
        
        console.log('Deleted user:', userRecord.uid, email);
        
        return {
            success: true,
            deletedUid: userRecord.uid,
            deletedEmail: email
        };
    } catch (error) {
        console.error('Error deleting user:', error);
        
        if (error.code === 'auth/user-not-found') {
            // User doesn't exist in Auth - that's okay, return success
            return {
                success: true,
                deletedEmail: email,
                note: 'User was not in Firebase Auth'
            };
        }
        
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// Get all Auth users (for syncing/debugging)
exports.listAuthUsers = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);
    
    try {
        const listUsersResult = await admin.auth().listUsers(1000);
        
        return {
            success: true,
            users: listUsersResult.users.map(user => ({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                createdAt: user.metadata.creationTime
            }))
        };
    } catch (error) {
        console.error('Error listing users:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
