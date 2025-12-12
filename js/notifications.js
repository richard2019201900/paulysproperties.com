/**
 * UNIFIED ADMIN NOTIFICATION SYSTEM
 * 
 * This module handles all admin notifications with consistent behavior:
 * - New User Registrations (Blue)
 * - New Listings (Green)  
 * - Premium Requests (Gold/Amber)
 * 
 * RULES:
 * 1. One notification per event - no duplicates
 * 2. Badge count = number of visible notification cards
 * 3. Dismiss removes notification everywhere
 * 4. Screen flash happens ONCE per event when detected in real-time
 * 5. Listeners start once and don't restart
 */

// ============================================================================
// NOTIFICATION CONFIG
// ============================================================================

const NOTIFICATION_TYPES = {
    USER: {
        prefix: 'new-user-',
        color: 'blue',
        bgGradient: 'from-blue-600 to-blue-500',
        badgeColor: 'bg-blue-500',
        flashColor: 'blue',
        icon: '👤',
        title: 'New User Registered!',
        storageKey: 'adminPendingUsers'
    },
    LISTING: {
        prefix: 'new-listing-',
        color: 'green', 
        bgGradient: 'from-green-600 to-emerald-500',
        badgeColor: 'bg-green-500',
        flashColor: 'green',
        icon: '🏠',
        title: 'New Listing Created!',
        storageKey: 'adminPendingListings'
    },
    PREMIUM: {
        prefix: 'new-premium-',
        color: 'amber',
        bgGradient: 'from-amber-500 to-yellow-400',
        badgeColor: 'bg-amber-500',
        flashColor: 'gold',
        icon: '👑',
        title: 'Premium Listing Activated!',
        storageKey: 'adminPendingPremium'
    },
    PHOTO: {
        prefix: 'photo-request-',
        color: 'orange',
        bgGradient: 'from-orange-500 to-pink-500',
        badgeColor: 'bg-orange-500',
        flashColor: 'orange',
        icon: '📸',
        title: '💰 Photo Service Inquiry!',
        storageKey: 'adminPendingPhotoRequests'
    }
};

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

// Initialize notification state
window.AdminNotifications = {
    // Sets to track what we've seen (prevent duplicates)
    seenUsers: new Set(),
    seenListings: new Set(),
    seenPremium: new Set(),
    seenPhotoRequests: new Set(),
    
    // Currently visible notifications (keyed by full notification ID)
    visible: new Map(),
    
    // Dismissed notifications (won't show again this session)
    dismissed: new Set(),
    
    // Session start time (for detecting real-time vs historical)
    sessionStart: null,
    
    // Listener states (prevent multiple listeners)
    usersListenerActive: false,
    listingsListenerActive: false,
    premiumListenerActive: false,
    photoRequestsListenerActive: false,
    
    // First snapshot flags
    usersFirstSnapshot: true,
    listingsFirstSnapshot: true,
    premiumFirstSnapshot: true,
    photoRequestsFirstSnapshot: true
};

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the notification system for admin
 * Call this once when admin logs in
 */
window.initAdminNotifications = function() {
    if (!TierService.isMasterAdmin(auth.currentUser?.email)) {
        console.log('[AdminNotify] Not admin, skipping initialization');
        return;
    }
    
    console.log('[AdminNotify] Initializing notification system...');
    
    // Set session start time
    AdminNotifications.sessionStart = new Date();
    
    // Pre-populate seenListings with base property IDs (1-14) to prevent
    // false "new listing" notifications when admin edits their own properties
    for (let i = 1; i <= 14; i++) {
        AdminNotifications.seenListings.add(i);
    }
    console.log('[AdminNotify] Pre-populated base property IDs 1-14 as seen');
    
    // Load dismissed from localStorage
    try {
        const dismissed = localStorage.getItem('adminDismissedNotifications');
        if (dismissed) {
            JSON.parse(dismissed).forEach(id => AdminNotifications.dismissed.add(id));
        }
    } catch (e) {}
    
    // Load pending notifications from localStorage (for persistence across page loads)
    loadPendingFromStorage();
    
    // Start all listeners
    startUserListener();
    startListingListener();
    startPremiumListener();
    startPhotoRequestListener();
    
    // Initial badge update
    updateAllBadges();
    
    console.log('[AdminNotify] Initialization complete');
};

/**
 * Load pending notifications from localStorage
 */
function loadPendingFromStorage() {
    Object.values(NOTIFICATION_TYPES).forEach(type => {
        try {
            const pending = localStorage.getItem(type.storageKey);
            if (pending) {
                const ids = JSON.parse(pending);
                ids.forEach(id => {
                    if (!AdminNotifications.dismissed.has(id)) {
                        // Mark as pending to show - will be validated when listener runs
                        AdminNotifications.visible.set(id, { pending: true, type: type.prefix });
                    }
                });
            }
        } catch (e) {}
    });
}

/**
 * Save pending notifications to localStorage
 */
function savePendingToStorage() {
    Object.values(NOTIFICATION_TYPES).forEach(type => {
        const ids = [];
        AdminNotifications.visible.forEach((data, id) => {
            if (id.startsWith(type.prefix)) {
                ids.push(id);
            }
        });
        try {
            localStorage.setItem(type.storageKey, JSON.stringify(ids));
        } catch (e) {}
    });
}

// ============================================================================
// USER LISTENER
// ============================================================================

function startUserListener() {
    if (AdminNotifications.usersListenerActive) {
        console.log('[AdminNotify:Users] Listener already active');
        return;
    }
    
    console.log('[AdminNotify:Users] Starting listener...');
    AdminNotifications.usersListenerActive = true;
    
    db.collection('users').onSnapshot((snapshot) => {
        const isFirst = AdminNotifications.usersFirstSnapshot;
        const newUsers = [];
        const currentUserIds = new Set();
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const notifId = NOTIFICATION_TYPES.USER.prefix + doc.id;
            currentUserIds.add(doc.id);
            
            // Skip admin
            if (TierService.isMasterAdmin(data.email)) return;
            
            // Check if this notification is pending (loaded from storage but needs content)
            const isPending = AdminNotifications.visible.has(notifId) && 
                              AdminNotifications.visible.get(notifId).pending === true;
            
            // Check if this is new to us
            if (!AdminNotifications.seenUsers.has(doc.id)) {
                AdminNotifications.seenUsers.add(doc.id);
                
                if (!isFirst && !AdminNotifications.dismissed.has(notifId)) {
                    // Real-time new user!
                    console.log('[AdminNotify:Users] NEW USER:', data.email);
                    newUsers.push({
                        id: doc.id,
                        notifId: notifId,
                        email: data.email,
                        displayName: data.displayName || data.email?.split('@')[0],
                        tier: data.tier || 'starter',
                        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
                    });
                }
                
                // If this was a pending notification, populate its content
                if (isPending) {
                    const userData = {
                        id: doc.id,
                        notifId: notifId,
                        email: data.email,
                        displayName: data.displayName || data.email?.split('@')[0],
                        tier: data.tier || 'starter',
                        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
                    };
                    AdminNotifications.visible.set(notifId, {
                        type: 'user',
                        content: {
                            title: NOTIFICATION_TYPES.USER.title,
                            message: `${userData.displayName} created a ${userData.tier} account`,
                            timestamp: userData.createdAt,
                            data: userData
                        }
                    });
                    console.log('[AdminNotify:Users] Populated pending notification:', notifId);
                }
            }
        });
        
        // Clean up stale pending notifications (users that no longer exist)
        if (isFirst) {
            const toRemove = [];
            AdminNotifications.visible.forEach((data, id) => {
                if (id.startsWith(NOTIFICATION_TYPES.USER.prefix)) {
                    const userId = id.replace(NOTIFICATION_TYPES.USER.prefix, '');
                    if (!currentUserIds.has(userId)) {
                        toRemove.push(id);
                    }
                }
            });
            toRemove.forEach(id => {
                console.log('[AdminNotify:Users] Removing stale:', id);
                AdminNotifications.visible.delete(id);
                AdminNotifications.dismissed.add(id);
            });
        }
        
        // Mark first snapshot complete
        if (isFirst) {
            AdminNotifications.usersFirstSnapshot = false;
            console.log('[AdminNotify:Users] Initial load complete, seen', AdminNotifications.seenUsers.size, 'users');
            
            // Re-render any pending notifications that are valid
            renderPendingNotifications(NOTIFICATION_TYPES.USER);
        }
        
        // Handle new users
        if (newUsers.length > 0) {
            // Flash screen
            flashScreen(NOTIFICATION_TYPES.USER.flashColor);
            
            // Create notifications
            newUsers.forEach(user => {
                createNotification(NOTIFICATION_TYPES.USER, user.notifId, {
                    title: NOTIFICATION_TYPES.USER.title,
                    message: `${user.displayName} created a ${user.tier.charAt(0).toUpperCase() + user.tier.slice(1)} account`,
                    timestamp: user.createdAt,
                    data: user
                });
            });
            
            // Update admin panel
            if (window.adminUsersData) {
                updateAdminStats(window.adminUsersData);
            }
        }
        
        // Store users data for admin panel
        const users = [];
        snapshot.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
        window.adminUsersData = users;
        
        // Update badges
        updateAllBadges();
        
    }, error => {
        console.error('[AdminNotify:Users] Error:', error);
        AdminNotifications.usersListenerActive = false;
    });
}

// ============================================================================
// LISTING LISTENER
// ============================================================================

function startListingListener() {
    if (AdminNotifications.listingsListenerActive) {
        console.log('[AdminNotify:Listings] Listener already active');
        return;
    }
    
    console.log('[AdminNotify:Listings] Starting listener...');
    AdminNotifications.listingsListenerActive = true;
    
    db.collection('settings').doc('properties').onSnapshot((doc) => {
        if (!doc.exists) {
            console.log('[AdminNotify:Listings] No properties document');
            return;
        }
        
        const isFirst = AdminNotifications.listingsFirstSnapshot;
        const propsData = doc.data();
        const newListings = [];
        const currentListingIds = new Set();
        
        Object.keys(propsData).forEach(key => {
            const propId = parseInt(key);
            const prop = propsData[key];
            
            if (!prop || !prop.title) return;
            
            const notifId = NOTIFICATION_TYPES.LISTING.prefix + propId;
            currentListingIds.add(propId);
            
            // Check if this notification is pending (loaded from storage but needs content)
            const isPending = AdminNotifications.visible.has(notifId) && 
                              AdminNotifications.visible.get(notifId).pending === true;
            
            // Check if new to us
            if (!AdminNotifications.seenListings.has(propId)) {
                AdminNotifications.seenListings.add(propId);
                
                // Determine if this is an admin listing (should be skipped)
                // 1. ownerEmail matches admin email
                // 2. Property ID 1-14 (base properties owned by admin)
                // 3. No owner set AND it's a base property (1-14)
                const isBaseProperty = propId >= 1 && propId <= 14;
                const hasAdminEmail = prop.ownerEmail && TierService.isMasterAdmin(prop.ownerEmail);
                const noOwnerSet = !prop.ownerEmail;
                // Skip if admin email OR it's a base property (admin's default properties)
                const isAdminListing = hasAdminEmail || isBaseProperty;
                
                if (!isFirst && !isAdminListing && !AdminNotifications.dismissed.has(notifId)) {
                    console.log('[AdminNotify:Listings] NEW LISTING:', prop.title, 'by', prop.ownerEmail);
                    
                    // Get owner name with proper fallback
                    let ownerName = prop.ownerName;
                    if (!ownerName && prop.ownerEmail) {
                        ownerName = prop.ownerEmail.split('@')[0];
                    }
                    if (!ownerName) {
                        ownerName = 'Unknown Owner';
                    }
                    
                    newListings.push({
                        id: propId,
                        notifId: notifId,
                        title: prop.title,
                        ownerEmail: prop.ownerEmail,
                        ownerName: ownerName,
                        isPremium: prop.isPremium || false,
                        createdAt: prop.createdAt ? new Date(prop.createdAt) : new Date()
                    });
                }
                
                // If this was a pending notification, populate its content
                if (isPending && !isAdminListing) {
                    let ownerName = prop.ownerName;
                    if (!ownerName && prop.ownerEmail) {
                        ownerName = prop.ownerEmail.split('@')[0];
                    }
                    if (!ownerName) {
                        ownerName = 'Unknown Owner';
                    }
                    
                    const listingData = {
                        id: propId,
                        notifId: notifId,
                        title: prop.title,
                        ownerEmail: prop.ownerEmail,
                        ownerName: ownerName,
                        isPremium: prop.isPremium || false,
                        createdAt: prop.createdAt ? new Date(prop.createdAt) : new Date()
                    };
                    AdminNotifications.visible.set(notifId, {
                        type: 'listing',
                        content: {
                            title: prop.isPremium ? 'New Premium Listing!' : NOTIFICATION_TYPES.LISTING.title,
                            message: `${prop.title} by ${listingData.ownerName}`,
                            timestamp: listingData.createdAt,
                            data: listingData
                        }
                    });
                    console.log('[AdminNotify:Listings] Populated pending notification:', notifId);
                }
            }
        });
        
        // Clean up stale pending notifications
        if (isFirst) {
            const toRemove = [];
            AdminNotifications.visible.forEach((data, id) => {
                if (id.startsWith(NOTIFICATION_TYPES.LISTING.prefix)) {
                    const listingId = parseInt(id.replace(NOTIFICATION_TYPES.LISTING.prefix, ''));
                    if (!currentListingIds.has(listingId)) {
                        toRemove.push(id);
                    }
                }
            });
            toRemove.forEach(id => {
                console.log('[AdminNotify:Listings] Removing stale:', id);
                AdminNotifications.visible.delete(id);
                AdminNotifications.dismissed.add(id);
            });
        }
        
        // Mark first snapshot complete
        if (isFirst) {
            AdminNotifications.listingsFirstSnapshot = false;
            console.log('[AdminNotify:Listings] Initial load complete, seen', AdminNotifications.seenListings.size, 'listings');
            
            // Re-render any pending notifications that are valid
            renderPendingNotifications(NOTIFICATION_TYPES.LISTING);
        }
        
        // Handle new listings
        if (newListings.length > 0) {
            // Flash screen
            flashScreen(NOTIFICATION_TYPES.LISTING.flashColor);
            
            // Create notifications
            newListings.forEach(listing => {
                createNotification(NOTIFICATION_TYPES.LISTING, listing.notifId, {
                    title: listing.isPremium ? 'New Premium Listing!' : NOTIFICATION_TYPES.LISTING.title,
                    message: `${listing.title} by ${listing.ownerName}`,
                    timestamp: listing.createdAt,
                    data: listing
                });
            });
        }
        
        // Update badges
        updateAllBadges();
        
    }, error => {
        console.error('[AdminNotify:Listings] Error:', error);
        AdminNotifications.listingsListenerActive = false;
    });
}

// ============================================================================
// PREMIUM LISTENER (Firestore-based)
// ============================================================================

function startPremiumListener() {
    if (AdminNotifications.premiumListenerActive) {
        console.log('[AdminNotify:Premium] Listener already active');
        return;
    }
    
    console.log('[AdminNotify:Premium] Starting listener...');
    AdminNotifications.premiumListenerActive = true;
    
    // Query all undismissed notifications, then filter by type in JS
    // (Avoids requiring a compound Firestore index)
    db.collection('adminNotifications')
        .where('dismissed', '==', false)
        .onSnapshot((snapshot) => {
            const isFirst = AdminNotifications.premiumFirstSnapshot;
            const newPremium = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                
                // Only process premium_request notifications (skip new_user, etc.)
                if (data.type !== 'premium_request') {
                    return;
                }
                
                const notifId = NOTIFICATION_TYPES.PREMIUM.prefix + doc.id;
                
                // Check if new to us
                if (!AdminNotifications.seenPremium.has(doc.id)) {
                    AdminNotifications.seenPremium.add(doc.id);
                    
                    if (!isFirst && !AdminNotifications.dismissed.has(notifId)) {
                        console.log('[AdminNotify:Premium] NEW PREMIUM:', data.propertyTitle);
                        newPremium.push({
                            id: doc.id,
                            notifId: notifId,
                            propertyTitle: data.propertyTitle,
                            userEmail: data.userEmail,
                            userName: data.userName,
                            message: data.message,
                            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
                        });
                    }
                }
                
                // Add to visible if not dismissed
                if (!AdminNotifications.dismissed.has(notifId)) {
                    if (!AdminNotifications.visible.has(notifId)) {
                        AdminNotifications.visible.set(notifId, {
                            type: 'premium',
                            data: { ...data, id: doc.id, notifId }
                        });
                    }
                }
            });
            
            // Mark first snapshot complete
            if (isFirst) {
                AdminNotifications.premiumFirstSnapshot = false;
                console.log('[AdminNotify:Premium] Initial load complete, seen', AdminNotifications.seenPremium.size, 'premium requests');
                
                // Render existing premium notifications
                renderPendingNotifications(NOTIFICATION_TYPES.PREMIUM);
            }
            
            // Handle new premium requests
            if (newPremium.length > 0) {
                // Flash screen
                flashScreen(NOTIFICATION_TYPES.PREMIUM.flashColor);
                
                // Create notifications
                newPremium.forEach(prem => {
                    const propertyTitle = prem.propertyTitle || 'Unknown Property';
                    createNotification(NOTIFICATION_TYPES.PREMIUM, prem.notifId, {
                        title: NOTIFICATION_TYPES.PREMIUM.title,
                        message: `${propertyTitle} - collect $10k/week`,
                        timestamp: prem.createdAt,
                        data: prem
                    });
                });
            }
            
            // Update badges
            updateAllBadges();
            
        }, error => {
            console.error('[AdminNotify:Premium] Error:', error);
            AdminNotifications.premiumListenerActive = false;
        });
}

// ============================================================================
// PHOTO SERVICE REQUEST LISTENER (Revenue generating - IMPORTANT!)
// ============================================================================

function startPhotoRequestListener() {
    if (AdminNotifications.photoRequestsListenerActive) {
        console.log('[AdminNotify:Photo] Listener already active');
        return;
    }
    
    console.log('[AdminNotify:Photo] Starting listener...');
    AdminNotifications.photoRequestsListenerActive = true;
    
    // Listen to photoServiceRequests collection
    db.collection('photoServiceRequests')
        .where('viewed', '==', false)
        .orderBy('requestedAt', 'desc')
        .onSnapshot((snapshot) => {
            const isFirst = AdminNotifications.photoRequestsFirstSnapshot;
            const newRequests = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const notifId = NOTIFICATION_TYPES.PHOTO.prefix + doc.id;
                
                // Check if new to us
                if (!AdminNotifications.seenPhotoRequests.has(doc.id)) {
                    AdminNotifications.seenPhotoRequests.add(doc.id);
                    
                    if (!isFirst && !AdminNotifications.dismissed.has(notifId)) {
                        console.log('[AdminNotify:Photo] NEW PHOTO REQUEST:', data.userEmail, 'Package:', data.packageType);
                        newRequests.push({
                            id: doc.id,
                            notifId: notifId,
                            userEmail: data.userEmail || 'Anonymous',
                            username: data.username || 'Anonymous',
                            packageType: data.packageType || 'unknown',
                            packageName: data.packageName || 'Photo Services',
                            requestedAt: data.requestedAt?.toDate ? data.requestedAt.toDate() : new Date()
                        });
                    }
                }
                
                // Add to visible if not dismissed
                if (!AdminNotifications.dismissed.has(notifId)) {
                    if (!AdminNotifications.visible.has(notifId)) {
                        AdminNotifications.visible.set(notifId, {
                            type: 'photo',
                            data: { ...data, id: doc.id, notifId }
                        });
                    }
                }
            });
            
            // Mark first snapshot complete
            if (isFirst) {
                AdminNotifications.photoRequestsFirstSnapshot = false;
                console.log('[AdminNotify:Photo] Initial load complete, seen', AdminNotifications.seenPhotoRequests.size, 'photo requests');
                
                // Render existing photo notifications
                renderPendingNotifications(NOTIFICATION_TYPES.PHOTO);
            }
            
            // Handle new photo requests
            if (newRequests.length > 0) {
                // Flash screen (orange for revenue-generating!)
                flashScreen(NOTIFICATION_TYPES.PHOTO.flashColor);
                
                // Create notifications
                newRequests.forEach(req => {
                    const packageEmoji = req.packageType === 'bundle' ? '🎬' : '📷';
                    const packageLabel = req.packageType === 'bundle' ? 'PREMIUM BUNDLE $125k' : 'Per Photo $10k';
                    createNotification(NOTIFICATION_TYPES.PHOTO, req.notifId, {
                        title: `${packageEmoji} ${NOTIFICATION_TYPES.PHOTO.title}`,
                        message: `${req.username} wants ${packageLabel} - CALL THEM!`,
                        timestamp: req.requestedAt,
                        data: req
                    });
                });
            }
            
            // Update badges
            updateAllBadges();
            
        }, error => {
            console.error('[AdminNotify:Photo] Error:', error);
            AdminNotifications.photoRequestsListenerActive = false;
        });
}

// ============================================================================
// NOTIFICATION RENDERING
// ============================================================================

/**
 * Create and show a notification
 */
function createNotification(type, notifId, content) {
    // Skip if dismissed
    if (AdminNotifications.dismissed.has(notifId)) {
        return;
    }
    
    // Skip if already showing
    if (document.getElementById('notification-' + notifId)) {
        return;
    }
    
    // Add to visible map
    AdminNotifications.visible.set(notifId, {
        type: type.prefix,
        content: content
    });
    
    // Save to storage
    savePendingToStorage();
    
    // Render the notification
    renderNotificationCard(type, notifId, content);
    
    // Update badges
    updateAllBadges();
}

/**
 * Render a notification card to the DOM
 */
function renderNotificationCard(type, notifId, content) {
    const stack = document.getElementById('adminNotificationsStack');
    if (!stack) {
        console.warn('[AdminNotify] No notification stack element found');
        return;
    }
    
    // Show the stack
    stack.classList.remove('hidden');
    
    // Don't duplicate
    if (document.getElementById('notification-' + notifId)) {
        return;
    }
    
    // Format timestamp
    const timeStr = content.timestamp ? formatNotificationTime(content.timestamp) : '';
    
    // Create notification HTML
    const card = document.createElement('div');
    card.id = 'notification-' + notifId;
    card.className = `relative overflow-hidden rounded-xl shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r ${type.bgGradient}`;
    card.onclick = () => scrollToRelevantSection(type);
    
    card.innerHTML = `
        <div class="p-4">
            <div class="flex items-start gap-3">
                <div class="text-3xl">${type.icon}</div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-white text-lg">${content.title}</h4>
                    <p class="text-white/90 text-sm">${content.message}</p>
                    ${timeStr ? `<p class="text-white/70 text-xs mt-1">${timeStr}</p>` : ''}
                </div>
                <button onclick="event.stopPropagation(); dismissAdminNotification('${notifId}')" 
                        class="text-white/80 hover:text-white text-2xl font-bold leading-none p-1">×</button>
            </div>
        </div>
    `;
    
    // Add with animation
    card.style.opacity = '0';
    card.style.transform = 'translateY(-20px)';
    stack.appendChild(card);
    
    // Trigger animation
    requestAnimationFrame(() => {
        card.style.transition = 'all 0.3s ease-out';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    });
}

/**
 * Render pending notifications from storage
 */
function renderPendingNotifications(type) {
    AdminNotifications.visible.forEach((data, notifId) => {
        if (notifId.startsWith(type.prefix) && !AdminNotifications.dismissed.has(notifId)) {
            // Reconstruct content from stored data or fetch it
            if (data.content) {
                renderNotificationCard(type, notifId, data.content);
            } else if (data.data) {
                // Premium notifications have data stored directly
                const prem = data.data;
                renderNotificationCard(type, notifId, {
                    title: type.title,
                    message: `${prem.propertyTitle || prem.title} - collect $10k/week`,
                    timestamp: prem.createdAt,
                    data: prem
                });
            }
        }
    });
}

/**
 * Dismiss a notification (admin notifications)
 */
window.dismissAdminNotification = async function(notifId) {
    console.log('[AdminNotify] Dismissing:', notifId);
    
    // Add to dismissed set
    AdminNotifications.dismissed.add(notifId);
    
    // Remove from visible
    AdminNotifications.visible.delete(notifId);
    
    // Save dismissed to localStorage
    try {
        const dismissed = Array.from(AdminNotifications.dismissed);
        localStorage.setItem('adminDismissedNotifications', JSON.stringify(dismissed));
    } catch (e) {}
    
    // Save pending to localStorage
    savePendingToStorage();
    
    // Remove from DOM with animation
    const card = document.getElementById('notification-' + notifId);
    if (card) {
        card.style.transition = 'all 0.3s ease-out';
        card.style.opacity = '0';
        card.style.transform = 'translateX(100%)';
        setTimeout(() => card.remove(), 300);
    }
    
    // If it's a premium notification, also dismiss in Firestore
    if (notifId.startsWith(NOTIFICATION_TYPES.PREMIUM.prefix)) {
        const docId = notifId.replace(NOTIFICATION_TYPES.PREMIUM.prefix, '');
        try {
            await db.collection('adminNotifications').doc(docId).update({
                dismissed: true,
                dismissedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (e) {
            console.log('[AdminNotify] Firestore dismiss error (may be expected):', e.message);
        }
    }
    
    // If it's a photo service request, mark as viewed in Firestore
    if (notifId.startsWith(NOTIFICATION_TYPES.PHOTO.prefix)) {
        const docId = notifId.replace(NOTIFICATION_TYPES.PHOTO.prefix, '');
        try {
            await db.collection('photoServiceRequests').doc(docId).update({
                viewed: true,
                viewedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (e) {
            console.log('[AdminNotify] Photo request dismiss error:', e.message);
        }
    }
    
    // Update badges
    updateAllBadges();
    
    // Hide stack if empty
    const stack = document.getElementById('adminNotificationsStack');
    if (stack && stack.children.length === 0) {
        stack.classList.add('hidden');
    }
};

/**
 * Clear all notifications
 */
window.clearAllAdminNotifications = async function() {
    console.log('[AdminNotify] Clearing all notifications');
    
    // Dismiss all visible
    const toRemove = Array.from(AdminNotifications.visible.keys());
    for (const notifId of toRemove) {
        await dismissAdminNotification(notifId);
    }
};

// ============================================================================
// BADGE MANAGEMENT
// ============================================================================

/**
 * Update all notification badges
 */
function updateAllBadges() {
    let userCount = 0;
    let listingCount = 0;
    let premiumCount = 0;
    let photoCount = 0;
    
    AdminNotifications.visible.forEach((data, notifId) => {
        if (AdminNotifications.dismissed.has(notifId)) return;
        
        if (notifId.startsWith(NOTIFICATION_TYPES.USER.prefix)) {
            userCount++;
        } else if (notifId.startsWith(NOTIFICATION_TYPES.LISTING.prefix)) {
            listingCount++;
        } else if (notifId.startsWith(NOTIFICATION_TYPES.PREMIUM.prefix)) {
            premiumCount++;
        } else if (notifId.startsWith(NOTIFICATION_TYPES.PHOTO.prefix)) {
            photoCount++;
        }
    });
    
    console.log('[AdminNotify:Badge] Counts:', { userCount, listingCount, premiumCount, photoCount });
    
    // Update user badge
    const userBadge = document.getElementById('adminNewUserBadge');
    const userCountEl = document.getElementById('adminNewUserCount');
    if (userBadge && userCountEl) {
        if (userCount > 0) {
            userCountEl.textContent = userCount > 9 ? '9+' : userCount;
            userBadge.style.display = 'flex';
        } else {
            userBadge.style.display = 'none';
        }
    }
    
    // Update listing badge
    const listingBadge = document.getElementById('adminNewListingBadge');
    const listingCountEl = document.getElementById('adminNewListingCount');
    if (listingBadge && listingCountEl) {
        if (listingCount > 0) {
            listingCountEl.textContent = listingCount > 9 ? '9+' : listingCount;
            listingBadge.style.display = 'flex';
        } else {
            listingBadge.style.display = 'none';
        }
    }
    
    // Update premium badge
    const premiumBadge = document.getElementById('adminNewPremiumBadge');
    const premiumCountEl = document.getElementById('adminNewPremiumCount');
    if (premiumBadge && premiumCountEl) {
        if (premiumCount > 0) {
            premiumCountEl.textContent = premiumCount > 9 ? '9+' : premiumCount;
            premiumBadge.style.display = 'flex';
        } else {
            premiumBadge.style.display = 'none';
        }
    }
    
    // Update photo request badge (revenue generating - important!)
    const photoBadge = document.getElementById('adminNewPhotoBadge');
    const photoCountEl = document.getElementById('adminNewPhotoCount');
    if (photoBadge && photoCountEl) {
        if (photoCount > 0) {
            photoCountEl.textContent = photoCount > 9 ? '9+' : photoCount;
            photoBadge.style.display = 'flex';
        } else {
            photoBadge.style.display = 'none';
        }
    }
    
    // Update container visibility
    const badgesContainer = document.getElementById('adminNotificationBadges');
    if (badgesContainer) {
        const total = userCount + listingCount + premiumCount + photoCount;
        badgesContainer.style.display = total > 0 ? 'flex' : 'none';
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Flash the screen with a color
 */
function flashScreen(color) {
    const colors = {
        blue: 'rgba(59, 130, 246, 0.3)',
        green: 'rgba(16, 185, 129, 0.3)',
        gold: 'rgba(245, 158, 11, 0.3)',
        orange: 'rgba(249, 115, 22, 0.4)',
        red: 'rgba(239, 68, 68, 0.3)'
    };
    
    const flashColor = colors[color] || colors.blue;
    
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: ${flashColor};
        z-index: 9999;
        pointer-events: none;
        animation: flashFade 0.5s ease-out forwards;
    `;
    
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);
}

/**
 * Format notification timestamp
 */
function formatNotificationTime(date) {
    if (!date) return '';
    
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

/**
 * Scroll to relevant section when notification clicked
 */
function scrollToRelevantSection(type) {
    if (type === NOTIFICATION_TYPES.USER) {
        // Scroll to users section
        const usersSection = document.getElementById('allUsersList');
        if (usersSection) {
            usersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } else if (type === NOTIFICATION_TYPES.LISTING) {
        // Go to properties page
        window.location.hash = 'properties';
    } else if (type === NOTIFICATION_TYPES.PREMIUM) {
        // Scroll to users section (premium info is there)
        const usersSection = document.getElementById('allUsersList');
        if (usersSection) {
            usersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

// ============================================================================
// CSS FOR FLASH ANIMATION
// ============================================================================

// Add flash animation CSS if not already present
if (!document.getElementById('notification-flash-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-flash-styles';
    style.textContent = `
        @keyframes flashFade {
            0% { opacity: 1; }
            100% { opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// ============================================================================
// EXPORTS
// ============================================================================

// Make key functions available globally
window.updateAllBadges = updateAllBadges;
window.NOTIFICATION_TYPES = NOTIFICATION_TYPES;

console.log('[AdminNotify] Notification module loaded');
