const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const MASTER_ADMIN_EMAIL = 'richard2019201900@gmail.com';

// ============================================================
// HELPER FUNCTIONS
// ============================================================

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

// Get level info from XP amount
function getLevelFromXP(xp) {
    const levels = [
        { level: 1, xp: 0, title: 'Newcomer' },
        { level: 2, xp: 300, title: 'Resident' },
        { level: 3, xp: 1000, title: 'Landlord' },
        { level: 4, xp: 3000, title: 'Property Mogul' },
        { level: 5, xp: 7500, title: 'Real Estate Tycoon' },
        { level: 6, xp: 15000, title: 'Property Baron' },
        { level: 7, xp: 30000, title: 'Elite Investor' },
        { level: 8, xp: 50000, title: 'Legendary Owner' }
    ];
    
    let result = levels[0];
    for (const level of levels) {
        if (xp >= level.xp) {
            result = level;
        } else {
            break;
        }
    }
    return result;
}

// ============================================================
// EXISTING USER MANAGEMENT FUNCTIONS
// ============================================================

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

// ============================================================
// GAMIFICATION FUNCTIONS
// ============================================================

/**
 * Scheduled function: Runs every hour
 * - Expires premium listings past their expiration date
 * - Removes celebrations older than 24 hours
 */
exports.scheduledCleanup = functions.pubsub
    .schedule('every 1 hours')
    .timeZone('America/Los_Angeles')
    .onRun(async (context) => {
        const now = new Date();
        console.log(`[Cleanup] Running scheduled cleanup at ${now.toISOString()}`);
        
        let premiumExpired = 0;
        let celebrationsRemoved = 0;
        
        // ===== 1. PREMIUM EXPIRATION =====
        try {
            const propertiesDoc = await db.collection('settings').doc('properties').get();
            
            if (propertiesDoc.exists) {
                const properties = propertiesDoc.data();
                const updates = {};
                
                for (const [id, prop] of Object.entries(properties)) {
                    if (prop && prop.isPremium && prop.premiumExpiresAt) {
                        const expiresAt = new Date(prop.premiumExpiresAt);
                        if (expiresAt < now) {
                            updates[`${id}.isPremium`] = false;
                            updates[`${id}.premiumExpiredAt`] = now.toISOString();
                            updates[`${id}.premiumSource`] = admin.firestore.FieldValue.delete();
                            updates[`${id}.premiumExpiresAt`] = admin.firestore.FieldValue.delete();
                            premiumExpired++;
                            console.log(`[Cleanup] Expiring premium for property ${id}`);
                        }
                    }
                }
                
                if (Object.keys(updates).length > 0) {
                    await db.collection('settings').doc('properties').update(updates);
                    console.log(`[Cleanup] Expired ${premiumExpired} premium listings`);
                }
            }
        } catch (error) {
            console.error('[Cleanup] Premium expiration error:', error);
        }
        
        // ===== 2. CELEBRATION CLEANUP =====
        try {
            const celebrationsDoc = await db.collection('settings').doc('celebrations').get();
            
            if (celebrationsDoc.exists) {
                const data = celebrationsDoc.data();
                const active = data.active || [];
                
                const stillActive = active.filter(cel => {
                    if (!cel.expiresAt) return false;
                    const expiresAt = new Date(cel.expiresAt);
                    return expiresAt > now;
                });
                
                celebrationsRemoved = active.length - stillActive.length;
                
                if (celebrationsRemoved > 0) {
                    await db.collection('settings').doc('celebrations').update({
                        active: stillActive
                    });
                    console.log(`[Cleanup] Removed ${celebrationsRemoved} expired celebrations`);
                }
            }
        } catch (error) {
            console.error('[Cleanup] Celebration cleanup error:', error);
        }
        
        console.log(`[Cleanup] Complete: ${premiumExpired} premiums expired, ${celebrationsRemoved} celebrations removed`);
        return null;
    });

/**
 * Callable function: One-time migration for existing users
 * Calculates retroactive XP based on existing data
 */
exports.migrateAllUsersToGamification = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);
    
    console.log('[Migration] Starting gamification migration...');
    
    // Load all required data
    const usersSnapshot = await db.collection('users').get();
    
    const propertiesDoc = await db.collection('settings').doc('properties').get();
    const properties = propertiesDoc.exists ? propertiesDoc.data() : {};
    
    const availabilityDoc = await db.collection('settings').doc('propertyAvailability').get();
    const availability = availabilityDoc.exists ? availabilityDoc.data() : {};
    
    let migrated = 0;
    let skipped = 0;
    const results = [];
    
    for (const userDoc of usersSnapshot.docs) {
        const user = userDoc.data();
        const userId = userDoc.id;
        
        // Skip if already migrated
        if (user.gamification && user.gamification.migrated === true) {
            skipped++;
            continue;
        }
        
        try {
            // Calculate retroactive XP
            const gamificationData = await calculateRetroactiveXP(user, properties, availability);
            
            // Write gamification data
            await db.collection('users').doc(userId).update({
                gamification: {
                    ...gamificationData,
                    migrated: true,
                    migratedAt: admin.firestore.FieldValue.serverTimestamp()
                }
            });
            
            migrated++;
            results.push({
                email: user.email,
                xp: gamificationData.xp,
                level: gamificationData.level,
                title: gamificationData.title
            });
            
            console.log(`[Migration] ${user.email}: ${gamificationData.xp} XP, Level ${gamificationData.level}`);
            
        } catch (error) {
            console.error(`[Migration] Error migrating ${user.email}:`, error);
            results.push({
                email: user.email,
                error: error.message
            });
        }
    }
    
    console.log(`[Migration] Complete: ${migrated} migrated, ${skipped} already done`);
    
    return {
        success: true,
        migrated,
        skipped,
        results
    };
});

/**
 * Calculate retroactive XP for an existing user
 */
async function calculateRetroactiveXP(user, properties, availability) {
    let xp = 0;
    const achievements = {};
    const stats = { totalRentals: 0, propertiesPosted: 0 };
    const rewards = {};
    
    const now = new Date().toISOString();
    const signupDate = user.createdAt && user.createdAt.toDate 
        ? user.createdAt.toDate().toISOString() 
        : now;
    
    // ===== SIGNUP XP (everyone gets this) =====
    xp += 100;
    achievements.signup = signupDate;
    
    // ===== PROFILE FIELDS =====
    const hasUsername = user.username && user.username.trim().length > 0;
    const hasPhone = user.phone && user.phone.trim().length > 0;
    
    if (hasUsername) {
        xp += 50;
        achievements.display_name = signupDate;
    }
    
    if (hasPhone) {
        xp += 150;
        achievements.phone_added = signupDate;
    }
    
    if (hasUsername && hasPhone) {
        xp += 100; // Profile complete bonus
        achievements.profile_complete = signupDate;
    }
    
    // ===== PROPERTIES POSTED =====
    const userEmail = (user.email || '').toLowerCase();
    const userProperties = Object.entries(properties).filter(([id, prop]) => 
        prop && (prop.ownerEmail || '').toLowerCase() === userEmail
    );
    
    stats.propertiesPosted = userProperties.length;
    
    if (stats.propertiesPosted > 0) {
        xp += 500; // First listing
        achievements.first_listing = user.lastPropertyPostedAt || signupDate;
        xp += Math.max(0, stats.propertiesPosted - 1) * 250; // Additional listings
    }
    
    // ===== PREMIUM LISTINGS =====
    const premiumCount = userProperties.filter(([id, prop]) => 
        prop && prop.isPremium === true
    ).length;
    
    if (premiumCount > 0) {
        xp += premiumCount * 200;
        achievements.premium_listing = now;
    }
    
    // ===== RENTALS (completed tenures + current active) =====
    for (const [propId, prop] of userProperties) {
        // Count completed tenures from payment history
        try {
            const historyDoc = await db.collection('paymentHistory').doc(String(propId)).get();
            if (historyDoc.exists) {
                const historyData = historyDoc.data();
                const tenures = historyData.tenureHistory || [];
                stats.totalRentals += tenures.length;
            }
        } catch (e) {
            // Skip if can't read payment history
            console.log(`[Migration] Could not read paymentHistory for property ${propId}`);
        }
        
        // Count current active rental
        const propIdStr = String(propId);
        const propIdNum = parseInt(propId);
        const isRented = availability[propIdStr] === false || availability[propIdNum] === false;
        const hasRenter = prop && prop.renterName && prop.renterName.trim().length > 0;
        
        if (isRented && hasRenter) {
            stats.totalRentals += 1;
        }
    }
    
    if (stats.totalRentals > 0) {
        xp += 1000; // First rental
        achievements.first_rental = now;
        xp += Math.max(0, stats.totalRentals - 1) * 500; // Additional rentals
    }
    
    // ===== CALCULATE LEVEL =====
    const levelInfo = getLevelFromXP(xp);
    
    // ===== CHECK FOR LEVEL 5 REWARD =====
    if (levelInfo.level >= 5) {
        rewards.free_premium_week = {
            earned: now,
            used: false,
            usedOn: null,
            usedAt: null
        };
    }
    
    return {
        xp,
        level: levelInfo.level,
        title: levelInfo.title,
        achievements,
        stats,
        rewards
    };
}

// ============================================================
// SECURE LEADERBOARD FUNCTIONS
// ============================================================

// Level icons mapping
const LEVEL_ICONS = ['🌱', '🏠', '🔑', '🏢', '🏰', '👑', '💎', '🌟'];

/**
 * Get leaderboard data - returns ONLY public fields (no emails)
 * Callable by any authenticated user
 */
exports.getLeaderboard = functions.https.onCall(async (data, context) => {
    // Require authentication to view leaderboard
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to view leaderboard');
    }
    
    const limit = Math.min(data?.limit || 10, 50); // Max 50 users
    
    try {
        const snapshot = await db.collection('users')
            .orderBy('gamification.xp', 'desc')
            .limit(limit)
            .get();
        
        const leaderboard = [];
        let rank = 1;
        
        snapshot.forEach(doc => {
            const userData = doc.data();
            const gam = userData.gamification || {};
            
            // Determine tier - master admin shows as "owner"
            // We check email server-side but NEVER expose it
            let displayTier = userData.tier || 'free';
            if (userData.email === MASTER_ADMIN_EMAIL) {
                displayTier = 'owner';
            }
            
            // Get level icon
            const levelIndex = Math.min((gam.level || 1) - 1, LEVEL_ICONS.length - 1);
            const icon = LEVEL_ICONS[levelIndex];
            
            // Sanitize activity log - remove any potential sensitive data
            const sanitizedActivityLog = (gam.activityLog || []).map(act => ({
                type: act.type || 'xp_gain',
                amount: act.amount || 0,
                reason: act.reason || 'Activity',
                timestamp: act.timestamp || null
            }));
            
            // Return ONLY public fields - NEVER email, phone, etc.
            leaderboard.push({
                odbc: doc.id,
                rank: rank++,
                username: userData.username || userData.displayName || 'Anonymous',
                xp: gam.xp || 0,
                level: gam.level || 1,
                title: gam.title || 'Newcomer',
                icon: icon,
                tier: displayTier,
                activityLog: sanitizedActivityLog,
                createdAt: userData.createdAt || null
            });
        });
        
        return {
            success: true,
            leaderboard: leaderboard,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('[Leaderboard] Error fetching leaderboard:', error);
        throw new functions.https.HttpsError('internal', 'Failed to fetch leaderboard');
    }
});

/**
 * Get user's rank based on their XP
 * Callable by any authenticated user
 */
exports.getUserRank = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }
    
    const userXP = data?.xp;
    
    if (typeof userXP !== 'number') {
        throw new functions.https.HttpsError('invalid-argument', 'XP must be a number');
    }
    
    try {
        // Count users with higher XP
        const snapshot = await db.collection('users')
            .where('gamification.xp', '>', userXP)
            .count()
            .get();
        
        const rank = snapshot.data().count + 1;
        
        return {
            success: true,
            rank: rank,
            xp: userXP
        };
        
    } catch (error) {
        console.error('[Leaderboard] Error getting user rank:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get rank');
    }
});

/**
 * Get current user's own profile data (for dashboard widget)
 * This allows users to get their own data even with restricted rules
 */
exports.getMyProfile = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }
    
    try {
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        
        if (!userDoc.exists) {
            return { success: false, exists: false };
        }
        
        const userData = userDoc.data();
        const gam = userData.gamification || {};
        
        // Return user's own data (they can see their own email)
        return {
            success: true,
            exists: true,
            profile: {
                odbc: userDoc.id,
                email: userData.email,
                username: userData.username || userData.displayName,
                phone: userData.phone,
                tier: userData.tier || 'free',
                gamification: gam,
                createdAt: userData.createdAt
            }
        };
        
    } catch (error) {
        console.error('[Profile] Error fetching profile:', error);
        throw new functions.https.HttpsError('internal', 'Failed to fetch profile');
    }
});
