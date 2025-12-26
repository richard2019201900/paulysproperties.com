/**
 * =============================================================================
 * ADMIN NOTIFICATION SYSTEM v2.0 - Enterprise Architecture
 * =============================================================================
 * 
 * ARCHITECTURE:
 * - Firestore `adminNotifications` collection is the SINGLE SOURCE OF TRUTH
 * - All badge counts come directly from Firestore queries
 * - Dashboard cards render from Firestore data
 * - No client-side Maps/Sets for counts (only for session tracking)
 * 
 * FLOW:
 * 1. Event listeners detect new users/listings/photos/premium
 * 2. Create notification document in Firestore (if not admin's own action)
 * 3. Real-time listener on adminNotifications where dismissed == false
 * 4. Badge count = query result count
 * 5. Dashboard renders from query results
 * 6. Dismiss = update document's dismissed field to true
 * 
 * NOTIFICATION TYPES:
 * - user: New user registration
 * - listing: New property listing created
 * - photo: Photo service request
 * - premium: Premium listing activation
 * 
 * =============================================================================
 */

'use strict';

// =============================================================================
// CONSTANTS
// =============================================================================

// Use MASTER_ADMIN_EMAIL from services.js (window.MASTER_ADMIN_EMAIL)
// DO NOT redeclare - it's already a global constant

const NOTIF_TYPES = {
    USER: {
        id: 'user',
        icon: '👤',
        color: 'blue',
        bgGradient: 'from-blue-600 to-cyan-500',
        title: 'New User Registration!'
    },
    LISTING: {
        id: 'listing',
        icon: '🏠',
        color: 'green',
        bgGradient: 'from-green-600 to-emerald-500',
        title: 'New Listing Created!'
    },
    PHOTO: {
        id: 'photo',
        icon: '📸',
        color: 'purple',
        bgGradient: 'from-purple-600 to-pink-500',
        title: 'Photo Service Request!'
    },
    PREMIUM: {
        id: 'premium',
        icon: '👑',
        color: 'amber',
        bgGradient: 'from-amber-500 to-yellow-400',
        title: 'Premium Listing Activated!'
    }
};

// =============================================================================
// STATE (Minimal - only for session tracking, NOT for counts)
// =============================================================================

window.AdminNotifState = {
    // Track what we've seen THIS SESSION (for flash/popup, not for counts)
    seenThisSession: {
        users: new Set(),
        listings: new Set(),
        photos: new Set(),
        premium: new Set()
    },
    
    // Listener states
    listeners: {
        notifications: null,  // Main notifications listener
        users: null,
        listings: null,
        photos: null,
        premium: null
    },
    
    // Is first load complete? (prevents popups on page load)
    initialized: {
        users: false,
        listings: false,
        photos: false,
        premium: false
    },
    
    // Current notification data (from Firestore listener)
    currentNotifications: [],
    
    // Rent notifications (separate system)
    rentNotifications: {
        overdue: [],
        today: [],
        tomorrow: []
    }
};

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize the notification system for admin
 */
window.initAdminNotificationSystem = function() {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.email !== window.MASTER_ADMIN_EMAIL) {
        console.log('[NotifV2] Not admin, skipping initialization');
        return;
    }
    
    console.log('[NotifV2] Initializing notification system...');
    
    // Start the main notifications listener (reads from Firestore)
    startNotificationsListener();
    
    // Start event listeners (create notifications when events happen)
    startUserEventListener();
    startListingEventListener();
    startPhotoEventListener();
    startPremiumEventListener();
    
    // Start rent checker
    checkRentDueNotifications();
    setInterval(checkRentDueNotifications, 60000); // Check every minute
    
    console.log('[NotifV2] Initialization complete');
};

// =============================================================================
// MAIN NOTIFICATIONS LISTENER (Source of Truth for Badge Counts)
// =============================================================================

/**
 * Listen to adminNotifications collection for active (not dismissed) notifications
 * This is the SINGLE SOURCE OF TRUTH for badge counts
 */
function startNotificationsListener() {
    if (AdminNotifState.listeners.notifications) {
        console.log('[NotifV2] Notifications listener already active');
        return;
    }
    
    console.log('[NotifV2] Starting main notifications listener...');
    
    // Try with orderBy first (requires composite index)
    // If it fails, fall back to simpler query
    AdminNotifState.listeners.notifications = db.collection('adminNotifications')
        .where('dismissed', '==', false)
        .onSnapshot((snapshot) => {
            // Store current notifications
            const notifications = [];
            snapshot.forEach(doc => {
                notifications.push({ id: doc.id, ...doc.data() });
            });
            
            // Sort by createdAt client-side (avoids needing composite index)
            notifications.sort((a, b) => {
                const aTime = a.createdAt?.toDate?.() || new Date(0);
                const bTime = b.createdAt?.toDate?.() || new Date(0);
                return bTime - aTime;
            });
            
            AdminNotifState.currentNotifications = notifications;
            
            // Count by type
            const counts = {
                user: 0,
                listing: 0,
                photo: 0,
                premium: 0
            };
            
            notifications.forEach(notif => {
                if (counts.hasOwnProperty(notif.type)) {
                    counts[notif.type]++;
                }
            });
            
            console.log('[NotifV2] Active notifications:', notifications.length, 'Counts:', counts);
            
            // Update all badges
            updateBadges(counts);
            
            // Render dashboard cards
            renderNotificationCards(notifications);
            
        }, (error) => {
            console.error('[NotifV2] Notifications listener error:', error);
            
            // If the error is about missing index, log helpful message
            if (error.code === 'failed-precondition') {
                console.error('[NotifV2] Missing Firestore index. Create a composite index for adminNotifications collection with: dismissed (Ascending), createdAt (Descending)');
            }
        });
}

// =============================================================================
// BADGE UPDATES
// =============================================================================

/**
 * Update all notification badges (reads from Firestore counts)
 */
function updateBadges(counts) {
    // Calculate rent count
    const rentCount = (AdminNotifState.rentNotifications.overdue?.length || 0) +
                      (AdminNotifState.rentNotifications.today?.length || 0) +
                      (AdminNotifState.rentNotifications.tomorrow?.length || 0);
    
    const total = counts.user + counts.listing + counts.photo + counts.premium + rentCount;
    
    // Update main notification dot
    const notifDot = document.getElementById('navNotificationDot');
    if (notifDot) {
        notifDot.classList.toggle('hidden', total === 0);
    }
    
    // Update dropdown badges
    updateDropdownBadge('dropdownUserBadge', 'dropdownUserCount', counts.user);
    updateDropdownBadge('dropdownListingBadge', 'dropdownListingCount', counts.listing);
    updateDropdownBadge('dropdownPhotoBadge', 'dropdownPhotoCount', counts.photo);
    updateDropdownBadge('dropdownPremiumBadge', 'dropdownPremiumCount', counts.premium);
    updateDropdownBadge('dropdownRentBadge', 'dropdownRentCount', rentCount);
    
    // Update mobile badges
    updateMobileBadge('mobileUserBadge', counts.user);
    updateMobileBadge('mobileListingBadge', counts.listing);
    updateMobileBadge('mobilePhotoBadge', counts.photo);
    updateMobileBadge('mobilePremiumBadge', counts.premium);
    updateMobileBadge('mobileRentBadge', rentCount);
    
    // Update combined mobile admin badge
    const adminTotal = counts.user + counts.listing + counts.photo + counts.premium;
    const mobileAdminBadge = document.getElementById('mobileAdminBadge');
    const mobileAdminCount = document.getElementById('mobileAdminCount');
    if (mobileAdminBadge && mobileAdminCount) {
        if (adminTotal > 0) {
            mobileAdminCount.textContent = adminTotal > 9 ? '9+' : adminTotal;
            mobileAdminBadge.classList.remove('hidden');
        } else {
            mobileAdminBadge.classList.add('hidden');
        }
    }
}

function updateDropdownBadge(badgeId, countId, count) {
    const badge = document.getElementById(badgeId);
    const countEl = document.getElementById(countId);
    if (badge && countEl) {
        if (count > 0) {
            countEl.textContent = count > 9 ? '9+' : count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

function updateMobileBadge(badgeId, count) {
    const badge = document.getElementById(badgeId);
    if (badge) {
        badge.classList.toggle('hidden', count === 0);
    }
}

// =============================================================================
// DASHBOARD CARD RENDERING
// =============================================================================

/**
 * Render notification cards in the dashboard
 */
function renderNotificationCards(notifications) {
    const stack = document.getElementById('adminNotificationsStack');
    if (!stack) return;
    
    // Clear existing cards
    stack.innerHTML = '';
    
    if (notifications.length === 0) {
        stack.classList.add('hidden');
        return;
    }
    
    stack.classList.remove('hidden');
    
    notifications.forEach(notif => {
        const typeConfig = Object.values(NOTIF_TYPES).find(t => t.id === notif.type);
        if (!typeConfig) return;
        
        const card = document.createElement('div');
        card.id = 'notification-' + notif.id;
        card.className = `relative overflow-hidden rounded-xl shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r ${typeConfig.bgGradient}`;
        card.onclick = () => navigateToNotification(notif);
        
        const timeStr = notif.createdAt?.toDate ? formatTimeAgo(notif.createdAt.toDate()) : '';
        
        card.innerHTML = `
            <div class="p-4">
                <div class="flex items-start gap-3">
                    <div class="text-3xl">${typeConfig.icon}</div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-white text-lg">${escapeHtml(notif.title)}</h4>
                        <p class="text-white/90 text-sm">${escapeHtml(notif.message)}</p>
                        ${timeStr ? `<p class="text-white/70 text-xs mt-1">${timeStr}</p>` : ''}
                    </div>
                    <button onclick="event.stopPropagation(); dismissNotification('${notif.id}')" 
                            class="text-white/80 hover:text-white text-2xl font-bold leading-none p-1" 
                            title="Dismiss notification">×</button>
                </div>
            </div>
        `;
        
        stack.appendChild(card);
    });
}

/**
 * Navigate to the relevant section when clicking a notification
 */
function navigateToNotification(notif) {
    switch (notif.type) {
        case 'user':
            if (typeof switchAdminTab === 'function') {
                switchAdminTab('users');
            }
            break;
        case 'listing':
            if (notif.data?.propertyId && typeof viewProperty === 'function') {
                viewProperty(notif.data.propertyId);
            }
            break;
        case 'photo':
            if (typeof switchAdminTab === 'function') {
                switchAdminTab('requests');
            }
            break;
        case 'premium':
            // Navigate to the premium property
            if (notif.data?.propertyId && typeof viewProperty === 'function') {
                viewProperty(notif.data.propertyId);
            }
            break;
    }
}

// =============================================================================
// DISMISS NOTIFICATION
// =============================================================================

/**
 * Dismiss a notification (updates Firestore, listener auto-updates UI)
 */
window.dismissNotification = async function(notificationId) {
    try {
        await db.collection('adminNotifications').doc(notificationId).update({
            dismissed: true,
            dismissedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('[NotifV2] Dismissed notification:', notificationId);
        
        // Remove card with animation
        const card = document.getElementById('notification-' + notificationId);
        if (card) {
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '0';
            card.style.transform = 'translateX(100px)';
            setTimeout(() => card.remove(), 300);
        }
        
    } catch (error) {
        console.error('[NotifV2] Error dismissing notification:', error);
        showToast('Error dismissing notification', 'error');
    }
};

/**
 * Clear all notifications
 */
window.clearAllNotifications = async function() {
    if (!confirm('Clear all notifications?')) return;
    
    try {
        const batch = db.batch();
        
        AdminNotifState.currentNotifications.forEach(notif => {
            const ref = db.collection('adminNotifications').doc(notif.id);
            batch.update(ref, { 
                dismissed: true,
                dismissedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        
        await batch.commit();
        
        console.log('[NotifV2] Cleared all notifications');
        showToast('All notifications cleared', 'success');
        
    } catch (error) {
        console.error('[NotifV2] Error clearing notifications:', error);
        showToast('Error clearing notifications', 'error');
    }
};

// =============================================================================
// CREATE NOTIFICATION (writes to Firestore)
// =============================================================================

/**
 * Create a new notification in Firestore
 * Returns the notification ID if created, null if already exists
 */
async function createNotification(type, referenceId, title, message, data = {}) {
    const notificationId = `${type}-${referenceId}`;
    
    try {
        // Check if notification already exists
        const existing = await db.collection('adminNotifications').doc(notificationId).get();
        if (existing.exists) {
            console.log('[NotifV2] Notification already exists:', notificationId);
            return null;
        }
        
        // Create the notification
        await db.collection('adminNotifications').doc(notificationId).set({
            type: type,
            referenceId: referenceId,
            title: title,
            message: message,
            data: data,
            dismissed: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('[NotifV2] Created notification:', notificationId);
        
        // Flash screen for visual feedback
        flashScreen(type);
        
        return notificationId;
        
    } catch (error) {
        console.error('[NotifV2] Error creating notification:', error);
        return null;
    }
}

// =============================================================================
// EVENT LISTENERS (detect events and create notifications)
// =============================================================================

/**
 * Listen for new user registrations
 */
function startUserEventListener() {
    if (AdminNotifState.listeners.users) return;
    
    console.log('[NotifV2] Starting user event listener...');
    
    // Track initialization with a slight delay to allow initial data to settle
    let initializationComplete = false;
    setTimeout(() => {
        initializationComplete = true;
        console.log('[NotifV2:Users] Initialization grace period complete');
    }, 3000); // 3 second grace period
    
    AdminNotifState.listeners.users = db.collection('users')
        .onSnapshot((snapshot) => {
            console.log('[NotifV2:Users] Snapshot received, initComplete:', initializationComplete, 'total users:', snapshot.size);
            
            // Use docChanges to only process truly new additions
            snapshot.docChanges().forEach(change => {
                if (change.type !== 'added') return;
                
                const userId = change.doc.id;
                const userData = change.doc.data();
                
                // Skip if already seen this session
                if (AdminNotifState.seenThisSession.users.has(userId)) return;
                AdminNotifState.seenThisSession.users.add(userId);
                
                console.log('[NotifV2:Users] New user detected:', userId, 'email:', userData.email, 'initComplete:', initializationComplete);
                
                // Skip admin user
                if (userData.email === window.MASTER_ADMIN_EMAIL) {
                    console.log('[NotifV2:Users] Skipping admin user');
                    return;
                }
                
                // Skip during initialization grace period
                if (!initializationComplete) {
                    console.log('[NotifV2:Users] Skipping - still in init grace period');
                    return;
                }
                
                // Create notification
                const displayName = userData.username || userData.displayName || userData.email?.split('@')[0] || 'Unknown';
                const tier = userData.tier || 'starter';
                
                console.log('[NotifV2:Users] Creating notification for:', userId, 'name:', displayName);
                
                createNotification(
                    'user',
                    userId,
                    NOTIF_TYPES.USER.title,
                    `${displayName} created a ${tier.charAt(0).toUpperCase() + tier.slice(1)} account`,
                    {
                        userId: userId,
                        email: userData.email,
                        displayName: displayName,
                        tier: tier
                    }
                );
            });
            
            AdminNotifState.initialized.users = true;
            
        }, (error) => {
            console.error('[NotifV2] User event listener error:', error);
        });
}

/**
 * Listen for new listing creations
 */
function startListingEventListener() {
    if (AdminNotifState.listeners.listings) return;
    
    console.log('[NotifV2] Starting listing event listener...');
    
    // Track initialization with a slight delay to allow initial data to settle
    let initializationComplete = false;
    setTimeout(() => {
        initializationComplete = true;
        console.log('[NotifV2:Listings] Initialization grace period complete');
    }, 3000); // 3 second grace period
    
    AdminNotifState.listeners.listings = db.collection('settings').doc('properties')
        .onSnapshot((doc) => {
            if (!doc.exists) return;
            
            const propsData = doc.data();
            
            console.log('[NotifV2:Listings] Snapshot received, initComplete:', initializationComplete, 'total properties:', Object.keys(propsData).length);
            
            Object.keys(propsData).forEach(propId => {
                const prop = propsData[propId];
                if (!prop || !prop.title) return;
                
                // Skip if already seen this session
                if (AdminNotifState.seenThisSession.listings.has(propId)) return;
                AdminNotifState.seenThisSession.listings.add(propId);
                
                console.log('[NotifV2:Listings] New property detected:', propId, 'owner:', prop.ownerEmail, 'initComplete:', initializationComplete);
                
                // Skip admin's own listings (check by email, NOT by hardcoded IDs)
                if (prop.ownerEmail === window.MASTER_ADMIN_EMAIL) {
                    console.log('[NotifV2:Listings] Skipping admin-owned listing:', propId);
                    return;
                }
                
                // Skip during initialization grace period
                if (!initializationComplete) {
                    console.log('[NotifV2:Listings] Skipping - still in init grace period');
                    return;
                }
                
                // Create notification
                const ownerName = prop.ownerName || prop.ownerEmail?.split('@')[0] || 'Unknown';
                
                console.log('[NotifV2:Listings] Creating notification for:', propId, 'title:', prop.title);
                
                createNotification(
                    'listing',
                    propId,
                    prop.isPremium ? 'New Premium Listing!' : NOTIF_TYPES.LISTING.title,
                    `${prop.title} by ${ownerName}`,
                    {
                        propertyId: propId,
                        title: prop.title,
                        ownerEmail: prop.ownerEmail,
                        ownerName: ownerName,
                        isPremium: prop.isPremium || false
                    }
                );
            });
            
            AdminNotifState.initialized.listings = true;
            
        }, (error) => {
            console.error('[NotifV2] Listing event listener error:', error);
        });
}

/**
 * Listen for photo service requests
 */
function startPhotoEventListener() {
    if (AdminNotifState.listeners.photos) return;
    
    console.log('[NotifV2] Starting photo event listener...');
    
    AdminNotifState.listeners.photos = db.collection('photoServiceRequests')
        .onSnapshot((snapshot) => {
            const isFirstLoad = !AdminNotifState.initialized.photos;
            
            snapshot.forEach(doc => {
                const requestId = doc.id;
                const data = doc.data();
                
                // Skip if already seen this session
                if (AdminNotifState.seenThisSession.photos.has(requestId)) return;
                AdminNotifState.seenThisSession.photos.add(requestId);
                
                // Skip if already reviewed/viewed in Firestore
                if (data.viewed === true || data.reviewed === true) return;
                
                // Skip on first load - BUT check if notification exists
                // For photos, we want to show existing unreviewed requests
                if (isFirstLoad) {
                    // Check if this photo request already has a notification
                    // If not, create one (for existing unreviewed requests)
                    checkAndCreatePhotoNotification(requestId, data);
                    return;
                }
                
                // Create notification for new request
                const name = data.name || data.username || 'Anonymous';
                const packageLabel = data.packageType === 'bundle' ? 'Premium Bundle' : 'Photo Service';
                
                createNotification(
                    'photo',
                    requestId,
                    NOTIF_TYPES.PHOTO.title,
                    `${name} requested ${packageLabel}`,
                    {
                        requestId: requestId,
                        name: name,
                        email: data.email,
                        phone: data.phone,
                        packageType: data.packageType
                    }
                );
            });
            
            AdminNotifState.initialized.photos = true;
            
        }, (error) => {
            console.error('[NotifV2] Photo event listener error:', error);
        });
}

/**
 * Check if a photo request needs a notification (for existing unreviewed requests)
 */
async function checkAndCreatePhotoNotification(requestId, data) {
    const notificationId = `photo-${requestId}`;
    
    try {
        const existing = await db.collection('adminNotifications').doc(notificationId).get();
        
        // If notification exists and is dismissed, don't recreate
        if (existing.exists) return;
        
        // Create notification for existing unreviewed request
        const name = data.name || data.username || 'Anonymous';
        const packageLabel = data.packageType === 'bundle' ? 'Premium Bundle' : 'Photo Service';
        
        await db.collection('adminNotifications').doc(notificationId).set({
            type: 'photo',
            referenceId: requestId,
            title: NOTIF_TYPES.PHOTO.title,
            message: `${name} requested ${packageLabel}`,
            data: {
                requestId: requestId,
                name: name,
                email: data.email,
                phone: data.phone,
                packageType: data.packageType
            },
            dismissed: false,
            createdAt: data.timestamp || data.requestedAt || firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('[NotifV2] Created notification for existing photo request:', notificationId);
        
    } catch (error) {
        console.error('[NotifV2] Error checking photo notification:', error);
    }
}

/**
 * Listen for premium listing activations
 */
function startPremiumEventListener() {
    if (AdminNotifState.listeners.premium) return;
    
    console.log('[NotifV2] Starting premium event listener...');
    
    // Listen to settings/properties for isPremium changes
    AdminNotifState.listeners.premium = db.collection('settings').doc('properties')
        .onSnapshot((doc) => {
            if (!doc.exists) return;
            
            const isFirstLoad = !AdminNotifState.initialized.premium;
            const propsData = doc.data();
            
            Object.keys(propsData).forEach(propId => {
                const prop = propsData[propId];
                if (!prop || !prop.isPremium) return;
                
                const premiumKey = `premium-${propId}`;
                
                // Skip if already seen this session
                if (AdminNotifState.seenThisSession.premium.has(premiumKey)) return;
                AdminNotifState.seenThisSession.premium.add(premiumKey);
                
                // Skip admin's own listings
                if (prop.ownerEmail === window.MASTER_ADMIN_EMAIL) return;
                
                // Skip on first load
                if (isFirstLoad) return;
                
                // Create notification
                const ownerName = prop.ownerName || prop.ownerEmail?.split('@')[0] || 'Unknown';
                
                createNotification(
                    'premium',
                    propId,
                    NOTIF_TYPES.PREMIUM.title,
                    `${prop.title} - collect $10k/week from ${ownerName}`,
                    {
                        propertyId: propId,
                        title: prop.title,
                        ownerEmail: prop.ownerEmail,
                        ownerName: ownerName
                    }
                );
            });
            
            AdminNotifState.initialized.premium = true;
            
        }, (error) => {
            console.error('[NotifV2] Premium event listener error:', error);
        });
}

// =============================================================================
// RENT DUE NOTIFICATIONS (Separate system - not stored in Firestore)
// =============================================================================

/**
 * Check for rent due notifications
 */
async function checkRentDueNotifications() {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    try {
        const propsDoc = await db.collection('settings').doc('properties').get();
        if (!propsDoc.exists) return;
        
        const properties = propsDoc.data();
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
        
        const overdue = [];
        const dueToday = [];
        const dueTomorrow = [];
        
        Object.keys(properties).forEach(propId => {
            const prop = properties[propId];
            if (!prop || !prop.renter || !prop.nextRentDue) return;
            
            // Only check properties owned by current user or admin
            if (prop.ownerEmail !== currentUser.email && currentUser.email !== window.MASTER_ADMIN_EMAIL) return;
            
            const dueDate = prop.nextRentDue.split('T')[0];
            
            if (dueDate < today) {
                overdue.push({ propId, ...prop, dueDate });
            } else if (dueDate === today) {
                dueToday.push({ propId, ...prop, dueDate });
            } else if (dueDate === tomorrow) {
                dueTomorrow.push({ propId, ...prop, dueDate });
            }
        });
        
        AdminNotifState.rentNotifications = {
            overdue: overdue,
            today: dueToday,
            tomorrow: dueTomorrow
        };
        
        // Update badges
        const counts = {
            user: AdminNotifState.currentNotifications.filter(n => n.type === 'user').length,
            listing: AdminNotifState.currentNotifications.filter(n => n.type === 'listing').length,
            photo: AdminNotifState.currentNotifications.filter(n => n.type === 'photo').length,
            premium: AdminNotifState.currentNotifications.filter(n => n.type === 'premium').length
        };
        updateBadges(counts);
        
        // Render rent panel if function exists
        if (typeof renderRentNotificationsPanel === 'function') {
            renderRentNotificationsPanel();
        }
        
    } catch (error) {
        console.error('[NotifV2] Error checking rent notifications:', error);
    }
}

// Expose for external use
window.checkRentDueNotifications = checkRentDueNotifications;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Flash screen with color based on notification type
 */
function flashScreen(type) {
    const colors = {
        user: 'rgba(59, 130, 246, 0.3)',    // blue
        listing: 'rgba(34, 197, 94, 0.3)',   // green
        photo: 'rgba(168, 85, 247, 0.3)',    // purple
        premium: 'rgba(245, 158, 11, 0.3)'   // amber
    };
    
    const color = colors[type] || 'rgba(59, 130, 246, 0.3)';
    
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        inset: 0;
        background: ${color};
        pointer-events: none;
        z-index: 9999;
        animation: flashFade 0.5s ease-out forwards;
    `;
    
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);
}

/**
 * Format timestamp as "X ago"
 */
function formatTimeAgo(date) {
    if (!date) return '';
    
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// =============================================================================
// DEBUG UTILITIES
// =============================================================================

/**
 * Debug: Show current notification state
 */
window.debugNotificationsV2 = function() {
    console.log('=== NOTIFICATION DEBUG V2 ===');
    console.log('Current notifications:', AdminNotifState.currentNotifications);
    console.log('Rent notifications:', AdminNotifState.rentNotifications);
    console.log('Initialized:', AdminNotifState.initialized);
    console.log('Seen this session:', {
        users: AdminNotifState.seenThisSession.users.size,
        listings: AdminNotifState.seenThisSession.listings.size,
        photos: AdminNotifState.seenThisSession.photos.size,
        premium: AdminNotifState.seenThisSession.premium.size
    });
    return AdminNotifState;
};

/**
 * Cleanup old notifications that don't have proper structure
 * Call this from console: cleanupOldNotifications()
 */
window.cleanupOldNotifications = async function() {
    console.log('[NotifV2] Starting cleanup of old/malformed notifications...');
    
    try {
        const snapshot = await db.collection('adminNotifications').get();
        let deleted = 0;
        let kept = 0;
        
        const batch = db.batch();
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const validTypes = ['user', 'listing', 'photo', 'premium'];
            
            // Check if notification has valid structure
            if (!data.type || !validTypes.includes(data.type)) {
                console.log('[NotifV2] Deleting malformed notification:', doc.id, data);
                batch.delete(doc.ref);
                deleted++;
            } else {
                kept++;
            }
        });
        
        if (deleted > 0) {
            await batch.commit();
            console.log(`[NotifV2] Cleanup complete. Deleted: ${deleted}, Kept: ${kept}`);
        } else {
            console.log(`[NotifV2] No malformed notifications found. Total: ${kept}`);
        }
        
        return { deleted, kept };
        
    } catch (error) {
        console.error('[NotifV2] Cleanup error:', error);
        throw error;
    }
};

/**
 * Clear ALL admin notifications (use with caution!)
 * Call this from console: clearAllAdminNotifications()
 */
window.clearAllAdminNotifications = async function() {
    if (!confirm('This will DELETE all admin notifications. Are you sure?')) return;
    
    try {
        const snapshot = await db.collection('adminNotifications').get();
        const batch = db.batch();
        
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        console.log(`[NotifV2] Deleted ${snapshot.size} notifications`);
        
    } catch (error) {
        console.error('[NotifV2] Error clearing notifications:', error);
    }
};

/**
 * Force refresh all data
 */
window.refreshNotificationsV2 = function() {
    console.log('[NotifV2] Force refreshing...');
    
    // Clear seen sets to re-process everything
    AdminNotifState.seenThisSession.users.clear();
    AdminNotifState.seenThisSession.listings.clear();
    AdminNotifState.seenThisSession.photos.clear();
    AdminNotifState.seenThisSession.premium.clear();
    
    // Re-init
    AdminNotifState.initialized.users = false;
    AdminNotifState.initialized.listings = false;
    AdminNotifState.initialized.photos = false;
    AdminNotifState.initialized.premium = false;
    
    // Restart listeners
    if (AdminNotifState.listeners.users) {
        AdminNotifState.listeners.users();
        AdminNotifState.listeners.users = null;
    }
    if (AdminNotifState.listeners.listings) {
        AdminNotifState.listeners.listings();
        AdminNotifState.listeners.listings = null;
    }
    if (AdminNotifState.listeners.photos) {
        AdminNotifState.listeners.photos();
        AdminNotifState.listeners.photos = null;
    }
    if (AdminNotifState.listeners.premium) {
        AdminNotifState.listeners.premium();
        AdminNotifState.listeners.premium = null;
    }
    
    startUserEventListener();
    startListingEventListener();
    startPhotoEventListener();
    startPremiumEventListener();
    
    console.log('[NotifV2] Refresh complete');
};

// =============================================================================
// CSS for flash animation (inject into document)
// =============================================================================

const style = document.createElement('style');
style.textContent = `
    @keyframes flashFade {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

// =============================================================================
// BACKWARD COMPATIBILITY
// =============================================================================

// Provide AdminNotifications object for backward compatibility with ui.js
window.AdminNotifications = {
    // Rent notifications (used by mobile badge code)
    get rentNotifications() {
        return AdminNotifState.rentNotifications;
    },
    
    // Visible map (deprecated, but needed for some legacy code)
    // Returns a fake Map-like object that computes from currentNotifications
    get visible() {
        const fakeMap = new Map();
        AdminNotifState.currentNotifications.forEach(notif => {
            // Old format used 'new-user-', 'new-listing-', etc. as type
            const typeMap = {
                'user': 'new-user-',
                'listing': 'new-listing-',
                'premium': 'new-premium-',
                'photo': 'photo-request-'
            };
            fakeMap.set(notif.id, {
                type: typeMap[notif.type] || notif.type,
                content: notif
            });
        });
        return fakeMap;
    },
    
    // Dismissed set (deprecated)
    dismissed: new Set(),
    
    // Counts object for any code that reads from it
    get counts() {
        const notifications = AdminNotifState.currentNotifications;
        return {
            users: notifications.filter(n => n.type === 'user').length,
            listings: notifications.filter(n => n.type === 'listing').length,
            premium: notifications.filter(n => n.type === 'premium').length,
            photo: notifications.filter(n => n.type === 'photo').length,
            rent: (AdminNotifState.rentNotifications.overdue?.length || 0) +
                  (AdminNotifState.rentNotifications.today?.length || 0) +
                  (AdminNotifState.rentNotifications.tomorrow?.length || 0)
        };
    }
};

// Alias the old init function name to the new one
window.initAdminNotifications = window.initAdminNotificationSystem;

// Alias old dismiss function
window.dismissAdminNotification = window.dismissNotification;

// Provide updateAllBadges for any code that calls it directly
window.updateAllBadges = function() {
    const counts = {
        user: AdminNotifState.currentNotifications.filter(n => n.type === 'user').length,
        listing: AdminNotifState.currentNotifications.filter(n => n.type === 'listing').length,
        photo: AdminNotifState.currentNotifications.filter(n => n.type === 'photo').length,
        premium: AdminNotifState.currentNotifications.filter(n => n.type === 'premium').length
    };
    updateBadges(counts);
};

// =============================================================================
// MODULE LOADED
// =============================================================================

console.log('[NotifV2] Notification module v2.0 loaded (with backward compatibility)');
