/**
 * ============================================================================
 * UI RENT NOTIFICATIONS - Rent notifications and user tier sync
 * ============================================================================
 * 
 * CONTENTS:
 * - Rent notifications panel
 * - User notifications
 * - User tier real-time sync
 * - Property deleted modal
 * - Nav tier display
 * 
 * DEPENDENCIES: TierService, PropertyDataService, NotificationManager
 * ============================================================================
 */

// ==================== RENT NOTIFICATIONS PANEL ====================
// NOTE: The main renderRentNotificationsPanel is handled by NotificationManager
// This legacy version is disabled to prevent conflicts. If you need to restore it,
// rename _DISABLED_renderRentNotificationsPanel back to renderRentNotificationsPanel
// and comment out the export in notification-manager.js

window._DISABLED_renderRentNotificationsPanel = function() {
    const panel = $('rentNotificationsPanel');
    if (!panel) return;
    
    // Show for all logged-in users (they see only their own properties)
    if (!auth.currentUser?.email) {
        panel.className = 'hidden';
        return;
    }
    
    const rentData = window.AdminNotifications?.rentNotifications;
    if (!rentData) {
        panel.className = 'hidden';
        return;
    }
    
    const { overdue, today, tomorrow } = rentData;
    const total = overdue.length + today.length + tomorrow.length;
    
    if (total === 0) {
        panel.className = 'hidden';
        return;
    }
    
    // Build the panel HTML
    let html = `
        <div class="glass-effect rounded-2xl shadow-2xl overflow-hidden border-2 ${overdue.length > 0 ? 'border-red-500/70' : today.length > 0 ? 'border-orange-500/70' : 'border-yellow-500/70'}">
            <div class="bg-gradient-to-r ${overdue.length > 0 ? 'from-red-600 to-red-700' : today.length > 0 ? 'from-orange-500 to-red-500' : 'from-yellow-500 to-orange-400'} px-6 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">${overdue.length > 0 ? '🚨' : today.length > 0 ? '⏰' : '📅'}</span>
                        <div>
                            <h3 class="text-xl font-bold text-white">Rent Collection Alert</h3>
                            <p class="text-white/80 text-sm">${total} payment${total !== 1 ? 's' : ''} need${total === 1 ? 's' : ''} attention</p>
                        </div>
                    </div>
                    <button onclick="toggleRentPanelExpand()" id="rentPanelToggle" class="text-white/80 hover:text-white transition">
                        <svg class="w-6 h-6 transform transition-transform" id="rentPanelArrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div id="rentPanelContent" class="p-4 space-y-4">
    `;
    
    // Overdue section
    if (overdue.length > 0) {
        html += `
            <div class="bg-red-900/30 rounded-xl p-4 border border-red-500/50">
                <h4 class="text-red-400 font-bold mb-3 flex items-center gap-2">
                    <span>🚨</span> OVERDUE (${overdue.length})
                    <span class="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">ACTION REQUIRED</span>
                </h4>
                <div class="space-y-2">
                    ${overdue.map(r => renderRentItem(r, 'overdue')).join('')}
                </div>
            </div>
        `;
    }
    
    // Due today section
    if (today.length > 0) {
        html += `
            <div class="bg-orange-900/30 rounded-xl p-4 border border-orange-500/50">
                <h4 class="text-orange-400 font-bold mb-3 flex items-center gap-2">
                    <span>⏰</span> Due TODAY (${today.length})
                </h4>
                <div class="space-y-2">
                    ${today.map(r => renderRentItem(r, 'today')).join('')}
                </div>
            </div>
        `;
    }
    
    // Due tomorrow section
    if (tomorrow.length > 0) {
        html += `
            <div class="bg-yellow-900/30 rounded-xl p-4 border border-yellow-500/50">
                <h4 class="text-yellow-400 font-bold mb-3 flex items-center gap-2">
                    <span>📅</span> Due Tomorrow (${tomorrow.length})
                </h4>
                <div class="space-y-2">
                    ${tomorrow.map(r => renderRentItem(r, 'tomorrow')).join('')}
                </div>
            </div>
        `;
    }
    
    html += `
            </div>
        </div>
    `;
    
    panel.innerHTML = html;
    panel.className = 'mb-6';
};

/**
 * Render a single rent item in the panel
 */
function renderRentItem(rent, urgency) {
    const statusColor = urgency === 'overdue' ? 'text-red-400' 
                      : urgency === 'today' ? 'text-orange-400' 
                      : 'text-yellow-400';
    
    const daysText = rent.daysUntilDue < 0 
        ? `${Math.abs(rent.daysUntilDue)}d overdue`
        : rent.daysUntilDue === 0 
        ? 'TODAY'
        : 'Tomorrow';
    
    // Get first name for friendly greeting
    const firstName = window.getFirstName ? window.getFirstName(rent.renterName) : rent.renterName;
    const propertyAddress = rent.propertyTitle || 'your rental';
    
    // Generate reminder message
    let reminderMsg = '';
    if (rent.daysUntilDue === 1) {
        reminderMsg = `Hey ${firstName}! 👋 Just a friendly reminder that your ${rent.frequency} rent payment of $${rent.amount.toLocaleString()} for ${propertyAddress} is due tomorrow (${rent.nextDueFormatted}). Let me know if you have any questions!`;
    } else if (rent.daysUntilDue === 0) {
        reminderMsg = `Hey ${firstName}! 👋 Just a friendly reminder that your ${rent.frequency} rent payment of $${rent.amount.toLocaleString()} for ${propertyAddress} is due today (${rent.nextDueFormatted}). Let me know if you have any questions!`;
    } else if (rent.daysUntilDue < 0) {
        const daysOverdue = Math.abs(rent.daysUntilDue);
        if (daysOverdue >= 3) {
            // 3+ days overdue - eviction warning
            reminderMsg = `Hey ${firstName}, your ${rent.frequency} rent payment of $${rent.amount.toLocaleString()} for ${propertyAddress} was due on ${rent.nextDueFormatted} (${daysOverdue} day${daysOverdue > 1 ? 's' : ''} ago). ⚠️ You are scheduled for eviction in 24 hours if payment is not received. Please make your payment immediately or contact me to discuss your situation.`;
        } else {
            reminderMsg = `Hey ${firstName}, your ${rent.frequency} rent payment of $${rent.amount.toLocaleString()} for ${propertyAddress} was due on ${rent.nextDueFormatted} (${daysOverdue} day${daysOverdue > 1 ? 's' : ''} ago). Please make your payment as soon as possible. Let me know if you need to discuss anything!`;
        }
    }
    
    const escapedReminder = reminderMsg.replace(/'/g, "\\'").replace(/"/g, '\\"');
    
    return `
        <div class="flex items-center justify-between bg-gray-800/50 rounded-lg p-3 hover:bg-gray-700/50 transition group">
            <div class="flex-1 min-w-0 cursor-pointer" onclick="viewPropertyStats(${rent.propertyId})">
                <div class="font-semibold text-white truncate">${rent.propertyTitle}</div>
                <div class="text-sm text-gray-400 flex items-center gap-2 flex-wrap">
                    <span>👤 ${rent.renterName}</span>
                    <span class="text-gray-600">•</span>
                    <span class="capitalize">${rent.frequency}</span>
                    <span class="text-gray-600">•</span>
                    <span class="text-green-400 font-semibold">$${rent.amount.toLocaleString()}</span>
                </div>
            </div>
            <div class="flex items-center gap-2 ml-2">
                <span class="${statusColor} font-bold text-sm whitespace-nowrap">${daysText}</span>
                ${reminderMsg ? `
                    <button onclick="copyRentReminder('${escapedReminder}')" 
                            class="opacity-0 group-hover:opacity-100 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs px-2 py-1 rounded-lg font-semibold hover:opacity-80 transition flex items-center gap-1"
                            title="Copy reminder message">
                        📋 Copy
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Toggle rent panel expand/collapse
 */
window.toggleRentPanelExpand = function() {
    const content = $('rentPanelContent');
    const arrow = $('rentPanelArrow');
    if (content && arrow) {
        content.classList.toggle('hidden');
        arrow.classList.toggle('rotate-180');
    }
};

/**
 * Copy rent reminder to clipboard
 */
window.copyRentReminder = function(message) {
    navigator.clipboard.writeText(message).then(() => {
        showToast('📋 Reminder copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showToast('Failed to copy message', 'error');
    });
};

// ==================== USER NOTIFICATIONS ====================
// Store the listener unsubscribe function
window.userNotificationUnsubscribe = null;

window.loadUserNotifications = async function() {
    const user = auth.currentUser;
    if (!user) return;
    
    // Start tier listener for real-time tier updates
    startUserTierListener();
    
    // Start admin notifications listener (only works for master admin)
    if (typeof startAdminNotificationsListener === 'function') {
        startAdminNotificationsListener();
    }
    
    const banner = $('userNotificationsBanner');
    const container = $('userNotificationsContainer');
    if (!banner || !container) return;
    
    // Unsubscribe from previous listener if exists
    if (window.userNotificationUnsubscribe) {
        window.userNotificationUnsubscribe();
        window.userNotificationUnsubscribe = null;
    }
    
    try {
        // Set up real-time listener for user's notifications
        window.userNotificationUnsubscribe = db.collection('userNotifications')
            .where('userEmail', '==', user.email.toLowerCase())
            .where('read', '==', false)
            .onSnapshot((snapshot) => {
                const userBadge = $('userNotificationBadge');
                const userCount = $('userNotificationCount');
                const mobileUserBadge = $('mobileUserNotifBadge');
                
                if (snapshot.empty) {
                    hideElement(banner);
                    container.innerHTML = '';
                    // Hide header badge
                    if (userBadge) hideElement(userBadge);
                    // Hide mobile badge
                    if (mobileUserBadge) mobileUserBadge.classList.add('hidden');
                    return;
                }
                
                const notifications = [];
                snapshot.forEach(doc => {
                    notifications.push({ id: doc.id, ...doc.data() });
                });
                
                // Update header badge
                if (userBadge && userCount) {
                    userCount.textContent = notifications.length > 9 ? '9+' : notifications.length;
                    showElement(userBadge);
                }
                
                // Update mobile badge (for non-admin users)
                if (mobileUserBadge && !TierService.isMasterAdmin(auth.currentUser?.email)) {
                    mobileUserBadge.classList.remove('hidden');
                }
                
                // Check for upgrade-related notifications to refresh pending status
                const hasUpgradeNotification = notifications.some(n => 
                    n.type === 'upgrade_approved' || n.type === 'upgrade_denied' || n.type === 'upgrade'
                );
                if (hasUpgradeNotification) {
                    // Refresh pending upgrade request status
                    checkPendingUpgradeRequest(user.email);
                }
                
                // Sort by createdAt descending (client-side to avoid index requirement)
                notifications.sort((a, b) => {
                    const aTime = a.createdAt?.toDate?.() || new Date(0);
                    const bTime = b.createdAt?.toDate?.() || new Date(0);
                    return bTime - aTime;
                });
                
                // Limit to 5 most recent
                const recentNotifs = notifications.slice(0, 5);
                
                container.innerHTML = recentNotifs.map(notif => {
                    const isApproval = notif.type === 'upgrade_approved' || notif.type === 'upgrade';
                    const isDenial = notif.type === 'upgrade_denied';
                    
                    let bgColor, borderColor, icon;
                    if (isApproval) {
                        bgColor = 'from-green-600/20 to-emerald-600/20';
                        borderColor = 'border-green-500/50';
                        icon = '🎉';
                    } else if (isDenial) {
                        bgColor = 'from-red-600/20 to-orange-600/20';
                        borderColor = 'border-red-500/50';
                        icon = '❌';
                    } else {
                        bgColor = 'from-blue-600/20 to-purple-600/20';
                        borderColor = 'border-blue-500/50';
                        icon = '📢';
                    }
                    
                    // Special styling for trial notifications
                    if (notif.isTrial) {
                        bgColor = 'from-cyan-600/20 to-blue-600/20';
                        borderColor = 'border-cyan-500/50';
                        icon = '🎁';
                    }
                    
                    return `
                        <div id="notif-${notif.id}" class="bg-gradient-to-r ${bgColor} border ${borderColor} rounded-xl p-4 flex items-start justify-between gap-4">
                            <div class="flex items-start gap-3">
                                <span class="text-2xl">${icon}</span>
                                <div>
                                    <h4 class="text-white font-bold">${notif.title}</h4>
                                    <p class="text-gray-300 text-sm mt-1">${notif.message}</p>
                                    ${notif.isTrial && notif.trialEndDate ? `<p class="text-cyan-400 text-xs mt-2 font-medium">Trial ends: ${new Date(notif.trialEndDate).toLocaleDateString()}</p>` : ''}
                                    ${notif.createdAt?.toDate ? `<p class="text-gray-500 text-xs mt-2">${notif.createdAt.toDate().toLocaleString()}</p>` : ''}
                                </div>
                            </div>
                            <button onclick="dismissUserNotification('${notif.id}')" 
                                class="text-gray-400 hover:text-white transition p-1 flex-shrink-0"
                                title="Dismiss notification">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                    `;
                }).join('');
                
                showElement(banner);
                
            }, (error) => {
                // Handle permission errors silently - user just won't see notifications
                hideElement(banner);
                const userBadge = $('userNotificationBadge');
                if (userBadge) hideElement(userBadge);
            });
        
    } catch (error) {
        console.error('Error setting up user notifications:', error);
        hideElement(banner);
    }
};

window.dismissUserNotification = async function(notificationId) {
    try {
        // Mark as read in Firestore
        await db.collection('userNotifications').doc(notificationId).update({
            read: true,
            readAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Animate out
        const notifEl = $(`notif-${notificationId}`);
        if (notifEl) {
            notifEl.style.transition = 'all 0.3s ease';
            notifEl.style.opacity = '0';
            notifEl.style.transform = 'translateX(20px)';
            setTimeout(() => {
                notifEl.remove();
                // Check if any notifications remain
                const container = $('userNotificationsContainer');
                if (container && container.children.length === 0) {
                    hideElement($('userNotificationsBanner'));
                }
            }, 300);
        }
        
    } catch (error) {
        console.error('Error dismissing user notification:', error);
    }
};

// ==================== USER TIER REAL-TIME SYNC ====================
window.userTierUnsubscribe = null;
window.isCreatingAccount = false; // Flag to prevent false "deleted" detection during account creation

// Scroll to user notifications banner when clicking header badge
window.scrollToUserNotifications = function() {
    const banner = $('userNotificationsBanner');
    const dashboard = $('ownerDashboard');
    
    // Make sure dashboard is visible
    if (dashboard && dashboard.classList.contains('hidden')) {
        goToDashboard();
    }
    
    // Scroll to banner
    if (banner) {
        setTimeout(() => {
            banner.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
};

window.startUserTierListener = function() {
    const user = auth.currentUser;
    if (!user) return;
    
    // Don't listen for master admin
    if (TierService.isMasterAdmin(user.email)) return;
    
    // Unsubscribe from previous listener
    if (window.userTierUnsubscribe) {
        window.userTierUnsubscribe();
        window.userTierUnsubscribe = null;
    }
    
    try {
        window.userTierUnsubscribe = db.collection('users').doc(user.uid)
            .onSnapshot(async (doc) => {
                if (!doc.exists) {
                    // Check if we're in the middle of creating an account
                    if (window.isCreatingAccount) {
                        return;
                    }
                    // User document was deleted - force logout
                    forceLogout();
                    return;
                }
                
                const data = doc.data();
                const newTier = data.tier || 'starter';
                
                // CHECK FOR PROPERTY DELETION NOTIFICATION
                if (data.deletedProperty && !data.deletedProperty.acknowledged) {
                    const deletedProp = data.deletedProperty;
                    
                    // Remove from local properties array
                    const index = properties.findIndex(p => 
                        p.id === deletedProp.propertyId || String(p.id) === String(deletedProp.propertyId)
                    );
                    if (index !== -1) {
                        properties.splice(index, 1);
                    }
                    
                    // Remove from owner map
                    const lowerEmail = user.email.toLowerCase();
                    if (ownerPropertyMap[lowerEmail]) {
                        ownerPropertyMap[lowerEmail] = ownerPropertyMap[lowerEmail].filter(
                            id => id !== deletedProp.propertyId && String(id) !== String(deletedProp.propertyId)
                        );
                    }
                    
                    // Remove from availability state
                    delete state.availability[deletedProp.propertyId];
                    
                    // Show notification modal
                    showPropertyDeletedModal(deletedProp.propertyTitle || 'Your property');
                    
                    // Mark as acknowledged
                    await db.collection('users').doc(user.uid).update({
                        'deletedProperty.acknowledged': true
                    });
                }
                
                // Check if tier changed
                if (state.userTier && state.userTier !== newTier) {
                    // Update state
                    state.userTier = newTier;
                    
                    // Update tier badge in dashboard
                    updateTierBadge(newTier, user.email);
                    
                    // Update navbar tier display
                    updateNavTierDisplay(newTier);
                    
                    // Re-check pending requests (should disappear now)
                    checkPendingUpgradeRequest(user.email);
                } else if (!state.userTier) {
                    state.userTier = newTier;
                }
            }, (error) => {
                // If permission denied, user may have been deleted
                if (error.code === 'permission-denied') {
                    forceLogout();
                }
            });
    } catch (error) {
        console.error('Error setting up tier listener:', error);
    }
};

// Show property deleted modal (called from tier listener)
window.showPropertyDeletedModal = function(propertyTitle) {
    const modalHTML = `
        <div id="propertyDeletedModal" class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div class="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-red-700 text-center">
                <div class="text-6xl mb-4">🗑️</div>
                <h3 class="text-xl font-bold text-red-400 mb-4">Property Deleted</h3>
                <p class="text-gray-300 mb-2">The property "<strong>${propertyTitle}</strong>" has been deleted by an administrator.</p>
                <p class="text-gray-400 text-sm mb-6">Your dashboard will be refreshed.</p>
                <button onclick="closePropertyDeletedModal()" 
                        class="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 rounded-xl font-bold hover:opacity-90 transition">
                    OK
                </button>
            </div>
        </div>
    `;
    
    const existingModal = $('propertyDeletedModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

// Close property deleted modal and refresh UI
window.closePropertyDeletedModal = function() {
    const modal = $('propertyDeletedModal');
    if (modal) modal.remove();
    
    // Clear current property state
    state.currentPropertyId = null;
    
    // Hide property pages, show dashboard
    hideElement($('propertyStatsPage'));
    hideElement($('propertyDetailPage'));
    showElement($('ownerDashboard'));
    
    // Refresh dashboard
    if (typeof renderOwnerDashboard === 'function') {
        renderOwnerDashboard();
    }
    
    // Refresh property grid
    if (typeof renderProperties === 'function') {
        renderProperties(properties);
    }
};

// Update navbar tier display
window.updateNavTierDisplay = function(tier) {
    const navTierEl = $('navUserTier');
    if (!navTierEl) return;
    
    const tierData = TIERS[tier] || TIERS.starter;
    navTierEl.innerHTML = `${tierData.icon} ${tierData.name}`;
    
    // Update color classes (Pro tier removed)
    navTierEl.className = 'text-xs';
    if (tier === 'elite') {
        navTierEl.classList.add('text-purple-400');
    } else if (tier === 'starter' || !tier) {
        navTierEl.classList.add('text-green-400');
    } else {
        navTierEl.classList.add('text-gray-400');
    }
};

