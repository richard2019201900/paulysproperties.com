/**
 * ============================================================================
 * UI ADMIN - Admin panel core functionality
 * ============================================================================
 * 
 * CONTENTS:
 * - Admin tab switching
 * - Upgrade request management
 * - Photo service requests
 * - Request approval/denial
 * - Admin persistent notifications
 * - New user/listing notifications
 * - Activity log
 * - Admin stats display
 * - Admin user list rendering
 * - User properties expansion
 * - User filtering
 * 
 * DEPENDENCIES: TierService, PropertyDataService, UserPreferencesService
 * ============================================================================
 */

// ==================== ADMIN FUNCTIONS ====================
// Store users for filtering
window.adminUsersData = [];

window.switchAdminTab = function(tab) {
    const tabs = ['users', 'agents', 'requests', 'create', 'history', 'tools', 'log'];
    const tabElements = {
        users: $('adminUsersTab'),
        agents: $('adminAgentsTab'),
        requests: $('adminRequestsTab'),
        create: $('adminCreateTab'),
        history: $('adminHistoryTab'),
        tools: $('adminToolsTab'),
        log: $('adminLogTab')
    };
    const tabButtons = {
        users: $('adminTabUsers'),
        agents: $('adminTabAgents'),
        requests: $('adminTabRequests'),
        create: $('adminTabCreate'),
        history: $('adminTabHistory'),
        tools: $('adminTabTools'),
        log: $('adminTabLog')
    };
    
    tabs.forEach(t => {
        if (tabElements[t]) {
            if (t === tab) {
                showElement(tabElements[t]);
                if (tabButtons[t]) {
                    tabButtons[t].className = 'px-4 py-2 rounded-lg font-bold text-sm bg-purple-600 text-white relative';
                }
            } else {
                hideElement(tabElements[t]);
                if (tabButtons[t]) {
                    tabButtons[t].className = 'px-4 py-2 rounded-lg font-bold text-sm bg-gray-700 text-gray-300 hover:bg-gray-600 relative';
                }
            }
        }
    });
    
    // Load data for the tab
    if (tab === 'users') loadAllUsers();
    else if (tab === 'agents' && typeof renderAgentsTab === 'function') renderAgentsTab();
    else if (tab === 'requests') {
        loadUpgradeRequests();
        loadPhotoRequests();
    }
    else if (tab === 'history') loadUpgradeHistory();
    else if (tab === 'log') loadActivityLog();
};

// Refresh all requests (upgrade + photo)
window.refreshAllRequests = function() {
    loadUpgradeRequests();
    loadPhotoRequests();
    showToast('🔄 Refreshing all requests...', 'info');
};

// Load and display pending upgrade requests
window.loadUpgradeRequests = async function() {
    const container = $('upgradeRequestsList');
    if (!container) return;
    
    container.innerHTML = '<p class="text-gray-500 italic">Loading requests...</p>';
    
    try {
        // Simple query without composite index requirement
        const snapshot = await db.collection('upgradeNotifications')
            .where('status', '==', 'pending')
            .get();
        
        if (snapshot.empty) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <span class="text-4xl">🎉</span>
                    <p class="text-gray-400 mt-2">No pending upgrade requests</p>
                    <p class="text-gray-500 text-sm">When users request upgrades, they'll appear here</p>
                </div>
            `;
            updateRequestsBadge(0);
            return;
        }
        
        const requests = [];
        snapshot.forEach(doc => {
            requests.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort by date client-side (to avoid needing composite index)
        requests.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA;
        });
        
        updateRequestsBadge(requests.length);
        
        container.innerHTML = requests.map(req => {
            const currentTierData = TIERS[req.currentTier] || TIERS.starter;
            const requestedTierData = TIERS[req.requestedTier] || TIERS.elite;  // Default to Elite (Pro removed)
            const date = req.createdAt?.toDate ? req.createdAt.toDate().toLocaleString() : 'Unknown';
            const price = '$25,000';  // Elite is $25k/month
            
            return `
                <div class="bg-gray-800 rounded-xl p-4 border border-orange-600/50">
                    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <span class="text-2xl">🔔</span>
                                <div>
                                    <div class="text-white font-bold">${req.displayName || req.userEmail?.split('@')[0] || 'Unknown'}</div>
                                    <div class="text-gray-500 text-xs">${req.userEmail || 'No email'}</div>
                                </div>
                            </div>
                            <div class="flex flex-wrap items-center gap-2 text-sm mb-2">
                                <span class="px-2 py-1 rounded ${currentTierData.bgColor} text-white font-bold text-xs">${currentTierData.icon} ${currentTierData.name}</span>
                                <span class="text-gray-500">→</span>
                                <span class="px-2 py-1 rounded ${requestedTierData.bgColor} text-white font-bold text-xs">${requestedTierData.icon} ${requestedTierData.name}</span>
                                <span class="text-green-400 font-bold">${price}/mo</span>
                            </div>
                            <div class="text-gray-500 text-xs">${date}</div>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <button onclick="approveUpgradeRequest('${req.id}', '${req.userEmail}', '${req.requestedTier}', '${req.currentTier}')" class="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition">
                                ✓ Approve
                            </button>
                            <button onclick="denyUpgradeRequest('${req.id}', '${req.userEmail}')" class="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition">
                                ✕ Deny
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading upgrade requests:', error);
        // If collection doesn't exist or permission denied, show empty state instead of error
        if (error.code === 'permission-denied' || error.code === 'failed-precondition' || error.message?.includes('index')) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <span class="text-4xl">🎉</span>
                    <p class="text-gray-400 mt-2">No pending upgrade requests</p>
                    <p class="text-gray-500 text-sm">When users request upgrades, they'll appear here</p>
                </div>
            `;
            updateRequestsBadge(0);
        } else {
            container.innerHTML = `
                <div class="text-center py-8">
                    <span class="text-4xl">🎉</span>
                    <p class="text-gray-400 mt-2">No pending upgrade requests</p>
                    <p class="text-gray-500 text-sm">When users request upgrades, they'll appear here</p>
                </div>
            `;
            updateRequestsBadge(0);
        }
    }
};

// Update request badge counts
window.updateRequestsBadge = function(count) {
    const badge = $('requestsTabBadge');
    const notificationBadge = $('upgradeNotificationBadge');
    const notificationCount = $('upgradeNotificationCount');
    const alertBox = $('pendingUpgradesAlert');
    const alertCount = $('pendingUpgradesCount');
    
    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
    
    if (notificationBadge) {
        if (count > 0) {
            notificationBadge.classList.remove('hidden');
            if (notificationCount) notificationCount.textContent = `${count} pending`;
        } else {
            notificationBadge.classList.add('hidden');
        }
    }
    
    if (alertBox) {
        if (count > 0) {
            alertBox.classList.remove('hidden');
            if (alertCount) alertCount.textContent = `${count} user${count > 1 ? 's' : ''} waiting for approval`;
        } else {
            alertBox.classList.add('hidden');
        }
    }
};

// ==================== PHOTO SERVICE REQUESTS ====================

/**
 * Load and display photo service requests in the Requests tab
 */
window.loadPhotoRequests = async function() {
    const container = $('photoRequestsList');
    const badge = $('photoRequestsBadge');
    
    if (!container) return;
    
    container.innerHTML = '<p class="text-gray-500 italic">Loading photo requests...</p>';
    
    try {
        // Get all photo requests (no ordering to avoid index issues)
        const snapshot = await db.collection('photoServiceRequests')
            .limit(50)
            .get();
        
        const requests = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Get timestamp from either field
            const timestamp = data.timestamp || data.requestedAt || data.createdAt;
            requests.push({ 
                id: doc.id, 
                ...data,
                _sortTime: timestamp?.toDate ? timestamp.toDate() : new Date(0)
            });
        });
        
        // Sort by timestamp descending (newest first)
        requests.sort((a, b) => b._sortTime - a._sortTime);
        
        // Count unreviewed requests (same logic as notification system)
        const unreviewedCount = requests.filter(r => !r.reviewed && !r.viewed).length;
        
        // Update badge
        if (badge) {
            if (unreviewedCount > 0) {
                badge.textContent = unreviewedCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
        
        if (requests.length === 0) {
            container.innerHTML = `
                <div class="text-center py-6">
                    <span class="text-4xl">📸</span>
                    <p class="text-gray-400 mt-2">No photo service requests</p>
                    <p class="text-gray-500 text-sm">Contact form submissions will appear here</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = requests.map(req => {
            const date = req._sortTime && req._sortTime.getTime() > 0 ? 
                req._sortTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) :
                'Unknown date';
            
            const isReviewed = req.reviewed || req.viewed || false;
            const reviewedClass = isReviewed ? 'opacity-60' : '';
            const highlightClass = !isReviewed ? 'border-purple-500/50 bg-purple-900/10' : 'border-gray-700';
            
            return `
                <div id="photoRequest-${req.id}" class="bg-gray-800 rounded-xl p-4 border ${highlightClass} ${reviewedClass} transition-all">
                    <div class="flex flex-col md:flex-row justify-between gap-4">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-2">
                                ${!isReviewed ? '<span class="bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded">NEW</span>' : ''}
                                <span class="text-white font-bold">${escapeHtml(req.name || 'Anonymous')}</span>
                            </div>
                            <div class="space-y-1 text-sm">
                                <p class="text-gray-400">
                                    <span class="text-gray-500">Email:</span> 
                                    <a href="mailto:${escapeHtml(req.userEmail || req.email || '')}" class="text-cyan-400 hover:underline">${escapeHtml(req.userEmail || req.email || 'N/A')}</a>
                                </p>
                                <p class="text-gray-400">
                                    <span class="text-gray-500">Phone:</span> 
                                    <a href="tel:${escapeHtml(req.phone || '')}" class="text-cyan-400 hover:underline">${escapeHtml(req.phone || 'N/A')}</a>
                                </p>
                                <p class="text-gray-400">
                                    <span class="text-gray-500">Property:</span> 
                                    <span class="text-white">${escapeHtml(req.propertyTitle || req.propertyName || req.property || 'Not specified')}</span>
                                </p>
                                ${req.packageName ? `
                                <p class="text-gray-400">
                                    <span class="text-gray-500">Package:</span> 
                                    <span class="text-amber-400 font-semibold">${escapeHtml(req.packageName)}</span>
                                </p>
                                ` : ''}
                                ${req.message ? `
                                    <div class="mt-2 bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                                        <span class="text-gray-500 text-xs">Message:</span>
                                        <p class="text-gray-300 text-sm mt-1">${escapeHtml(req.message)}</p>
                                    </div>
                                ` : ''}
                            </div>
                            <div class="text-gray-500 text-xs mt-2">${date}</div>
                        </div>
                        <div class="flex flex-col gap-2">
                            ${!isReviewed ? `
                                <button onclick="markPhotoRequestReviewed('${req.id}')" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                    Mark Reviewed
                                </button>
                            ` : `
                                <span class="text-green-400 text-sm font-bold flex items-center gap-1">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                    Reviewed
                                </span>
                            `}
                            <button onclick="deletePhotoRequest('${req.id}')" class="bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white px-4 py-2 rounded-lg font-bold text-sm transition">
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading photo requests:', error);
        container.innerHTML = `
            <div class="text-center py-8 bg-gray-800/50 rounded-xl border border-gray-700">
                <span class="text-4xl">📸</span>
                <p class="text-gray-400 mt-2">No photo service requests</p>
            </div>
        `;
    }
};

/**
 * Mark a photo request as reviewed (clears the notification)
 */
window.markPhotoRequestReviewed = async function(requestId) {
    try {
        await db.collection('photoServiceRequests').doc(requestId).update({
            reviewed: true,
            viewed: true, // This is what the notification system checks
            reviewedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('✅ Photo request marked as reviewed', 'success');
        
        // Dismiss the notification from adminNotifications collection (new system)
        const notifId = 'photo-' + requestId;
        try {
            await db.collection('adminNotifications').doc(notifId).update({
                dismissed: true,
                dismissedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (e) {
            // Notification may not exist yet, that's OK
        }
        
        // Refresh the list
        loadPhotoRequests();
        
    } catch (error) {
        console.error('Error marking photo request as reviewed:', error);
        showToast('Error updating request', 'error');
    }
};

/**
 * Delete a photo request
 */
window.deletePhotoRequest = async function(requestId) {
    if (!confirm('Are you sure you want to delete this photo request?')) return;
    
    try {
        await db.collection('photoServiceRequests').doc(requestId).delete();
        
        showToast('🗑️ Photo request deleted', 'success');
        
        // Dismiss the notification from adminNotifications collection (new system)
        const notifId = 'photo-' + requestId;
        try {
            await db.collection('adminNotifications').doc(notifId).update({
                dismissed: true,
                dismissedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (e) {
            // Notification may not exist, that's OK
        }
        
        // Refresh the list
        loadPhotoRequests();
        
    } catch (error) {
        console.error('Error deleting photo request:', error);
        showToast('Error deleting request', 'error');
    }
};

// Approve upgrade request - show modal with trial option
window.approveUpgradeRequest = async function(requestId, userEmail, newTier, currentTier) {
    const tierData = TIERS[newTier];
    const price = '$25,000';  // Elite is $25k/month
    
    // No more prorated upgrades (Pro tier removed)
    const isProToElite = false;
    
    // Show approval modal with trial option
    const modalHTML = `
        <div id="approveModal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div class="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-green-700">
                <h3 class="text-xl font-bold text-white mb-4">✓ Approve Upgrade Request</h3>
                
                <div class="bg-gray-900/50 rounded-xl p-4 mb-4">
                    <p class="text-gray-300 mb-2"><strong>User:</strong> ${userEmail}</p>
                    <p class="text-gray-300 mb-2"><strong>Current Tier:</strong> <span class="text-gray-400">${TIERS[currentTier]?.name || currentTier}</span></p>
                    <p class="text-gray-300"><strong>Requested Tier:</strong> <span class="text-yellow-400 font-bold">${tierData?.icon || '👑'} ${tierData?.name || newTier}</span></p>
                    <p class="text-gray-300"><strong>Price:</strong> ${price}/month</p>
                </div>
                
                ${isProToElite ? `
                <!-- Prorated Upgrade Option (Pro → Elite) -->
                <div class="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-500/30 rounded-xl p-4 mb-4">
                    <label class="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" id="approveProratedCheckbox" class="w-5 h-5 rounded border-amber-500 text-amber-500 focus:ring-amber-500 cursor-pointer">
                        <div>
                            <span class="text-amber-300 font-bold">💰 Prorated Upgrade (${proratedPrice})</span>
                            <p class="text-amber-400/70 text-sm">User qualifies for prorated pricing</p>
                        </div>
                    </label>
                </div>
                ` : ''}
                
                <!-- Free Trial Checkbox -->
                <div class="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-xl p-4 mb-4">
                    <label class="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" id="approveTrialCheckbox" class="w-5 h-5 rounded border-cyan-500 text-cyan-500 focus:ring-cyan-500 cursor-pointer">
                        <div>
                            <span class="text-cyan-300 font-bold">🎁 Approve as Free Trial</span>
                            <p class="text-cyan-400/70 text-sm">Check this if approving as a promotional trial (won't count as revenue)</p>
                        </div>
                    </label>
                </div>
                
                <!-- Notes Field -->
                <div class="mb-4">
                    <label class="block text-gray-400 text-sm mb-2">Payment/Notes:</label>
                    <input type="text" id="approveNotes" 
                           class="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500"
                           placeholder="Payment confirmation or notes...">
                </div>
                
                <!-- Amount Display -->
                <div id="approveAmountDisplay" class="bg-gray-900/50 rounded-lg p-3 mb-4 text-center">
                    <span class="text-gray-400">Amount to collect: </span>
                    <span id="approveAmountValue" class="text-green-400 font-bold text-xl">${price}</span>
                </div>
                
                <!-- Buttons -->
                <div class="flex gap-3">
                    <button id="approveConfirmBtn" onclick="confirmApproveRequest('${requestId}', '${userEmail}', '${newTier}', '${currentTier}')" 
                            class="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-bold hover:opacity-90 transition">
                        ✓ Approve
                    </button>
                    <button onclick="closeApproveModal()" 
                            class="flex-1 bg-gray-700 text-white py-3 rounded-xl font-bold hover:bg-gray-600 transition">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = $('approveModal');
    if (existingModal) existingModal.remove();
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Set up checkbox event listeners
    const trialCheckbox = $('approveTrialCheckbox');
    const proratedCheckbox = $('approveProratedCheckbox');
    const notesInput = $('approveNotes');
    const amountValue = $('approveAmountValue');
    
    // Function to update amount display
    const updateAmountDisplay = () => {
        const isTrial = trialCheckbox?.checked;
        const isProrated = proratedCheckbox?.checked;
        
        if (isTrial) {
            amountValue.textContent = '$0 (Trial)';
            amountValue.className = 'text-cyan-400 font-bold text-xl';
        } else if (isProrated) {
            amountValue.textContent = proratedPrice;
            amountValue.className = 'text-amber-400 font-bold text-xl';
        } else {
            amountValue.textContent = price;
            amountValue.className = 'text-green-400 font-bold text-xl';
        }
    };
    
    if (trialCheckbox) {
        trialCheckbox.addEventListener('change', function() {
            // Uncheck prorated if trial is checked
            if (this.checked && proratedCheckbox) {
                proratedCheckbox.checked = false;
            }
            updateAmountDisplay();
        });
    }
    
    if (proratedCheckbox) {
        proratedCheckbox.addEventListener('change', function() {
            // Uncheck trial if prorated is checked
            if (this.checked && trialCheckbox) {
                trialCheckbox.checked = false;
            }
            
            if (this.checked) {
                notesInput.value = `Prorated upgrade - paid difference`;
            } else {
                if (notesInput.value.includes('Prorated')) {
                    notesInput.value = '';
                }
            }
            updateAmountDisplay();
        });
    }
};

window.closeApproveModal = function() {
    const modal = $('approveModal');
    if (modal) modal.remove();
};

window.confirmApproveRequest = async function(requestId, userEmail, newTier, currentTier) {
    const isTrial = $('approveTrialCheckbox')?.checked || false;
    const isProrated = $('approveProratedCheckbox')?.checked || false;
    const paymentNote = $('approveNotes')?.value || '';
    const tierData = TIERS[newTier];
    
    // Calculate actual subscription amount - Elite is $25k/month
    let subscriptionAmount = 25000;
    if (isTrial) {
        subscriptionAmount = 0;
    }
    
    // Show loading state
    const confirmBtn = $('approveConfirmBtn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span class="animate-pulse">⏳ Approving...</span>';
    }
    
    try {
        // Update user tier (with trial flag)
        await TierService.setUserTier(userEmail, newTier, currentTier, paymentNote, isTrial);
        
        // Set subscription payment date and trial status
        const snapshot = await db.collection('users').where('email', '==', userEmail).get();
        if (!snapshot.empty) {
            const userId = snapshot.docs[0].id;
            const today = new Date().toISOString().split('T')[0];
            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + 30);
            
            const updateData = {
                subscriptionLastPaid: today,
                subscriptionUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                isFreeTrial: isTrial,
                trialStartDate: isTrial ? today : null,
                trialEndDate: isTrial ? trialEndDate.toISOString().split('T')[0] : null,
                trialNotes: isTrial ? (paymentNote || 'Free trial from upgrade request') : null,
                // Track actual subscription amount for prorated upgrades
                subscriptionAmount: subscriptionAmount,
                isProratedUpgrade: isProrated,
                proratedFrom: isProrated ? currentTier : null,
                upgradeNotes: paymentNote || null
            };
            
            await db.collection('users').doc(userId).update(updateData);
        }
        
        // Mark request as approved
        await db.collection('upgradeNotifications').doc(requestId).update({
            status: 'approved',
            approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
            approvedBy: auth.currentUser?.email,
            paymentNote: paymentNote,
            isFreeTrial: isTrial,
            isProratedUpgrade: isProrated,
            subscriptionAmount: subscriptionAmount
        });
        
        // Create notification for user
        const trialNote = isTrial ? ' (Free Trial)' : '';
        const proratedNote = isProrated ? ' (Prorated from Pro)' : '';
        await db.collection('userNotifications').add({
            userEmail: userEmail.toLowerCase(),
            type: 'upgrade_approved',
            title: '🎉 Upgrade Approved!',
            message: `Your upgrade to ${tierData?.name || newTier}${trialNote}${proratedNote} has been approved! You now have access to ${tierData?.maxListings === Infinity ? 'unlimited' : tierData?.maxListings} listings.`,
            newTier: newTier,
            previousTier: currentTier,
            isFreeTrial: isTrial,
            isProratedUpgrade: isProrated,
            subscriptionAmount: subscriptionAmount,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            read: false
        });
        
        // Show success
        if (confirmBtn) {
            confirmBtn.innerHTML = '✓ Approved!';
        }
        
        // Log to activity log
        logAdminActivity('upgrade', {
            email: userEmail,
            previousTier: currentTier,
            newTier: newTier,
            isTrial: isTrial,
            isProrated: isProrated,
            amount: subscriptionAmount,
            approvedBy: auth.currentUser?.email
        });
        
        setTimeout(() => {
            closeApproveModal();
            const trialMsg = isTrial ? ' as FREE TRIAL' : '';
            const proratedMsg = isProrated ? ` (Prorated: $${(subscriptionAmount/1000).toFixed(0)}k)` : '';
            showToast(`${userEmail} upgraded to ${tierData?.name || newTier}${trialMsg}${proratedMsg}!`, 'success');
            loadUpgradeRequests();
            loadAllUsers();
            loadActivityLog(); // Refresh activity log
        }, 800);
        
    } catch (error) {
        console.error('Error approving request:', error);
        if (confirmBtn) {
            confirmBtn.innerHTML = '❌ Error - Try Again';
            confirmBtn.disabled = false;
        }
        alert('Error: ' + error.message);
    }
};

// Deny upgrade request
window.denyUpgradeRequest = async function(requestId, userEmail) {
    const reason = prompt(`Denying request from ${userEmail}\n\nReason (optional):`);
    if (reason === null) return;
    
    try {
        // Get the request details first
        const requestDoc = await db.collection('upgradeNotifications').doc(requestId).get();
        const requestData = requestDoc.data();
        
        // Update the request status
        await db.collection('upgradeNotifications').doc(requestId).update({
            status: 'denied',
            deniedAt: firebase.firestore.FieldValue.serverTimestamp(),
            deniedBy: auth.currentUser?.email,
            denyReason: reason || 'No reason provided'
        });
        
        // Log denial to upgradeHistory
        await db.collection('upgradeHistory').add({
            userEmail: userEmail.toLowerCase(),
            previousTier: requestData?.currentTier || 'starter',
            newTier: 'DENIED: ' + (requestData?.requestedTier || 'unknown'),
            upgradedAt: firebase.firestore.FieldValue.serverTimestamp(),
            upgradedBy: auth.currentUser?.email || 'admin',
            paymentNote: `❌ Request denied${reason ? ': ' + reason : ''}`,
            price: 0,
            type: 'denial'
        });
        
        // Create notification for user
        const requestedTierName = TIERS[requestData?.requestedTier]?.name || requestData?.requestedTier || 'requested tier';
        await db.collection('userNotifications').add({
            userEmail: userEmail.toLowerCase(),
            type: 'upgrade_denied',
            title: '❌ Upgrade Request Denied',
            message: `Your upgrade request to ${requestedTierName} was not approved.${reason ? ' Reason: ' + reason : ''} Please contact the site owner if you have questions.`,
            requestedTier: requestData?.requestedTier,
            reason: reason || 'No reason provided',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            read: false
        });
        
        // Log to activity log
        logAdminActivity('denial', {
            email: userEmail,
            requestedTier: requestData?.requestedTier,
            currentTier: requestData?.currentTier,
            reason: reason || 'No reason provided',
            deniedBy: auth.currentUser?.email
        });
        
        alert(`Request from ${userEmail} has been denied. User will be notified.`);
        loadUpgradeRequests();
        loadUpgradeHistory(); // Refresh history to show denial
        loadActivityLog(); // Refresh activity log
        
    } catch (error) {
        console.error('Error denying request:', error);
        alert('Error: ' + error.message);
    }
};

// Store upgrade request listener unsubscribe function
window.upgradeRequestUnsubscribe = null;
window.lastKnownRequestCount = -1;
window.adminPendingRequests = [];
window.adminAlertShownForRequests = new Set();
window.adminPollInterval = null;

// Load pending requests with real-time listener AND polling backup (for admin)
window.loadPendingUpgradeRequests = function() {
    const currentEmail = auth.currentUser?.email;
    
    if (!TierService.isMasterAdmin(currentEmail)) {
        return;
    }
    
    // Clear any existing poll interval
    if (window.adminPollInterval) {
        clearInterval(window.adminPollInterval);
        window.adminPollInterval = null;
    }
    
    // Unsubscribe from previous listener if exists
    if (window.upgradeRequestUnsubscribe) {
        window.upgradeRequestUnsubscribe();
        window.upgradeRequestUnsubscribe = null;
    }
    
    // Function to check for pending requests
    const checkPendingRequests = async () => {
        try {
            const snapshot = await db.collection('upgradeNotifications')
                .where('status', '==', 'pending')
                .get();
            
            processRequestSnapshot(snapshot);
            
        } catch (error) {
            console.error('[AdminAlert] Poll error:', error);
        }
    };
    
    // Try to set up real-time listener
    try {
        window.upgradeRequestUnsubscribe = db.collection('upgradeNotifications')
            .where('status', '==', 'pending')
            .onSnapshot((snapshot) => {
                processRequestSnapshot(snapshot);
            }, (error) => {
                console.error('[AdminAlert] Listener error:', error);
            });
            
    } catch (error) {
        console.error('[AdminAlert] Error setting up listener:', error);
    }
    
    // ALSO set up polling as backup (every 5 seconds)
    checkPendingRequests();
    window.adminPollInterval = setInterval(checkPendingRequests, 5000);
};

// Process request snapshot (used by both listener and polling)
window.processRequestSnapshot = function(snapshot) {
    const count = snapshot.size;
    
    // Store all pending requests
    const pendingRequests = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        pendingRequests.push({ id: doc.id, ...data });
    });
    
    // Check if pending requests have actually changed
    const currentIds = new Set(pendingRequests.map(r => r.id));
    const previousIds = new Set((window.adminPendingRequests || []).map(r => r.id));
    const hasChanged = currentIds.size !== previousIds.size || 
                       [...currentIds].some(id => !previousIds.has(id)) ||
                       [...previousIds].some(id => !currentIds.has(id));
    
    window.adminPendingRequests = pendingRequests;
    
    // Update the badge count (always)
    updateRequestsBadge(count);
    
    // Only refresh user list if pending requests have actually changed
    // This prevents collapsing open property lists during polling
    if (hasChanged && window.adminUsersData && window.adminUsersData.length > 0) {
        const searchTerm = ($('adminUserSearch')?.value || '').toLowerCase();
        const filtered = searchTerm 
            ? window.adminUsersData.filter(user => 
                user.email.toLowerCase().includes(searchTerm) ||
                (user.username || '').toLowerCase().includes(searchTerm))
            : window.adminUsersData;
        renderAdminUsersList(filtered, pendingRequests);
    }
    
    // Check for NEW requests we haven't alerted about
    pendingRequests.forEach(req => {
        if (!window.adminAlertShownForRequests.has(req.id)) {
            window.adminAlertShownForRequests.add(req.id);
            
            // Show alert for new request (skip first load)
            if (window.lastKnownRequestCount >= 0) {
                showGlobalAlert(
                    '💰 NEW UPGRADE REQUEST!',
                    `${req.displayName || req.userEmail} wants ${TIERS[req.requestedTier]?.name || 'upgrade'}`,
                    'requests'
                );
            }
        }
    });
    
    // Clean up old request IDs
    window.adminAlertShownForRequests.forEach(id => {
        if (!currentIds.has(id)) {
            window.adminAlertShownForRequests.delete(id);
        }
    });
    
    window.lastKnownRequestCount = count;
    
    // ALWAYS show persistent alert if there are pending requests
    if (count > 0) {
        showPersistentAdminAlert(count, pendingRequests[0]);
    } else {
        dismissGlobalAlert();
    }
};

// Show persistent admin alert for pending requests
window.showPersistentAdminAlert = function(count, newestRequest) {
    const alertBar = $('globalAlertBar');
    const alertTitle = $('globalAlertTitle');
    const alertMessage = $('globalAlertMessage');
    
    if (!alertBar) return;
    
    const title = count === 1 
        ? '💰 Upgrade Request Pending!' 
        : `💰 ${count} Upgrade Requests Pending!`;
    const message = count === 1 
        ? `${newestRequest?.displayName || newestRequest?.userEmail} wants ${TIERS[newestRequest?.requestedTier]?.name || 'upgrade'}`
        : `Click to review all pending requests`;
    
    if (alertTitle) alertTitle.textContent = title;
    if (alertMessage) alertMessage.textContent = message;
    
    alertBar.dataset.navigateTo = 'requests';
    alertBar.classList.remove('hidden');
    alertBar.classList.add('animate-pulse');
};

// Show global alert bar
window.showGlobalAlert = function(title, message, navigateTo) {
    const alertBar = $('globalAlertBar');
    const alertTitle = $('globalAlertTitle');
    const alertMessage = $('globalAlertMessage');
    
    if (!alertBar) return;
    
    if (alertTitle) alertTitle.textContent = title;
    if (alertMessage) alertMessage.textContent = message;
    
    // Store where to navigate
    alertBar.dataset.navigateTo = navigateTo || '';
    
    // Show with animation
    alertBar.classList.remove('hidden');
    alertBar.style.animation = 'slideDown 0.3s ease-out';
    
    // Add flashing effect
    alertBar.classList.add('animate-pulse');
    
    // Play notification sound (optional - browser may block)
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU9vT18=');
        audio.volume = 0.3;
        audio.play().catch(() => {});
    } catch (e) {}
};

// Handle click on global alert
window.handleGlobalAlertClick = function() {
    const alertBar = $('globalAlertBar');
    const navigateTo = alertBar?.dataset.navigateTo;
    
    if (navigateTo === 'requests') {
        // Navigate to dashboard and open requests tab
        goToDashboard();
        setTimeout(() => {
            switchAdminTab('requests');
        }, 100);
    } else if (navigateTo === 'users') {
        // Navigate to dashboard and open users tab
        goToDashboard();
        setTimeout(() => {
            switchAdminTab('users');
        }, 100);
    }
    
    dismissGlobalAlert();
};

// Dismiss global alert (temporarily - will reappear if still pending)
window.dismissGlobalAlert = function() {
    const alertBar = $('globalAlertBar');
    if (alertBar) {
        alertBar.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => {
            alertBar.classList.add('hidden');
            
            // If there are still pending requests, show again after 30 seconds
            if (window.adminPendingRequests && window.adminPendingRequests.length > 0) {
                setTimeout(() => {
                    if (window.adminPendingRequests && window.adminPendingRequests.length > 0) {
                        showPersistentAdminAlert(
                            window.adminPendingRequests.length, 
                            window.adminPendingRequests[0]
                        );
                    }
                }, 30000); // Re-show after 30 seconds
            }
        }, 250);
    }
};

// ==================== ADMIN PERSISTENT NOTIFICATIONS ====================
// DEPRECATED: Legacy notification state - kept for backward compatibility only
// All notification logic is now handled by notification-manager.js (unified system)
// These variables are NO LONGER USED but kept to prevent errors from any stale references
window.dismissedAdminNotifications = new Set();
window.pendingAdminNotifications = new Set();
window.adminNotificationsData = [];
window.knownUserIds = new Set();
window.knownPropertyIds = new Set();
window.knownSettingsPropertyIds = new Set();

// Start listening for admin notifications - delegates to unified system
window.startAdminNotificationsListener = function() {
    if (!TierService.isMasterAdmin(auth.currentUser?.email)) {
        return;
    }
    
    // Delegate to unified notification system (notification-manager.js)
    if (typeof initAdminNotifications === 'function') {
        initAdminNotifications();
    } else if (typeof NotificationManager !== 'undefined') {
        NotificationManager.init();
    } else {
        console.error('[AdminNotify] Unified notification system not loaded!');
    }
};

// Real-time listener for users - ONLY loads user data for admin panel
// NOTE: New user NOTIFICATIONS are handled by notification-manager.js (unified system)
// This function only maintains window.adminUsersData for the user list UI
window.startAdminUsersListener = function() {
    if (!TierService.isMasterAdmin(auth.currentUser?.email)) return;
    
    if (window.adminUsersUnsubscribe) {
        window.adminUsersUnsubscribe();
    }
    
    // Record current session start time (used by notification-manager.js)
    window.adminSessionStartTime = new Date();
    
    // Initialize tracking sets if not already done
    if (!window.knownUserIds) {
        window.knownUserIds = new Set();
    }
    
    // Simple listener - ONLY for loading user data, NOT for notifications
    // Notifications are handled by notification-manager.js to prevent duplicates
    window.adminUsersUnsubscribe = db.collection('users')
        .onSnapshot((snapshot) => {
            const users = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const user = { id: doc.id, ...data };
                users.push(user);
                window.knownUserIds.add(doc.id);
            });
            
            // Update admin data for user list UI
            window.adminUsersData = users;
            
            // Update notification badge (counts are managed by notification-manager.js)
            if (typeof updateNotificationBadge === 'function') {
                updateNotificationBadge();
            }
            
        }, error => {
            console.error('[AdminUsers] Listener error:', error);
        });
};

// Real-time listener for properties - detects new listings AND updates admin panel data
window.startAdminPropertiesListener = function() {
    if (!TierService.isMasterAdmin(auth.currentUser?.email)) return;
    // The actual property data is stored in settings/properties document, not a 'properties' collection
    // So we just need to call the settings listener
    startSettingsPropertiesListener();
};

// Real-time listener for settings/properties document - this is where user-created properties are stored
// NOTE: New listing NOTIFICATIONS are handled by notification-manager.js (unified system)
// This function only maintains local properties array and owner mappings for UI
window.startSettingsPropertiesListener = function() {
    // Always unsubscribe existing listener first (prevents orphaned listeners)
    if (window.settingsPropertiesUnsubscribe) {
        window.settingsPropertiesUnsubscribe();
        window.settingsPropertiesUnsubscribe = null;
    }
    
    // Ensure adminSessionStartTime is set
    if (!window.adminSessionStartTime) {
        window.adminSessionStartTime = new Date();
    }
    
    // Use GLOBAL seenPropertyIds set so it persists
    if (!window.seenPropertyIds) {
        window.seenPropertyIds = new Set();
    }
    
    window.settingsPropertiesUnsubscribe = db.collection('settings').doc('properties')
        .onSnapshot((doc) => {
            if (!doc.exists) {
                return;
            }
            
            const propsData = doc.data();
            
            Object.keys(propsData).forEach(key => {
                const propId = parseInt(key);
                const prop = propsData[key];
                
                // Only skip if prop is completely invalid
                if (!prop || !prop.title) {
                    return;
                }
                
                prop.id = propId;
                
                // Check if this is a NEW property (not seen in any previous snapshot)
                const isNewToUs = !window.seenPropertyIds.has(propId);
                
                if (isNewToUs) {
                    // Add to local properties array if not already there
                    const existingIndex = properties.findIndex(p => p.id === propId);
                    if (existingIndex === -1) {
                        properties.push(prop);
                        
                        // Set up owner mapping
                        if (prop.ownerEmail) {
                            const email = prop.ownerEmail.toLowerCase();
                            if (!ownerPropertyMap[email]) ownerPropertyMap[email] = [];
                            if (!ownerPropertyMap[email].includes(propId)) ownerPropertyMap[email].push(propId);
                            propertyOwnerEmail[propId] = email;
                        }
                        
                        // Set default availability
                        if (state.availability[propId] === undefined) {
                            state.availability[propId] = true;
                        }
                    }
                }
                
                // Mark this property ID as seen
                window.seenPropertyIds.add(propId);
            });
            
            // Update filtered properties
            state.filteredProperties = [...properties];
            
            // Update notification badge (counts are managed by notification-manager.js)
            if (typeof updateNotificationBadge === 'function') {
                updateNotificationBadge();
            }
            
        }, (error) => {
            console.error('[SettingsProperties] Listener error:', error);
        });
};

// DEPRECATED: showNewListingNotification - now handled by notification-manager.js
// Kept as no-op for backward compatibility
window.showNewListingNotification = function(listing, isMissed = false) {
    // NO-OP: All listing notifications are now handled by notification-manager.js
    // This prevents duplicate notifications and ensures dismissals persist to Firestore
    return;
};

/**
 * Handle click on listing notification - navigate to user who created the listing
 */
window.handleListingNotificationClick = async function(ownerEmail, listingId) {
    
    // Ensure we're on the dashboard
    if (typeof goToDashboard === 'function') {
        goToDashboard();
    }
    await sleep(300);
    
    // Switch to Admin Panel tab
    if (typeof switchDashboardTab === 'function') {
        switchDashboardTab('admin');
    }
    await sleep(200);
    
    // Make sure we're on All Users subtab
    if (typeof switchAdminTab === 'function') {
        switchAdminTab('allUsers');
    }
    await sleep(200);
    
    // Expand all user groups to ensure the user is visible
    const groups = ['ownerGroup', 'eliteGroup', 'proGroup', 'starterGroup'];
    groups.forEach(groupId => {
        const group = document.getElementById(groupId);
        const toggle = document.getElementById(groupId + 'Toggle');
        if (group && group.classList.contains('hidden')) {
            group.classList.remove('hidden');
            if (toggle) toggle.textContent = '▼';
        }
    });
    await sleep(100);
    
    // Find user card by email
    const userCard = document.querySelector(`.admin-user-card[data-email="${ownerEmail}"]`);
    
    if (userCard) {
        userCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Highlight with green (listing color)
        const highlightColor = 'rgba(34, 197, 94, 0.7)';
        userCard.style.boxShadow = `0 0 0 4px ${highlightColor}, 0 0 30px ${highlightColor.replace('0.7', '0.4')}`;
        userCard.style.transition = 'box-shadow 0.3s ease';
        
        setTimeout(() => {
            userCard.style.boxShadow = '';
        }, 4000);
    } else {
        console.warn('[Notification] User card not found for email:', ownerEmail);
        // Fallback: open property stats
        if (typeof viewPropertyStats === 'function') {
            viewPropertyStats(listingId);
        }
    }
};

// Log admin activity for history
window.adminActivityLog = [];

window.logAdminActivity = function(type, data) {
    const entry = {
        id: Date.now().toString(),
        type: type,
        data: data,
        timestamp: new Date().toISOString()
    };
    
    window.adminActivityLog.unshift(entry); // Add to front
    
    // Keep only last 100 entries in memory
    if (window.adminActivityLog.length > 100) {
        window.adminActivityLog = window.adminActivityLog.slice(0, 100);
    }
    
    // Save to Firestore via UserPreferencesService
    if (window.UserPreferencesService) {
        UserPreferencesService.addActivityLogEntry(entry);
    }
};

// Load and display activity log
window.loadActivityLog = function() {
    const container = $('activityLogList');
    if (!container) return;
    
    // Load from UserPreferencesService (Firestore)
    let entries = [];
    if (window.UserPreferencesService) {
        entries = UserPreferencesService.getActivityLog();
    }
    
    if (entries.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <div class="text-4xl mb-4">📭</div>
                <p class="text-gray-500">No activity recorded yet</p>
                <p class="text-gray-600 text-sm mt-2">New user signups and other events will appear here</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = entries.map(entry => {
        const time = new Date(entry.timestamp).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit'
        });
        
        let icon, bgColor, title, description;
        
        switch(entry.type) {
            case 'new_user':
                icon = '👤';
                bgColor = 'from-cyan-900/50 to-blue-900/50 border-cyan-600/30';
                title = 'New User Registered';
                description = `${entry.data.username || entry.data.email?.split('@')[0] || 'Unknown'} created a ${entry.data.tier || 'Starter'} account`;
                break;
            case 'new_listing':
                icon = '🏠';
                bgColor = 'from-green-900/50 to-emerald-900/50 border-green-600/30';
                title = 'New Listing Posted';
                description = `${entry.data.title || 'New Property'} listed by ${entry.data.ownerEmail?.split('@')[0] || 'Unknown'}`;
                break;
            case 'upgrade':
                icon = '⬆️';
                bgColor = 'from-purple-900/50 to-pink-900/50 border-purple-600/30';
                title = entry.data.isTrial ? 'User Upgraded (Trial)' : 'User Upgraded';
                const amountStr = entry.data.amount ? ` - $${(entry.data.amount/1000).toFixed(0)}k` : '';
                const proratedStr = entry.data.isProrated ? ' (prorated)' : '';
                description = `${entry.data.email?.split('@')[0] || 'User'}: ${entry.data.previousTier || 'starter'} → ${entry.data.newTier}${amountStr}${proratedStr}`;
                break;
            case 'downgrade':
                icon = '⬇️';
                bgColor = 'from-orange-900/50 to-amber-900/50 border-orange-600/30';
                title = 'User Downgraded';
                description = `${entry.data.email?.split('@')[0] || 'User'}: ${entry.data.previousTier || 'unknown'} → ${entry.data.newTier}${entry.data.reason ? ' - ' + entry.data.reason : ''}`;
                break;
            case 'denial':
                icon = '❌';
                bgColor = 'from-red-900/50 to-rose-900/50 border-red-600/30';
                title = 'Upgrade Request Denied';
                description = `${entry.data.email?.split('@')[0] || 'User'} denied ${entry.data.requestedTier}${entry.data.reason ? ': ' + entry.data.reason : ''}`;
                break;
            case 'deletion':
                icon = '🗑️';
                bgColor = 'from-red-900/50 to-gray-900/50 border-red-600/30';
                title = 'User Deleted';
                const propInfo = entry.data.propertiesDeleted > 0 
                    ? ` (${entry.data.propertiesDeleted} properties deleted)` 
                    : entry.data.propertiesOrphaned > 0 
                        ? ` (${entry.data.propertiesOrphaned} properties orphaned)` 
                        : '';
                description = `${entry.data.email?.split('@')[0] || 'User'} account removed${propInfo}`;
                break;
            case 'payment':
                icon = '💰';
                bgColor = 'from-green-900/50 to-emerald-900/50 border-green-600/30';
                title = 'Payment Received';
                description = entry.data.description || 'Payment recorded';
                break;
            case 'trial_conversion':
                icon = '💳';
                bgColor = 'from-green-900/50 to-teal-900/50 border-green-600/30';
                title = 'Trial Converted to Paid';
                description = `${entry.data.email?.split('@')[0] || 'User'} converted from trial to paid`;
                break;
            case 'payment_adjustment':
                icon = '💵';
                bgColor = 'from-yellow-900/50 to-amber-900/50 border-yellow-600/30';
                title = 'Payment Amount Adjusted';
                description = `${entry.data.email?.split('@')[0] || 'User'}: $${(entry.data.previousAmount/1000).toFixed(0)}k → $${(entry.data.newAmount/1000).toFixed(0)}k`;
                break;
            case 'managed_services_optin':
                icon = '🚀';
                bgColor = 'from-purple-900/50 to-pink-900/50 border-purple-600/30';
                title = 'VIP Lead - Managed Services Interest';
                description = `${entry.data.username || entry.data.email?.split('@')[0] || 'User'} opted in for managed services`;
                break;
            default:
                icon = '📋';
                bgColor = 'from-gray-800 to-gray-900 border-gray-600/30';
                title = 'Activity';
                description = JSON.stringify(entry.data);
        }
        
        return `
            <div class="bg-gradient-to-r ${bgColor} rounded-xl p-4 border flex items-start gap-4">
                <span class="text-2xl">${icon}</span>
                <div class="flex-1 min-w-0">
                    <div class="text-white font-semibold">${title}</div>
                    <div class="text-gray-300 text-sm">${description}</div>
                    <div class="text-gray-500 text-xs mt-1">${time}</div>
                </div>
            </div>
        `;
    }).join('');
};

// Clear activity log
window.clearActivityLog = function() {
    if (!confirm('Clear all activity log entries? This cannot be undone.')) return;
    
    window.adminActivityLog = [];
    // Clear from Firestore via UserPreferencesService
    if (window.UserPreferencesService) {
        UserPreferencesService.clearActivityLog();
    }
    loadActivityLog();
};

// Show a notification for a new user
// DEPRECATED: showNewUserNotification - now handled by notification-manager.js
// Kept as no-op for backward compatibility
window.showNewUserNotification = function(user, isMissed = false) {
    // NO-OP: All user notifications are now handled by notification-manager.js
    // This prevents duplicate notifications and ensures dismissals persist to Firestore
    return;
};

// Handle click on new user notification - navigate and highlight user
window.handleNewUserNotificationClick = async function(userId) {
    
    // Ensure we're on the dashboard
    if (typeof goToDashboard === 'function') {
        goToDashboard();
    }
    await sleep(300);
    
    // Switch to Admin Panel tab
    if (typeof switchDashboardTab === 'function') {
        switchDashboardTab('admin');
    }
    await sleep(200);
    
    // Make sure we're on Users subtab (not 'allUsers' - that's invalid)
    if (typeof switchAdminTab === 'function') {
        switchAdminTab('users');
    }
    await sleep(200);
    
    // Expand all user groups to ensure the user is visible
    const groups = ['ownerGroup', 'eliteGroup', 'proGroup', 'starterGroup'];
    groups.forEach(groupId => {
        const group = document.getElementById(groupId);
        const toggle = document.getElementById(groupId + 'Toggle');
        if (group && group.classList.contains('hidden')) {
            group.classList.remove('hidden');
            if (toggle) toggle.textContent = '▼';
        }
    });
    await sleep(100);
    
    // Find user card by userid
    const userCard = document.querySelector(`.admin-user-card[data-userid="${userId}"]`);
    
    if (userCard) {
        userCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Highlight with blue (user color)
        const highlightColor = 'rgba(59, 130, 246, 0.7)';
        userCard.style.boxShadow = `0 0 0 4px ${highlightColor}, 0 0 30px ${highlightColor.replace('0.7', '0.4')}`;
        userCard.style.transition = 'box-shadow 0.3s ease';
        
        setTimeout(() => {
            userCard.style.boxShadow = '';
        }, 4000);
    } else {
        console.warn('[Notification] User card not found for userId:', userId);
    }
};

/**
 * Enterprise scroll-to-highlight utility
 * Handles navigation, tab switching, async waiting for element, scrolling, and highlighting
 * 
 * @param {Object} options
 * @param {string} options.targetSelector - CSS selector for target element
 * @param {string} options.tabName - Dashboard tab to switch to (e.g., 'admin', 'myProperties')
 * @param {number} options.maxWaitMs - Maximum time to wait for element (default: 5000)
 * @param {string} options.highlightColor - Border highlight color
 * @param {string} options.glowColor - Glow effect color
 * @param {Function} options.onNotFound - Callback if element not found
 */
window.scrollToAndHighlightElement = async function(options) {
    const {
        targetSelector,
        tabName = 'myProperties',
        maxWaitMs = 5000,
        highlightColor = 'rgba(239, 68, 68, 0.7)',
        glowColor = 'rgba(239, 68, 68, 0.4)',
        onNotFound = null
    } = options;
    
    // Step 1: Ensure we're on the dashboard
    if (!$('ownerDashboard') || $('ownerDashboard').classList.contains('hidden')) {
        goToDashboard();
        await sleep(300); // Wait for dashboard to render
    }
    
    // Step 2: Switch to the correct tab
    if (typeof switchDashboardTab === 'function') {
        switchDashboardTab(tabName);
        await sleep(200); // Wait for tab switch animation
    }
    
    // Step 3: Wait for the target element to exist (with polling)
    const element = await waitForElement(targetSelector, maxWaitMs);
    
    if (!element) {
        if (onNotFound) onNotFound();
        return false;
    }
    
    // Step 4: Scroll to element
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Step 5: Add highlight effect
    const originalBoxShadow = element.style.boxShadow;
    element.style.boxShadow = `0 0 0 4px ${highlightColor}, 0 0 30px ${glowColor}`;
    element.style.transition = 'box-shadow 0.3s ease';
    
    // Step 6: Remove highlight after 4 seconds
    setTimeout(() => {
        element.style.boxShadow = originalBoxShadow || '';
    }, 4000);
    
    return true;
};

/**
 * Promise-based sleep utility
 * @param {number} ms - Milliseconds to sleep
 */
window.sleep = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Wait for an element to exist in DOM with polling
 * @param {string} selector - CSS selector
 * @param {number} maxWaitMs - Maximum wait time in milliseconds
 * @param {number} pollIntervalMs - Polling interval (default: 100ms)
 * @returns {Promise<Element|null>}
 */
window.waitForElement = async function(selector, maxWaitMs = 5000, pollIntervalMs = 100) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitMs) {
        const element = document.querySelector(selector);
        if (element) {
            return element;
        }
        await sleep(pollIntervalMs);
    }
    
    return null;
};

// Dismiss new user notification
// DEPRECATED: dismissNewUserNotification - redirect to notification-manager.js
// This function may still be called from inline onclick handlers in rendered HTML
window.dismissNewUserNotification = function(notificationId) {
    // Delegate to unified notification system for Firestore persistence
    if (typeof NotificationManager !== 'undefined' && NotificationManager.dismiss) {
        // Convert legacy ID format to unified format if needed
        // Legacy: 'new-user-xxx' or 'new-listing-xxx'
        // Unified: 'user-xxx' or 'listing-xxx'
        let unifiedId = notificationId;
        if (notificationId.startsWith('new-user-')) {
            unifiedId = notificationId.replace('new-user-', 'user-');
        } else if (notificationId.startsWith('new-listing-')) {
            unifiedId = notificationId.replace('new-listing-', 'listing-');
        }
        NotificationManager.dismiss(unifiedId);
    }
    
    // Also try to dismiss via legacy method for backward compatibility
    if (window.UserPreferencesService) {
        UserPreferencesService.dismissNotification(notificationId);
    }
    
    // Remove from DOM if present (handles any stale legacy notifications)
    const notification = $('notification-' + notificationId);
    if (notification) {
        notification.style.animation = 'slideUp 0.3s ease-out forwards';
        setTimeout(() => notification.remove(), 300);
    }
};

// Update notification badge in header
// OLD: updateNotificationBadge now delegates to new unified system
window.updateNotificationBadge = function() {
    // Delegate to new unified notification system
    if (typeof updateAllBadges === 'function') {
        updateAllBadges();
    }
};

// Show new user notifications popup
// DEPRECATED: showNewUserNotifications - now delegates to notification-manager.js
window.showNewUserNotifications = function(event) {
    event.stopPropagation();
    // Delegate to unified system
    if (typeof NotificationManager !== 'undefined' && NotificationManager.handleBadgeClick) {
        NotificationManager.handleBadgeClick('user');
    } else {
        goToDashboard();
        setTimeout(() => {
            if (typeof switchAdminTab === 'function') switchAdminTab('users');
        }, 100);
    }
};

// DEPRECATED: showNewListingNotifications - now delegates to notification-manager.js
window.showNewListingNotifications = function(event) {
    event.stopPropagation();
    // Delegate to unified system
    if (typeof NotificationManager !== 'undefined' && NotificationManager.handleBadgeClick) {
        NotificationManager.handleBadgeClick('listing');
    } else {
        goToDashboard();
    }
};

// DEPRECATED: showNewPremiumNotifications - now delegates to notification-manager.js
window.showNewPremiumNotifications = function(event) {
    event.stopPropagation();
    // Delegate to unified system
    if (typeof NotificationManager !== 'undefined' && NotificationManager.handleBadgeClick) {
        NotificationManager.handleBadgeClick('premium');
    } else {
        goToDashboard();
    }
};

// DEPRECATED: showNewPhotoNotifications - now delegates to notification-manager.js
window.showNewPhotoNotifications = function(event) {
    event.stopPropagation();
    // Delegate to unified system
    if (typeof NotificationManager !== 'undefined' && NotificationManager.handleBadgeClick) {
        NotificationManager.handleBadgeClick('photo');
    } else {
        goToDashboard();
    }
};

// Re-render all pending notifications that might not be showing
// DEPRECATED: reRenderPendingNotifications - now delegates to notification-manager.js
// Kept for backward compatibility with ui-navigation.js call
window.reRenderPendingNotifications = function() {
    // Delegate to unified notification system
    if (typeof NotificationManager !== 'undefined' && NotificationManager.refreshUI) {
        NotificationManager.refreshUI();
    }
};

// Show a notification for a new premium activation
// DEPRECATED: showNewPremiumNotification - now handled by notification-manager.js
// Kept as no-op for backward compatibility
window.showNewPremiumNotification = function(property, ownerEmail, isMissed = false) {
    // NO-OP: All premium notifications are now handled by notification-manager.js
    // This prevents duplicate notifications and ensures dismissals persist to Firestore
    return;
};

// Render the persistent admin notification stack
// DEPRECATED: renderAdminNotificationStack - now handled by notification-manager.js
// Kept as no-op for backward compatibility
window.renderAdminNotificationStack = function(notifications, hasNew = false) {
    // NO-OP: Stack rendering is now handled by notification-manager.js
    // Delegate to unified system to refresh if needed
    if (typeof NotificationManager !== 'undefined' && NotificationManager.refreshUI) {
        NotificationManager.refreshUI();
    }
};

// Flash the screen for new notifications
window.flashScreen = function(color = 'cyan') {
    const flash = document.createElement('div');
    flash.className = 'fixed inset-0 pointer-events-none z-[100]';
    
    const colorMap = {
        cyan: 'rgba(34, 211, 238, 0.3)',
        green: 'rgba(34, 197, 94, 0.3)',
        orange: 'rgba(251, 146, 60, 0.3)',
        purple: 'rgba(168, 85, 247, 0.3)'
    };
    
    const bgColor = colorMap[color] || colorMap.cyan;
    flash.style.cssText = `background: linear-gradient(to bottom, ${bgColor}, transparent); animation: flashFade 1s ease-out forwards;`;
    document.body.appendChild(flash);
    
    setTimeout(() => flash.remove(), 1000);
};

// Handle click on admin notification
window.handleAdminNotificationClick = function(notificationId, type) {
    if (type === 'new_user') {
        switchAdminTab('users');
    } else if (type === 'upgrade_request') {
        switchAdminTab('requests');
    }
};

// Dismiss admin notification
// Clear all admin notifications at once
window.clearAllAdminNotifications = function() {
    const stack = $('adminNotificationsStack');
    if (!stack) return;
    
    // Get all notification IDs
    const notificationIds = [];
    const notifications = stack.querySelectorAll('[id^="notification-"]');
    notifications.forEach(notif => {
        const id = notif.id.replace('notification-', '');
        window.dismissedAdminNotifications.add(id);
        window.pendingAdminNotifications.delete(id);
        notificationIds.push(id);
    });
    
    // Clear all visual notifications
    notifications.forEach(notif => notif.remove());
    
    // Hide the stack and clear button
    stack.classList.add('hidden');
    const clearBtn = $('clearAllNotificationsBtn');
    if (clearBtn) clearBtn.classList.add('hidden');
    
    // Save to Firestore via UserPreferencesService
    if (window.UserPreferencesService && notificationIds.length > 0) {
        UserPreferencesService.dismissNotifications(notificationIds);
        UserPreferencesService.updateAdminLastVisit();
    }
    
    // Update badge
    updateNotificationBadge();
    
    showToast('All notifications cleared', 'success');
};

// Show/hide clear all button based on notification count
window.updateClearAllButton = function() {
    const stack = $('adminNotificationsStack');
    const clearBtn = $('clearAllNotificationsBtn');
    if (!stack || !clearBtn) return;
    
    const notifications = stack.querySelectorAll('[id^="notification-"]');
    if (notifications.length > 0) {
        clearBtn.classList.remove('hidden');
    } else {
        clearBtn.classList.add('hidden');
    }
};

// OLD: dismissAdminNotification is now in notifications.js
// The new unified notification system handles all dismissals

window.updateAdminStats = async function(users) {
    const totalUsers = users.length;
    // Pro tier removed - but keep filter for any legacy pro users during migration
    const proUsers = users.filter(u => u.tier === 'pro');
    const eliteUsers = users.filter(u => u.tier === 'elite');
    // Exclude master admin from starter count
    const starterUsers = users.filter(u => !TierService.isMasterAdmin(u.email) && (u.tier === 'starter' || !u.tier));
    const adminUsers = users.filter(u => TierService.isMasterAdmin(u.email));
    
    // Separate trial users from paid users (Elite only now)
    const eliteTrialUsers = eliteUsers.filter(u => u.isFreeTrial === true);
    const elitePaidUsers = eliteUsers.filter(u => u.isFreeTrial !== true);
    
    // Refresh availability data from Firestore for accuracy
    try {
        const availDoc = await db.collection('settings').doc('propertyAvailability').get();
        if (availDoc.exists) {
            const availData = availDoc.data();
            Object.keys(availData).forEach(key => {
                const numKey = parseInt(key);
                if (!isNaN(numKey)) {
                    state.availability[numKey] = availData[key];
                }
            });
        }
    } catch (err) {
        // Silently handle error
    }
    
    // Calculate PAID revenue only (Elite is $25k/month now)
    let eliteRevenue = 0;
    
    elitePaidUsers.forEach(u => {
        // Use stored subscriptionAmount if available, otherwise default to $25k
        const amount = u.subscriptionAmount !== undefined ? u.subscriptionAmount : 25000;
        eliteRevenue += amount;
    });
    
    // Calculate Premium Ad Fees (weekly fees from premium listings)
    // NOTE: This shows CURRENT WEEKLY revenue, not projected monthly
    // For actual collected amounts, we would need to query paymentHistory
    let premiumFeeTotal = 0;
    let premiumListingsCount = 0;
    let premiumPaidCount = 0;
    let premiumTrialCount = 0;
    const premiumFeePerWeek = 10000; // $10k/week per premium listing
    
    // Check each property for premium status
    properties.forEach(p => {
        const isPremium = PropertyDataService.getValue(p.id, 'isPremium', p.isPremium || false);
        if (isPremium) {
            premiumListingsCount++;
            const isPremiumTrial = PropertyDataService.getValue(p.id, 'isPremiumTrial', p.isPremiumTrial || false);
            if (isPremiumTrial) {
                premiumTrialCount++;
            } else {
                premiumPaidCount++;
                premiumFeeTotal += premiumFeePerWeek;
            }
        }
    });
    
    // Show actual weekly premium revenue (not multiplied - actuals only)
    const premiumWeeklyRevenue = premiumFeeTotal;
    
    // Total revenue is Elite subscriptions + weekly premium (Pro tier removed)
    // This represents: confirmed recurring revenue from subs + current weekly premium fees
    const totalRevenue = eliteRevenue + premiumWeeklyRevenue;
    
    // Helper function to get user listing count - uses OwnershipService for consistency
    const getUserListings = (user) => {
        return OwnershipService.getListingCount(user.email);
    };
    
    // ==================== ROW 1: USER TYPES ====================
    
    // Starter Users Tile
    const statStarter = $('adminStatStarter');
    if (statStarter) statStarter.textContent = starterUsers.length;
    
    const starterDetail = $('adminStatStarterDetail');
    if (starterDetail) {
        const recentStarters = starterUsers.slice(0, 5).map(u => 
            `<div class="truncate">🌱 ${u.username || u.email.split('@')[0]}</div>`
        ).join('');
        starterDetail.innerHTML = `
            <div class="mb-1 text-gray-400">Free tier (1 listing max)</div>
            ${recentStarters || '<div class="text-gray-500">No starter users</div>'}
            ${starterUsers.length > 5 ? `<div class="text-gray-500">+${starterUsers.length - 5} more...</div>` : ''}
        `;
    }
    
    // Pro Users Tile - RETIRED (show 0 or legacy count)
    const statPro = $('adminStatPro');
    const statProBreakdown = $('adminStatProBreakdown');
    if (statPro) statPro.textContent = proUsers.length;
    if (statProBreakdown) {
        if (proUsers.length > 0) {
            statProBreakdown.textContent = '(legacy - needs migration)';
        } else {
            statProBreakdown.textContent = '(tier retired)';
        }
    }
    
    const proDetail = $('adminStatProDetail');
    if (proDetail) {
        if (proUsers.length > 0) {
            const allProUsersList = proUsers.map(u => {
                const listings = getUserListings(u);
                return `<div class="truncate text-orange-400">⚠️ ${u.username || u.email.split('@')[0]} <span class="text-gray-500">${listings}/3</span></div>`;
            }).join('');
            proDetail.innerHTML = `<div class="text-orange-400 mb-1">Legacy users needing migration:</div>${allProUsersList}`;
        } else {
            proDetail.innerHTML = '<div class="text-gray-500">Pro tier has been retired</div><div class="text-gray-500 text-xs">All users migrated to Starter/Elite</div>';
        }
    }
    
    // Elite Users Tile
    const statElite = $('adminStatElite');
    const statEliteBreakdown = $('adminStatEliteBreakdown');
    if (statElite) statElite.textContent = eliteUsers.length;
    if (statEliteBreakdown) {
        if (eliteUsers.length > 0) {
            statEliteBreakdown.textContent = `(${elitePaidUsers.length} paid, ${eliteTrialUsers.length} trial)`;
        } else {
            statEliteBreakdown.textContent = '';
        }
    }
    
    const eliteDetail = $('adminStatEliteDetail');
    if (eliteDetail) {
        const allEliteUsersList = eliteUsers.map(u => {
            const listings = getUserListings(u);
            const isTrial = u.isFreeTrial === true;
            const trialTag = isTrial ? '<span class="text-cyan-400">🎁</span>' : '<span class="text-green-400">💰</span>';
            return `<div class="truncate">${trialTag} ${u.username || u.email.split('@')[0]} <span class="text-gray-500">${listings}/∞</span></div>`;
        }).join('');
        eliteDetail.innerHTML = allEliteUsersList || '<div class="text-gray-500">No Elite users</div>';
    }
    
    // Total Users Tile
    const statUsers = $('adminStatUsers');
    if (statUsers) statUsers.textContent = totalUsers;
    
    const usersDetail = $('adminStatUsersDetail');
    if (usersDetail) {
        usersDetail.innerHTML = `
            <div>👑 Owner/Admin: ${adminUsers.length}</div>
            <div>🌱 Starter: ${starterUsers.length}</div>
            <div>👑 Elite: ${eliteUsers.length} ${eliteTrialUsers.length > 0 ? `<span class="text-cyan-400">(${eliteTrialUsers.length} trial)</span>` : ''}</div>
            ${proUsers.length > 0 ? `<div class="text-orange-400">⚠️ Legacy Pro: ${proUsers.length}</div>` : ''}
        `;
    }
    
    // ==================== ROW 2: REVENUE ====================
    
    // Pro Revenue Tile - REMOVED (Pro tier no longer exists)
    // Hide the Pro revenue tile if it exists
    const statProRevenue = $('adminStatProRevenue');
    const statProRevenueSub = $('adminStatProRevenueSub');
    if (statProRevenue) statProRevenue.textContent = '$0k';
    if (statProRevenueSub) statProRevenueSub.textContent = 'Pro tier removed';
    
    const proRevenueDetail = $('adminStatProRevenueDetail');
    if (proRevenueDetail) {
        proRevenueDetail.innerHTML = `
            <div class="text-gray-500">Pro tier has been retired</div>
            <div class="text-gray-500 text-xs mt-1">All Pro users migrated to Starter</div>
        `;
    }
    
    // Elite Revenue Tile (now $25k/month)
    const statEliteRevenue = $('adminStatEliteRevenue');
    const statEliteRevenueSub = $('adminStatEliteRevenueSub');
    if (statEliteRevenue) statEliteRevenue.textContent = `$${(eliteRevenue / 1000).toFixed(0)}k`;
    if (statEliteRevenueSub) {
        statEliteRevenueSub.textContent = `${elitePaidUsers.length} paid × $25k`;
    }
    
    const eliteRevenueDetail = $('adminStatEliteRevenueDetail');
    if (eliteRevenueDetail) {
        const paidList = elitePaidUsers.map(u => {
            const amount = u.subscriptionAmount !== undefined ? u.subscriptionAmount : 50000;
            const proratedLabel = u.isProratedUpgrade ? ' <span class="text-amber-400">(prorated)</span>' : '';
            return `<div class="truncate">💰 ${u.username || u.email.split('@')[0]} - $${(amount/1000).toFixed(0)}k${proratedLabel}</div>`;
        }).join('');
        eliteRevenueDetail.innerHTML = `
            <div class="mb-1 text-purple-400 font-bold">$${eliteRevenue.toLocaleString()}/mo</div>
            ${paidList || '<div class="text-gray-500">No paid Elite users</div>'}
            ${eliteTrialUsers.length > 0 ? `<div class="text-cyan-400 mt-1">🎁 ${eliteTrialUsers.length} on free trial</div>` : ''}
        `;
    }
    
    // Premium Fees Tile
    const statPremium = $('adminStatPremium');
    const statPremiumSub = $('adminStatPremiumSub');
    if (statPremium) statPremium.textContent = `$${(premiumWeeklyRevenue / 1000).toFixed(0)}k`;
    if (statPremiumSub) {
        if (premiumListingsCount > 0) {
            statPremiumSub.textContent = `${premiumPaidCount} paid, ${premiumTrialCount} trial`;
        } else {
            statPremiumSub.textContent = 'No premium listings';
        }
    }
    
    const premiumDetail = $('adminStatPremiumDetail');
    if (premiumDetail) {
        // Get list of premium listings
        const premiumListings = properties.filter(p => 
            PropertyDataService.getValue(p.id, 'isPremium', p.isPremium || false)
        );
        const premiumList = premiumListings.slice(0, 4).map(p => {
            const isTrial = PropertyDataService.getValue(p.id, 'isPremiumTrial', p.isPremiumTrial || false);
            const icon = isTrial ? '🎁' : '💰';
            return `<div class="truncate">${icon} ${p.title}</div>`;
        }).join('');
        premiumDetail.innerHTML = `
            <div class="mb-1 text-amber-400 font-bold">$${premiumWeeklyRevenue.toLocaleString()}/wk</div>
            <div class="text-gray-400 text-xs mb-1">${premiumPaidCount} × $10k/wk (actual)</div>
            ${premiumList || '<div class="text-gray-500">No premium listings</div>'}
            ${premiumListings.length > 4 ? `<div class="text-gray-500">+${premiumListings.length - 4} more...</div>` : ''}
            ${premiumTrialCount > 0 ? `<div class="text-cyan-400 mt-1">🎁 ${premiumTrialCount} on free trial</div>` : ''}
        `;
    }
    
    // Total Revenue Tile
    const statTotalRevenue = $('adminStatTotalRevenue');
    const statTotalRevenueSub = $('adminStatTotalRevenueSub');
    if (statTotalRevenue) statTotalRevenue.textContent = `$${(totalRevenue / 1000).toFixed(0)}k`;
    if (statTotalRevenueSub) {
        const totalTrials = eliteTrialUsers.length;  // Only Elite has trials now
        statTotalRevenueSub.textContent = totalTrials > 0 ? `${totalTrials} on free trial` : 'Current revenue';
    }
    
    const totalRevenueDetail = $('adminStatTotalRevenueDetail');
    if (totalRevenueDetail) {
        const totalTrials = eliteTrialUsers.length;  // Only Elite has trials now
        totalRevenueDetail.innerHTML = `
            <div class="text-green-400 font-bold mb-2">$${totalRevenue.toLocaleString()}</div>
            <div class="space-y-1 text-xs">
                <div>👑 Elite: $${eliteRevenue.toLocaleString()}/mo</div>
                <div>🏆 Premium: $${premiumWeeklyRevenue.toLocaleString()}/wk</div>
            </div>
            ${totalTrials > 0 ? `<div class="text-cyan-400 text-xs mt-2 border-t border-gray-600 pt-1">🎁 ${totalTrials} trial (not counted)</div>` : ''}
        `;
    }
    
    // ==================== TOTAL LISTINGS STAT ====================
    const totalListings = properties.length;
    const availableListings = properties.filter(p => state.availability[p.id] !== false).length;
    const rentedListings = totalListings - availableListings;
    
    const statListings = $('adminStatListings');
    const statListingsAvailable = $('adminStatListingsAvailable');
    
    if (statListings) {
        statListings.textContent = totalListings;
    }
    if (statListingsAvailable) {
        statListingsAvailable.textContent = `(${availableListings} available, ${rentedListings} rented)`;
    }
};

// Flippable tile function
window.flipAdminTile = function(tileType) {
    const tile = $('adminTile' + tileType.charAt(0).toUpperCase() + tileType.slice(1));
    if (tile) {
        const isFlipped = tile.style.transform === 'rotateY(180deg)';
        tile.style.transform = isFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)';
    }
};

// Reset all admin tiles to show front (unflipped) state
window.resetAdminTiles = function() {
    const tiles = ['Starter', 'Pro', 'Elite', 'Users', 'ProRevenue', 'EliteRevenue', 'Premium', 'TotalRevenue'];
    tiles.forEach(tileName => {
        const tile = $('adminTile' + tileName);
        if (tile) {
            tile.style.transform = 'rotateY(0deg)';
        }
    });
};

window.loadAllUsers = async function() {
    const container = $('allUsersList');
    if (!container) return;
    
    container.innerHTML = '<p class="text-gray-500 italic">Loading users...</p>';
    
    try {
        const users = await TierService.getAllUsers();
        window.adminUsersData = users;
        
        // Initialize known users set (for new user detection)
        if (!window.knownUserIds) window.knownUserIds = new Set();
        users.forEach(u => window.knownUserIds.add(u.id));
        
        // Check if gamification migration is needed (checks Firestore flag first)
        // This will only run once ever - the flag is stored in Firestore
        if (typeof GamificationService !== 'undefined' && typeof GamificationService.checkAndTriggerMigration === 'function') {
            try {
                const migrationRan = await GamificationService.checkAndTriggerMigration(users);
                if (migrationRan) {
                    // Reload users after migration to get updated data
                    const updatedUsers = await TierService.getAllUsers();
                    window.adminUsersData = updatedUsers;
                    users = updatedUsers;
                }
            } catch (migrationError) {
                console.error('[Gamification] Migration check failed:', migrationError);
            }
        }
        
        await updateAdminStats(users);
        
        if (users.length === 0) {
            container.innerHTML = '<p class="text-gray-500 italic">No users found.</p>';
            return;
        }
        
        renderAdminUsersList(users);
        
        // Check for subscription alerts
        checkSubscriptionAlerts();
        
    } catch (error) {
        console.error('Error loading users:', error);
        container.innerHTML = '<p class="text-red-400">Error loading users.</p>';
    }
};

window.renderAdminUsersList = function(users, pendingRequests = null) {
    const container = $('allUsersList');
    if (!container) return;
    
    // Use stored pending requests if not provided
    const pending = pendingRequests || window.adminPendingRequests || [];
    const pendingEmails = pending.map(r => r.userEmail?.toLowerCase());
    
    // Sort users into tier groups (Pro tier removed)
    const tierOrder = { 'owner': 0, 'elite': 1, 'starter': 2 };
    const sortedUsers = [...users].sort((a, b) => {
        const aIsAdmin = TierService.isMasterAdmin(a.email);
        const bIsAdmin = TierService.isMasterAdmin(b.email);
        // Treat legacy pro users as starter
        const aTier = aIsAdmin ? 'owner' : (a.tier === 'elite' ? 'elite' : 'starter');
        const bTier = bIsAdmin ? 'owner' : (b.tier === 'elite' ? 'elite' : 'starter');
        
        // First sort by tier
        if (tierOrder[aTier] !== tierOrder[bTier]) {
            return tierOrder[aTier] - tierOrder[bTier];
        }
        // Then by name
        return (a.username || a.email).localeCompare(b.username || b.email);
    });
    
    // Group users by tier (Pro merged into Starter for display)
    const groups = {
        owner: sortedUsers.filter(u => TierService.isMasterAdmin(u.email)),
        elite: sortedUsers.filter(u => !TierService.isMasterAdmin(u.email) && u.tier === 'elite'),
        starter: sortedUsers.filter(u => !TierService.isMasterAdmin(u.email) && (!u.tier || u.tier === 'starter' || u.tier === 'pro'))
    };
    
    // Render function for individual user card
    const renderUserCard = (user) => {
        const isUserMasterAdmin = TierService.isMasterAdmin(user.email);
        const hasPendingRequest = pendingEmails.includes(user.email?.toLowerCase());
        const pendingRequest = pending.find(r => r.userEmail?.toLowerCase() === user.email?.toLowerCase());
        
        const tierData = isUserMasterAdmin 
            ? { icon: '👑', name: 'Owner', bgColor: 'bg-red-600', maxListings: Infinity }
            : (TIERS[user.tier] || TIERS.starter);
        
        // CRITICAL: Use OwnershipService for consistent property ownership
        const userProperties = OwnershipService.getPropertiesForOwner(user.email);
        const listingCount = userProperties.length;
        const maxListings = (isUserMasterAdmin || tierData.maxListings === Infinity) ? '∞' : tierData.maxListings;
        const escapedEmail = user.email.replace(/'/g, "\\'");
        const escapedId = user.id;
        // CRITICAL: Use displayName field (preferred) over username
        const displayName = user.displayName || user.username || user.email.split('@')[0];
        
        // Format activity times
        const lastLogin = user.lastLogin?.toDate 
            ? user.lastLogin.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
            : (user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Never');
        
        const lastPropertyPost = user.lastPropertyPosted?.toDate 
            ? user.lastPropertyPosted.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : (user.lastPropertyPostedAt ? new Date(user.lastPropertyPostedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never');
        
        const createdAt = user.createdAt?.toDate 
            ? user.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'Unknown';
        
        // Calculate property type breakdown
        const propTypeBreakdown = {};
        const interiorBreakdown = { 'Walk-in': 0, 'Instance': 0 };
        userProperties.forEach(p => {
            const pType = p.type || 'unknown';
            propTypeBreakdown[pType] = (propTypeBreakdown[pType] || 0) + 1;
            if (p.interiorType === 'Walk-in') interiorBreakdown['Walk-in']++;
            else if (p.interiorType === 'Instance') interiorBreakdown['Instance']++;
        });
        
        // Format property type breakdown for display (clickable)
        let propBreakdownHTML = '';
        const typeIcons = { house: '🏠', apartment: '🏢', condo: '🏨', villa: '🏡', hotel: '🏩', office: '🏢', warehouse: '🏭', hideout: '🏚️' };
        
        if (userProperties.length > 0) {
            const typeEntries = Object.entries(propTypeBreakdown)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3) // Show top 3
                .map(([type, count]) => {
                    const icon = typeIcons[type] || '🏠';
                    const typeName = type.charAt(0).toUpperCase() + type.slice(1);
                    return `<span onclick="filterUserPropertiesByType('${escapedId}', '${type}')" class="cursor-pointer hover:text-cyan-300 hover:underline transition">${icon} ${typeName}: ${count}</span>`;
                })
                .join(' <span class="text-gray-600">•</span> ');
            
            const walkinPct = Math.round((interiorBreakdown['Walk-in'] / userProperties.length) * 100);
            const instancePct = 100 - walkinPct;
            
            propBreakdownHTML = `
                <div class="flex flex-wrap gap-2 text-xs mt-1">
                    <span class="text-gray-400">${typeEntries}</span>
                    <span class="text-gray-600">|</span>
                    <span class="text-cyan-400/70 cursor-pointer hover:text-cyan-300" onclick="filterUserPropertiesByInterior('${escapedId}', 'Walk-in')">${walkinPct}% Walk-in</span>
                    <span class="text-purple-400/70 cursor-pointer hover:text-purple-300" onclick="filterUserPropertiesByInterior('${escapedId}', 'Instance')">${instancePct}% Instance</span>
                </div>
            `;
        }
        
        const propertiesHTML = userProperties.length > 0 
            ? userProperties.map((p, index) => {
                const title = p.title || p.name || 'Unnamed Property';
                const isAvailable = state.availability[p.id] !== false;
                const typeIcon = typeIcons[p.type] || '🏠';
                const interiorIcon = p.interiorType === 'Walk-in' ? '🚶' : '🌀';
                // Check premium status from property data (real-time synced from Firestore)
                const isPremium = PropertyDataService.getValue(p.id, 'isPremium', p.isPremium || false);
                const premiumIndicator = isPremium ? '<span class="text-amber-400" title="Premium Listing - $10k/week">👑</span>' : '';
                return `
                    <div class="flex items-center justify-between py-1.5 border-b border-gray-700/50 last:border-0 user-property-item transition-all duration-300" data-type="${p.type || ''}" data-interior="${p.interiorType || ''}" data-propertyid="${p.id}">
                        <span class="text-gray-300 text-xs flex items-center gap-1">
                            <span class="text-gray-500">${index + 1}.</span>
                            <span title="${(p.type || 'unknown').charAt(0).toUpperCase() + (p.type || 'unknown').slice(1)}">${typeIcon}</span>
                            <span title="${p.interiorType || 'Unknown'}" class="text-gray-600">${interiorIcon}</span>
                            ${premiumIndicator}
                            <a onclick="viewPropertyStats(${p.id})" class="hover:text-cyan-400 cursor-pointer hover:underline transition">${title}</a>
                        </span>
                        <span class="text-xs ${isAvailable ? 'text-green-400' : 'text-red-400'}">${isAvailable ? '🟢' : '🔴'}</span>
                    </div>
                `;
            }).join('')
            : '<p class="text-gray-500 text-xs italic">No properties listed</p>';
        
        // Build premium listings tracking section
        let premiumTrackingHTML = '';
        const premiumListings = userProperties.filter(p => {
            const isPremium = PropertyDataService.getValue(p.id, 'isPremium', p.isPremium || false);
            const isPremiumTrial = PropertyDataService.getValue(p.id, 'isPremiumTrial', p.isPremiumTrial || false);
            return isPremium && !isPremiumTrial;
        });
        
        if (premiumListings.length > 0) {
            const premiumItems = premiumListings.map(p => {
                const title = p.title || p.name || 'Property';
                const premiumLastPayment = PropertyDataService.getValue(p.id, 'premiumLastPayment', p.premiumLastPayment || '');
                const weeklyFee = PropertyDataService.getValue(p.id, 'premiumWeeklyFee', p.premiumWeeklyFee || 10000);
                
                let lastPaidDisplay = 'Never';
                let nextDueDisplay = 'Not set';
                let daysUntilDue = null;
                let statusColor = 'text-gray-400';
                let statusIcon = '📅';
                let urgencyClass = '';
                
                if (premiumLastPayment) {
                    const [year, month, day] = premiumLastPayment.split('-').map(Number);
                    const lastDate = new Date(year, month - 1, day);
                    lastPaidDisplay = lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    
                    const nextDate = new Date(lastDate);
                    nextDate.setDate(nextDate.getDate() + 7); // Weekly premium
                    nextDueDisplay = nextDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    nextDate.setHours(0, 0, 0, 0);
                    daysUntilDue = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
                    
                    if (daysUntilDue < 0) {
                        statusColor = 'text-red-400';
                        statusIcon = '🚨';
                        urgencyClass = 'bg-red-900/40 border-red-500';
                        nextDueDisplay = `<span class="font-bold text-red-400">${Math.abs(daysUntilDue)}d OVERDUE!</span>`;
                    } else if (daysUntilDue === 0) {
                        statusColor = 'text-orange-400';
                        statusIcon = '⚠️';
                        urgencyClass = 'bg-orange-900/40 border-orange-500';
                        nextDueDisplay = `<span class="font-bold text-orange-400">DUE TODAY!</span>`;
                    } else if (daysUntilDue <= 2) {
                        statusColor = 'text-yellow-400';
                        statusIcon = '📢';
                        urgencyClass = 'bg-yellow-900/30 border-yellow-600';
                    } else {
                        statusColor = 'text-green-400';
                        statusIcon = '✅';
                        urgencyClass = 'bg-green-900/20 border-green-700';
                    }
                } else {
                    urgencyClass = 'bg-red-900/40 border-red-500';
                    statusIcon = '❓';
                    nextDueDisplay = '<span class="text-red-400 font-bold">No payment recorded!</span>';
                }
                
                // Plain text version of next due for reminder message
                const nextDuePlainText = premiumLastPayment 
                    ? (daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` 
                        : daysUntilDue === 0 ? 'today' 
                        : daysUntilDue === 1 ? 'tomorrow'
                        : `in ${daysUntilDue} days`)
                    : 'not yet set';
                
                // Escape title for data attribute
                const safeTitle = title.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                
                return `
                    <div class="flex flex-col gap-1 p-2 rounded-lg border ${urgencyClass}">
                        <div class="flex items-center justify-between">
                            <span class="text-white font-medium text-xs flex items-center gap-1">
                                ${statusIcon} 👑 ${title}
                            </span>
                            <span class="text-xs text-amber-400">$${weeklyFee.toLocaleString()}/wk</span>
                        </div>
                        <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-400">Last paid: <span class="${statusColor}">${lastPaidDisplay}</span></span>
                            <span class="text-gray-400">Next due: ${nextDueDisplay}</span>
                        </div>
                        <div class="flex items-center justify-between mt-1">
                            <button onclick="recordPremiumPayment(${p.id}, '${escapedEmail}')" 
                                class="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-bold transition flex items-center gap-1">
                                💰 Record Payment
                            </button>
                            <button onclick="copyPremiumReminder('${safeTitle}', ${weeklyFee}, '${nextDuePlainText}')" 
                                class="bg-amber-600 hover:bg-amber-700 text-white px-2 py-1 rounded text-xs font-bold transition flex items-center gap-1"
                                title="Copy reminder message">
                                📋 Copy Reminder
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
            
            premiumTrackingHTML = `
                <div class="mt-3 p-3 rounded-lg border border-amber-600/50 bg-amber-900/20">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="text-lg">👑</span>
                        <span class="text-amber-400 font-bold text-sm">Premium Listings (${premiumListings.length})</span>
                        <span class="text-xs text-gray-400">Weekly fee tracking</span>
                    </div>
                    <div class="space-y-2">
                        ${premiumItems}
                    </div>
                </div>
            `;
        }
        
        const pendingBadge = hasPendingRequest ? `
            <span class="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse ml-2">
                💰 WANTS ${(TIERS[pendingRequest?.requestedTier]?.name || 'Upgrade').toUpperCase()}
            </span>
        ` : '';
        
        // Subscription tracking HTML for Elite only (Pro tier removed, Starter is free)
        let subscriptionHTML = '';
        if (!isUserMasterAdmin && user.tier === 'elite') {
            const subLastPaid = user.subscriptionLastPaid || '';
            // Elite is now $25k/month
            const defaultPrice = 25000;
            const actualAmount = user.subscriptionAmount !== undefined ? user.subscriptionAmount : defaultPrice;
            const tierPrice = '$' + actualAmount.toLocaleString();
            const tierName = 'Elite 👑';
            const isFreeTrial = user.isFreeTrial === true;
            const trialEndDate = user.trialEndDate || '';
            const isProratedUpgrade = user.isProratedUpgrade === true;
            
            let nextDueDate = '';
            let daysUntilDue = null;
            let statusColor = 'text-gray-400';
            let statusBg = 'bg-gray-700';
            let statusIcon = '📅';
            
            let trialDaysLeft = null;
            if (isFreeTrial && trialEndDate) {
                const [tYear, tMonth, tDay] = trialEndDate.split('-').map(Number);
                const endDate = new Date(tYear, tMonth - 1, tDay);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                endDate.setHours(0, 0, 0, 0);
                trialDaysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
            }
            
            if (subLastPaid) {
                const [year, month, day] = subLastPaid.split('-').map(Number);
                const lastDate = new Date(year, month - 1, day);
                const nextDate = new Date(lastDate);
                nextDate.setDate(nextDate.getDate() + 30);
                nextDueDate = nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                nextDate.setHours(0, 0, 0, 0);
                daysUntilDue = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
                
                if (isFreeTrial) {
                    statusColor = 'text-cyan-400';
                    statusBg = 'bg-cyan-900/30 border-cyan-500';
                    statusIcon = '🎁';
                } else if (daysUntilDue < 0) {
                    statusColor = 'text-red-400';
                    statusBg = 'bg-red-900/50 border-red-500';
                    statusIcon = '🚨';
                } else if (daysUntilDue <= 3) {
                    statusColor = 'text-orange-400';
                    statusBg = 'bg-orange-900/50 border-orange-500';
                    statusIcon = '⚠️';
                } else if (daysUntilDue <= 7) {
                    statusColor = 'text-yellow-400';
                    statusBg = 'bg-yellow-900/30 border-yellow-600';
                    statusIcon = '📆';
                } else {
                    statusColor = 'text-green-400';
                    statusBg = 'bg-green-900/30 border-green-600';
                    statusIcon = '✅';
                }
            }
            
            const lastPaidDisplay = subLastPaid 
                ? (() => {
                    const [year, month, day] = subLastPaid.split('-').map(Number);
                    const localDate = new Date(year, month - 1, day);
                    return localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                })()
                : 'Never';
            
            const dueDisplay = daysUntilDue !== null
                ? (daysUntilDue < 0 
                    ? `<span class="text-red-400 font-bold">${Math.abs(daysUntilDue)}d OVERDUE!</span>`
                    : daysUntilDue === 0
                        ? `<span class="text-orange-400 font-bold">DUE TODAY!</span>`
                        : `<span class="${statusColor}">${daysUntilDue}d left</span>`)
                : '<span class="text-gray-500">Not set</span>';
            
            const trialBadge = isFreeTrial ? `
                <span class="bg-cyan-600 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2">🎁 FREE TRIAL</span>
                ${trialDaysLeft !== null ? `<span class="text-cyan-400 text-xs ml-1">(${trialDaysLeft}d left)</span>` : ''}
            ` : '';
            
            const toggleTrialBtn = isFreeTrial ? `
                <button onclick="convertTrialToPaid('${escapedId}', '${escapedEmail}')" 
                    class="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-bold transition">
                    💰 Convert to Paid
                </button>
            ` : `
                <button onclick="markAsTrial('${escapedId}', '${escapedEmail}')" 
                    class="bg-cyan-600 hover:bg-cyan-700 text-white px-2 py-1 rounded text-xs font-bold transition">
                    🎁 Mark as Trial
                </button>
            `;
            
            const proratedBadge = isProratedUpgrade ? `<span class="bg-amber-600 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2">💰 PRORATED</span>` : '';
            
            const subscriptionLabel = isFreeTrial 
                ? `${tierName} Trial` 
                : `Subscription: ${tierPrice}/mo`;
            
            // Add edit amount button for non-trial users
            const editAmountBtn = !isFreeTrial ? `
                <button onclick="editSubscriptionAmount('${escapedId}', '${escapedEmail}', ${actualAmount})" 
                    class="text-gray-400 hover:text-white text-xs ml-1" title="Edit subscription amount">
                    ✏️
                </button>
            ` : '';
            
            subscriptionHTML = `
                <div class="mt-3 p-3 rounded-lg border ${statusBg}">
                    <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div class="flex items-center gap-2">
                            <span class="text-lg">${statusIcon}</span>
                            <span class="text-white font-bold text-sm">${subscriptionLabel}</span>
                            ${editAmountBtn}
                            ${trialBadge}
                            ${proratedBadge}
                        </div>
                        <div class="flex items-center gap-2">
                            ${toggleTrialBtn}
                            <button onclick="openSubscriptionPaymentModal('${escapedId}', '${escapedEmail}', '${displayName.replace(/'/g, "\\'")}', '${subLastPaid}', ${user.subscriptionAmount || 25000})" 
                                class="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-bold transition">
                                💰 Record Payment
                            </button>
                            <button onclick="openSubscriptionReminderModal('${escapedId}', '${escapedEmail}', '${displayName.replace(/'/g, "\\'")}', '${user.tier}', '${tierPrice}', ${daysUntilDue})" 
                                class="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs font-bold transition">
                                📋 Scripts
                            </button>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3 text-xs">
                        <div>
                            <span class="text-gray-400">${isFreeTrial ? 'Trial Started:' : 'Last Paid:'}</span>
                            <span class="sub-last-paid text-white ml-1 cursor-pointer hover:text-cyan-400" 
                                  onclick="editSubscriptionDate('${escapedId}', '${escapedEmail}', '${subLastPaid}')">
                                ${lastPaidDisplay} ✏️
                            </span>
                        </div>
                        <div>
                            <span class="text-gray-400">${isFreeTrial ? 'Trial Ends:' : 'Next Due:'}</span>
                            <span class="ml-1">${nextDueDate || '-'}</span>
                            ${dueDisplay}
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Build action buttons based on current tier (Pro tier removed - only Starter and Elite)
        let actionButtonsHTML = '';
        if (!isUserMasterAdmin) {
            const buttons = [];
            
            if (user.tier === 'starter' || user.tier === 'pro' || !user.tier) {
                // Starter (or legacy Pro) can upgrade to Elite only
                buttons.push(`<button onclick="adminUpgradeUser('${escapedEmail}', 'elite', '${user.tier || 'starter'}')" 
                    class="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-2 rounded-lg font-bold text-xs hover:opacity-90 transition">
                    👑 Upgrade to Elite
                </button>`);
            } else if (user.tier === 'elite') {
                // Elite can only downgrade to Starter
                buttons.push(`<button onclick="adminDowngradeUser('${escapedEmail}', '${user.tier}', 'starter')" 
                    class="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-3 py-2 rounded-lg font-bold text-xs hover:opacity-90 transition">
                    🌱 Downgrade to Starter
                </button>`);
            }
            
            // Reset Password button
            buttons.push(`<button onclick="openResetPasswordModal('${escapedEmail}', '${displayName.replace(/'/g, "\\'")}')" 
                class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-lg font-bold text-xs hover:opacity-90 transition">
                🔑 Reset Password
            </button>`);
            
            // Delete button for all
            buttons.push(`<button onclick="adminDeleteUser('${escapedId}', '${escapedEmail}')" 
                class="bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-2 rounded-lg font-bold text-xs hover:opacity-90 transition">
                🗑️ Delete
            </button>`);
            
            actionButtonsHTML = `<div class="flex flex-wrap gap-2">${buttons.join('')}</div>`;
        }
        const actionButtons = actionButtonsHTML;
        
        const cardBorder = hasPendingRequest 
            ? 'border-orange-500 ring-2 ring-orange-500/50 animate-pulse'
            : (isUserMasterAdmin ? 'border-red-600/50' : 'border-gray-700');
        
        return `
            <div class="bg-gray-800 rounded-xl p-3 border ${cardBorder} admin-user-card" data-email="${user.email}" data-userid="${escapedId}">
                <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-2">
                    <div class="flex-1">
                        <!-- Row 1: Icon, Name, Email -->
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-xl">${tierData.icon}</span>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span id="displayName_${escapedId}" class="text-white font-bold">${displayName}</span>
                                    <button onclick="event.stopPropagation(); adminEditDisplayName('${escapedId}', '${escapedEmail}', '${displayName.replace(/'/g, "\\'")}')" 
                                            class="text-gray-500 hover:text-cyan-400 text-xs transition" title="Edit display name">✏️</button>
                                    ${pendingBadge}
                                </div>
                                <div class="text-gray-500 text-xs truncate">${user.email}</div>
                            </div>
                        </div>
                        <!-- Row 2: Tier badge, Phone, Listings, Properties toggle -->
                        <div class="flex flex-wrap items-center gap-2 text-xs mb-2">
                            <span class="px-2 py-0.5 rounded ${tierData.bgColor} text-white font-bold">${tierData.name}</span>
                            ${user.managedServicesInterest ? `<span class="px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold flex items-center gap-1 animate-pulse" title="Interested in Managed Services">
                                🚀 VIP LEAD
                            </span>` : ''}
                            <span class="text-gray-400 flex items-center gap-1">
                                📱 <span onclick="event.stopPropagation(); editUserPhone('${escapedId}', '${escapeHtml(user.phone || '')}')" 
                                         class="cursor-pointer hover:text-cyan-400 transition" title="Click to edit phone">${user.phone || 'No phone'}</span>
                                ${user.phone ? `<button onclick="event.stopPropagation(); copyPhoneNumber('${(user.phone || '').replace(/[^0-9]/g, '')}')" 
                                        class="text-cyan-400 hover:text-cyan-300" title="Copy phone number">📋</button>` : ''}
                            </span>
                            <span class="text-gray-400">${listingCount}/${maxListings} listings</span>
                            <button onclick="toggleUserProperties('${escapedId}')" class="text-cyan-400 hover:underline flex items-center gap-1">
                                <span id="propToggle_${escapedId}">▶</span> Properties (${listingCount})
                            </button>
                        </div>
                        <!-- Row 3: Activity Info (compact) -->
                        <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 bg-gray-900/30 rounded-lg px-2 py-1.5 mb-2">
                            <div title="Account created">
                                <span class="text-gray-500">📅 Joined:</span> 
                                <span class="text-gray-300">${createdAt}</span>
                            </div>
                            <div title="Last login time">
                                <span class="text-gray-500">🕐 Last Login:</span> 
                                <span class="text-gray-300">${lastLogin}</span>
                            </div>
                            <div title="Last property posted">
                                <span class="text-gray-500">🏠 Last Post:</span> 
                                <span class="text-gray-300">${lastPropertyPost}</span>
                            </div>
                        </div>
                        ${propBreakdownHTML}
                        <!-- Properties List -->
                        <div id="propList_${escapedId}" class="hidden mt-2 bg-gray-900/50 rounded-lg p-2 max-h-32 overflow-y-auto">
                            ${propertiesHTML}
                        </div>
                        ${subscriptionHTML}
                        ${premiumTrackingHTML}
                    </div>
                    ${actionButtons}
                </div>
            </div>
        `;
    };
    
    // Render grouped sections
    let html = '';
    
    // VIP Leads section - REMOVED per user request
    // (managedServicesInterest feature has been deprecated)
    
    // Owner/Admin section (expanded by default)
    if (groups.owner.length > 0) {
        html += `
            <div class="mb-6">
                <div class="flex items-center gap-2 mb-3 pb-2 border-b border-red-600/50 cursor-pointer hover:opacity-80 transition" onclick="toggleUserGroup('ownerGroup')">
                    <span id="ownerGroupToggle" class="text-gray-400 transition">▼</span>
                    <span class="text-xl">👑</span>
                    <h5 class="text-red-400 font-bold">Owner / Admin</h5>
                    <span class="text-gray-500 text-sm">(${groups.owner.length})</span>
                </div>
                <div id="ownerGroup" class="space-y-3">
                    ${groups.owner.map(renderUserCard).join('')}
                </div>
            </div>
        `;
    }
    
    // Elite section (expanded by default)
    if (groups.elite.length > 0) {
        // Calculate actual elite revenue for header
        const elitePaidCount = groups.elite.filter(u => !u.isFreeTrial).length;
        const eliteTrialCount = groups.elite.filter(u => u.isFreeTrial).length;
        const proratedEliteCount = groups.elite.filter(u => u.isProratedUpgrade && !u.isFreeTrial).length;
        let eliteSubLabel = '';
        if (elitePaidCount > 0 && proratedEliteCount > 0) {
            eliteSubLabel = `${elitePaidCount} paid (${proratedEliteCount} prorated)`;
        } else if (elitePaidCount > 0) {
            eliteSubLabel = `${elitePaidCount} × $50k/mo`;
        }
        if (eliteTrialCount > 0) {
            eliteSubLabel += eliteSubLabel ? `, ${eliteTrialCount} trial` : `${eliteTrialCount} on trial`;
        }
        
        html += `
            <div class="mb-6">
                <div class="flex items-center gap-2 mb-3 pb-2 border-b border-yellow-600/50 cursor-pointer hover:opacity-80 transition" onclick="toggleUserGroup('eliteGroup')">
                    <span id="eliteGroupToggle" class="text-gray-400 transition">▼</span>
                    <span class="text-xl">👑</span>
                    <h5 class="text-yellow-400 font-bold">Elite Members</h5>
                    <span class="text-gray-500 text-sm">(${groups.elite.length})${eliteSubLabel ? ' • ' + eliteSubLabel : ''}</span>
                </div>
                <div id="eliteGroup" class="space-y-3">
                    ${groups.elite.map(renderUserCard).join('')}
                </div>
            </div>
        `;
    }
    
    // Pro section - REMOVED (tier retired, merged into Starter)
    
    // Starter section (expanded by default)
    if (groups.starter.length > 0) {
        html += `
            <div class="mb-6">
                <div class="flex items-center gap-2 mb-3 pb-2 border-b border-green-600/50 cursor-pointer hover:opacity-80 transition" onclick="toggleUserGroup('starterGroup')">
                    <span id="starterGroupToggle" class="text-gray-400 transition">▼</span>
                    <span class="text-xl">🌱</span>
                    <h5 class="text-green-400 font-bold">Starter Members</h5>
                    <span class="text-gray-500 text-sm">(${groups.starter.length}) • Free tier</span>
                </div>
                <div id="starterGroup" class="space-y-3">
                    ${groups.starter.map(renderUserCard).join('')}
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html || '<p class="text-gray-500 italic">No users found.</p>';
};

window.toggleUserProperties = function(userId) {
    const list = $('propList_' + userId);
    const toggle = $('propToggle_' + userId);
    if (list && toggle) {
        if (list.classList.contains('hidden')) {
            list.classList.remove('hidden');
            toggle.textContent = '▼';
        } else {
            list.classList.add('hidden');
            toggle.textContent = '▶';
        }
    }
};

// Toggle user group visibility (collapsible sections)
window.toggleUserGroup = function(groupId) {
    const group = $(groupId);
    const toggle = $(groupId + 'Toggle');
    if (group && toggle) {
        if (group.classList.contains('hidden')) {
            group.classList.remove('hidden');
            toggle.textContent = '▼';
        } else {
            group.classList.add('hidden');
            toggle.textContent = '▶';
        }
    }
};

// Filter user properties by type (House, Apartment, etc.)
window.filterUserPropertiesByType = function(userId, type) {
    const list = $('propList_' + userId);
    if (!list) return;
    
    // Make sure the list is visible
    list.classList.remove('hidden');
    const toggle = $('propToggle_' + userId);
    if (toggle) toggle.textContent = '▼';
    
    // Get all property items
    const items = list.querySelectorAll('.user-property-item');
    let visibleCount = 0;
    
    items.forEach(item => {
        const itemType = item.dataset.type;
        if (itemType === type) {
            item.style.display = '';
            item.style.background = 'rgba(34, 211, 238, 0.1)'; // cyan highlight
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });
    
    // Show toast with filter info
    const typeIcons = { house: '🏠', apartment: '🏢', condo: '🏨', villa: '🏡', hotel: '🏩', office: '🏢', warehouse: '🏭', hideout: '🏚️' };
    showToast(`${typeIcons[type] || '🏠'} Showing ${visibleCount} ${type}${visibleCount !== 1 ? 's' : ''} - Click "Show All" to reset`, 'info');
    
    // Add a "Show All" button if not already present
    if (!list.querySelector('.show-all-btn')) {
        const showAllBtn = document.createElement('button');
        showAllBtn.className = 'show-all-btn mt-2 text-xs text-cyan-400 hover:text-cyan-300 underline cursor-pointer';
        showAllBtn.textContent = '↩ Show All Properties';
        showAllBtn.onclick = () => resetUserPropertiesFilter(userId);
        list.appendChild(showAllBtn);
    }
};

// Filter user properties by interior type (Walk-in, Instance)
window.filterUserPropertiesByInterior = function(userId, interiorType) {
    const list = $('propList_' + userId);
    if (!list) return;
    
    // Make sure the list is visible
    list.classList.remove('hidden');
    const toggle = $('propToggle_' + userId);
    if (toggle) toggle.textContent = '▼';
    
    // Get all property items
    const items = list.querySelectorAll('.user-property-item');
    let visibleCount = 0;
    
    items.forEach(item => {
        const itemInterior = item.dataset.interior;
        if (itemInterior === interiorType) {
            item.style.display = '';
            item.style.background = interiorType === 'Walk-in' ? 'rgba(34, 211, 238, 0.1)' : 'rgba(168, 85, 247, 0.1)';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });
    
    const icon = interiorType === 'Walk-in' ? '🚶' : '🌀';
    showToast(`${icon} Showing ${visibleCount} ${interiorType} properties - Click "Show All" to reset`, 'info');
    
    // Add a "Show All" button if not already present
    if (!list.querySelector('.show-all-btn')) {
        const showAllBtn = document.createElement('button');
        showAllBtn.className = 'show-all-btn mt-2 text-xs text-cyan-400 hover:text-cyan-300 underline cursor-pointer';
        showAllBtn.textContent = '↩ Show All Properties';
        showAllBtn.onclick = () => resetUserPropertiesFilter(userId);
        list.appendChild(showAllBtn);
    }
};

// Reset user properties filter
window.resetUserPropertiesFilter = function(userId) {
    const list = $('propList_' + userId);
    if (!list) return;
    
    const items = list.querySelectorAll('.user-property-item');
    items.forEach(item => {
        item.style.display = '';
        item.style.background = '';
    });
    
    // Remove the "Show All" button
    const showAllBtn = list.querySelector('.show-all-btn');
    if (showAllBtn) showAllBtn.remove();
    
    showToast('Showing all properties', 'info');
};

window.filterAdminUsers = function() {
    const searchTerm = ($('adminUserSearch')?.value || '').toLowerCase();
    const filtered = window.adminUsersData.filter(user => {
        return user.email.toLowerCase().includes(searchTerm) ||
               (user.username || '').toLowerCase().includes(searchTerm);
    });
    renderAdminUsersList(filtered);
};


// ==================== SUBSCRIPTION COLLECTION ALERTS ====================
/**
 * Render subscription collection alerts panel
 * Shows Pro and Elite users whose subscriptions are due for payment
 * Admin-only feature to track tier subscription payments
 */
window.renderSubscriptionAlertsPanel = async function() {
    
    const panel = $('subscriptionNotificationsPanel');
    if (!panel) {
        return;
    }
    
    // Only show for master admin
    if (!TierService.isMasterAdmin(auth?.currentUser?.email)) {
        panel.classList.add('hidden');
        return;
    }
    
    try {
        // Get all users
        const usersSnapshot = await db.collection('users').get();
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const overdue = [];
        const dueToday = [];
        const dueTomorrow = [];
        const neverPaid = [];
        
        usersSnapshot.forEach(doc => {
            const user = doc.data();
            
            // Only Elite users have subscriptions now (Starter is free, Pro removed)
            if (user.tier !== 'elite') return;
            if (TierService.isMasterAdmin(user.email)) return;
            if (user.isTrial || user.isFreeTrial) return; // Skip trial users
            
            // Use subscriptionLastPaid + 30 days as the canonical due date calculation
            // This matches what's shown on user cards
            let dueDate = null;
            
            if (user.subscriptionLastPaid) {
                // Parse the date string (format: YYYY-MM-DD)
                const [year, month, day] = user.subscriptionLastPaid.split('-').map(Number);
                const lastPaid = new Date(year, month - 1, day);
                dueDate = new Date(lastPaid);
                dueDate.setDate(dueDate.getDate() + 30); // Monthly subscription
            } else {
                // Never paid - add to neverPaid list
                neverPaid.push({
                    odId: doc.id,
                    email: user.email,
                    username: user.username || user.email.split('@')[0],
                    tier: user.tier,
                    amount: user.subscriptionAmount || 25000,
                    daysUntilDue: null,
                    lastPaid: ''
                });
                return;
            }
            
            if (!dueDate || isNaN(dueDate.getTime())) {
                return;
            }
            
            const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
            const daysUntilDue = Math.floor((dueDateOnly - today) / (1000 * 60 * 60 * 24));
            
            const subInfo = {
                odId: doc.id,
                email: user.email,
                username: user.username || user.email.split('@')[0],
                tier: user.tier,
                amount: user.subscriptionAmount || 25000, // Elite is $25k/month, or custom amount
                dueDate: dueDate,
                dueDateFormatted: dueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                daysUntilDue: daysUntilDue,
                lastPaid: user.subscriptionLastPaid || ''
            };
            
            if (daysUntilDue < 0) {
                overdue.push(subInfo);
            } else if (daysUntilDue === 0) {
                dueToday.push(subInfo);
            } else if (daysUntilDue === 1) {
                dueTomorrow.push(subInfo);
            }
        });
        
        const total = overdue.length + dueToday.length + dueTomorrow.length + neverPaid.length;
        
        if (total === 0) {
            panel.classList.add('hidden');
            return;
        }
        
        panel.classList.remove('hidden');
        
        const isUrgent = overdue.length > 0 || neverPaid.length > 0;
        const isWarning = dueToday.length > 0;
        
        const borderColor = isUrgent ? 'border-red-500/70' : isWarning ? 'border-orange-500/70' : 'border-cyan-500/70';
        const headerGradient = isUrgent ? 'from-red-600 to-red-700' : isWarning ? 'from-orange-500 to-red-500' : 'from-cyan-500 to-blue-500';
        const headerIcon = isUrgent ? '🚨' : isWarning ? '⏰' : '📅';
        
        let html = `
            <div class="glass-effect rounded-2xl shadow-2xl overflow-hidden border-2 ${borderColor}">
                <div class="bg-gradient-to-r ${headerGradient} px-6 py-4 cursor-pointer" onclick="toggleSubscriptionPanel()">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <span class="text-2xl">${headerIcon}</span>
                            <div>
                                <h3 class="text-xl font-bold text-white">Subscription Collection Alert</h3>
                                <p class="text-white/80 text-sm">${total} subscription${total !== 1 ? 's' : ''} need${total === 1 ? 's' : ''} attention</p>
                            </div>
                        </div>
                        <div id="subscriptionPanelToggle" class="text-white/80 hover:text-white transition">
                            <svg class="w-6 h-6 transform transition-transform" id="subscriptionPanelArrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </div>
                    </div>
                </div>
                <div id="subscriptionPanelContent" class="p-4 space-y-4">
        `;
        
        // Never paid section (highest priority)
        if (neverPaid.length > 0) {
            html += `
                <div class="bg-red-900/30 rounded-xl p-4 border border-red-500/50">
                    <h4 class="text-red-400 font-bold mb-3 flex items-center gap-2">
                        <span>🚨</span> NEVER PAID (${neverPaid.length})
                    </h4>
                    <div class="space-y-2">
                        ${neverPaid.map(sub => renderSubscriptionItem(sub, 'never')).join('')}
                    </div>
                </div>
            `;
        }
        
        if (overdue.length > 0) {
            html += `
                <div class="bg-red-900/30 rounded-xl p-4 border border-red-500/50">
                    <h4 class="text-red-400 font-bold mb-3 flex items-center gap-2">
                        <span>🚨</span> OVERDUE (${overdue.length})
                    </h4>
                    <div class="space-y-2">
                        ${overdue.map(sub => renderSubscriptionItem(sub, 'overdue')).join('')}
                    </div>
                </div>
            `;
        }
        
        if (dueToday.length > 0) {
            html += `
                <div class="bg-orange-900/30 rounded-xl p-4 border border-orange-500/50">
                    <h4 class="text-orange-400 font-bold mb-3 flex items-center gap-2">
                        <span>⏰</span> DUE TODAY (${dueToday.length})
                    </h4>
                    <div class="space-y-2">
                        ${dueToday.map(sub => renderSubscriptionItem(sub, 'today')).join('')}
                    </div>
                </div>
            `;
        }
        
        if (dueTomorrow.length > 0) {
            html += `
                <div class="bg-cyan-900/30 rounded-xl p-4 border border-cyan-500/50">
                    <h4 class="text-cyan-400 font-bold mb-3 flex items-center gap-2">
                        <span>📅</span> DUE TOMORROW (${dueTomorrow.length})
                    </h4>
                    <div class="space-y-2">
                        ${dueTomorrow.map(sub => renderSubscriptionItem(sub, 'tomorrow')).join('')}
                    </div>
                </div>
            `;
        }
        
        html += `
                </div>
            </div>
        `;
        
        panel.innerHTML = html;
        
        // Set global subscription alert count for notification badges
        window.subscriptionAlertCount = total;
        
    } catch (error) {
        console.error('[SubscriptionAlerts] Error:', error);
        panel.classList.add('hidden');
        window.subscriptionAlertCount = 0;
    }
};

function renderSubscriptionItem(sub, urgency) {
    const statusColors = {
        never: 'text-red-300',
        overdue: 'text-red-300',
        today: 'text-orange-300',
        tomorrow: 'text-yellow-300'
    };
    
    const borderColors = {
        never: 'border-l-red-500',
        overdue: 'border-l-red-500',
        today: 'border-l-orange-500',
        tomorrow: 'border-l-yellow-500'
    };
    
    const tierIcon = sub.tier === 'elite' ? '👑' : '⭐';
    const tierColor = sub.tier === 'elite' ? 'text-yellow-400' : 'text-purple-400';
    const tierLabel = sub.tier.toUpperCase();
    
    // Generate reminder message
    let reminderMsg = '';
    let dueDisplay = sub.dueDateFormatted || 'Never paid';
    
    if (urgency === 'never' || sub.daysUntilDue === null) {
        reminderMsg = `Hey ${sub.username}! 👋 Welcome to ${tierLabel}! We haven't received your first subscription payment yet. 💰 $${sub.amount.toLocaleString()} for the ${tierLabel} plan. Let me know when you're ready to meet up!`;
        dueDisplay = 'Never paid';
    } else if (sub.daysUntilDue === 1) {
        reminderMsg = `Hey ${sub.username}! 👋 Just a friendly reminder that your ${tierLabel} subscription payment of $${sub.amount.toLocaleString()} is due tomorrow (${sub.dueDateFormatted}). Let me know if you have any questions!`;
    } else if (sub.daysUntilDue === 0) {
        reminderMsg = `Hey ${sub.username}! 👋 Just a friendly reminder that your ${tierLabel} subscription payment of $${sub.amount.toLocaleString()} is due today (${sub.dueDateFormatted}). Let me know if you have any questions!`;
    } else if (sub.daysUntilDue < 0) {
        const daysOverdue = Math.abs(sub.daysUntilDue);
        reminderMsg = `Hey ${sub.username}, your ${tierLabel} subscription payment of $${sub.amount.toLocaleString()} was due on ${sub.dueDateFormatted} (${daysOverdue} day${daysOverdue > 1 ? 's' : ''} ago). Please make your payment as soon as possible to maintain your ${sub.tier} benefits!`;
    }
    
    const escapedReminder = reminderMsg.replace(/'/g, "\\'").replace(/"/g, '\\"');
    const escapedEmail = sub.email.replace(/'/g, "\\'");
    const escapedUsername = (sub.username || '').replace(/'/g, "\\'");
    const escapedOdId = (sub.odId || '').replace(/'/g, "\\'");
    const itemId = sub.email.replace(/[^a-zA-Z0-9]/g, '_'); // Safe id from email
    
    return `
        <div id="sub-item-${itemId}" data-email="${sub.email}" class="bg-gray-800/50 rounded-lg border border-gray-700 border-l-4 ${borderColors[urgency] || 'border-l-gray-500'} p-3 flex items-center justify-between gap-3 hover:bg-gray-700/50 transition cursor-pointer">
            <div class="flex-1 min-w-0">
                <div class="text-white font-medium truncate flex items-center gap-2">
                    <span class="${tierColor}">${tierIcon}</span>
                    ${sub.username}
                    <span class="text-xs ${tierColor} font-bold uppercase">${tierLabel}</span>
                </div>
                <div class="text-gray-400 text-sm">${sub.email}</div>
                <div class="${statusColors[urgency] || 'text-gray-400'} text-xs">Due: ${dueDisplay}</div>
            </div>
            <div class="text-right flex flex-col items-end gap-1">
                <div class="text-white font-bold">$${sub.amount.toLocaleString()}</div>
                <div class="flex items-center gap-2">
                    <button onclick="event.stopPropagation(); openSubscriptionPaymentModal('${escapedOdId}', '${escapedEmail}', '${escapedUsername}', '${sub.lastPaid || ''}', ${sub.amount})" 
                            class="bg-green-600 hover:bg-green-500 text-white text-xs px-2 py-1 rounded font-bold transition"
                            style="outline: none;">
                        💰 Pay
                    </button>
                    <button onclick="event.stopPropagation(); copySubscriptionReminder('${escapedReminder}')" 
                            class="text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1"
                            style="outline: none;">
                        📋 Copy
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Navigate to admin panel and highlight a user by email
 */
window.goToAdminUserByEmail = function(email) {
    // Switch to admin panel tab (use 'admin' not 'adminPanel')
    if (typeof switchDashboardTab === 'function') {
        switchDashboardTab('admin');
    } else {
        console.error('[goToAdminUserByEmail] switchDashboardTab function not found');
    }
    
    // Wait for admin panel to render, then search for and highlight the user
    setTimeout(function() {
        const searchInput = $('adminUserSearch');
        
        if (searchInput) {
            searchInput.value = email;
            // Trigger the search
            if (typeof filterAdminUsers === 'function') {
                filterAdminUsers();
            }
            
            // Scroll to users section and highlight
            setTimeout(function() {
                // Find and highlight the user card using data-email attribute
                const userCard = document.querySelector(`.admin-user-card[data-email="${email}"]`);
                
                if (userCard) {
                    userCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    userCard.classList.add('ring-2', 'ring-yellow-400', 'ring-offset-2', 'ring-offset-gray-900');
                    // Remove highlight after 3 seconds
                    setTimeout(() => {
                        userCard.classList.remove('ring-2', 'ring-yellow-400', 'ring-offset-2', 'ring-offset-gray-900');
                    }, 3000);
                }
            }, 300);
        }
    }, 500);
};

window.toggleSubscriptionPanel = function() {
    const content = $('subscriptionPanelContent');
    const arrow = $('subscriptionPanelArrow');
    if (content && arrow) {
        content.classList.toggle('hidden');
        arrow.classList.toggle('rotate-180');
    }
};

window.copySubscriptionReminder = function(message) {
    navigator.clipboard.writeText(message).then(() => {
        showToast('📋 Reminder copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showToast('Failed to copy message', 'error');
    });
};

// Event delegation handler for subscription panel clicks
window.handleSubscriptionPanelClick = function(event) {
    // Check if clicked on the header area (gradient background)
    const header = event.target.closest('.bg-gradient-to-r');
    if (header) {
        toggleSubscriptionPanel();
        return;
    }
    
    // Check if clicked on copy button
    if (event.target.closest('button') && event.target.textContent.includes('Copy')) {
        // The button's own onclick should handle this
        return;
    }
    
    // Check if clicked on a subscription item row (has id starting with sub-item-)
    const subItem = event.target.closest('[id^="sub-item-"]');
    if (subItem) {
        const email = subItem.dataset.email;
        if (email) {
            goToAdminUserByEmail(email);
        }
    }
};

// ============================================================
// PREMIUM LISTING ALERTS PANEL
// ============================================================

/**
 * Render premium listing collection alerts panel
 * Shows all premium listings with overdue/due weekly fees
 */
window.renderPremiumAlertsPanel = async function() {
    const panel = $('premiumNotificationsPanel');
    if (!panel) {
        return;
    }
    
    // Only show for master admin
    if (!TierService.isMasterAdmin(auth?.currentUser?.email)) {
        panel.classList.add('hidden');
        return;
    }
    
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const overdue = [];
        const dueToday = [];
        const dueTomorrow = [];
        const neverPaid = [];
        
        // Get all premium listings from the global properties array
        const premiumListings = (typeof properties !== 'undefined' && Array.isArray(properties))
            ? properties.filter(p => {
                const isPremium = PropertyDataService.getValue(p.id, 'isPremium', p.isPremium || false);
                const isPremiumTrial = PropertyDataService.getValue(p.id, 'isPremiumTrial', p.isPremiumTrial || false);
                return isPremium && !isPremiumTrial;
            })
            : [];
        
        premiumListings.forEach(p => {
            const title = p.title || p.name || 'Property ' + p.id;
            const premiumLastPayment = PropertyDataService.getValue(p.id, 'premiumLastPayment', p.premiumLastPayment || '');
            const weeklyFee = PropertyDataService.getValue(p.id, 'premiumWeeklyFee', p.premiumWeeklyFee || 10000);
            const ownerEmail = (p.ownerEmail || '').toLowerCase();
            
            // Get owner name
            const ownerUser = window.adminUsersData?.find(u => u.email?.toLowerCase() === ownerEmail);
            const ownerName = ownerUser?.username || ownerEmail.split('@')[0] || 'Unknown';
            
            let dueDate = null;
            let daysUntilDue = null;
            
            if (premiumLastPayment) {
                const [year, month, day] = premiumLastPayment.split('-').map(Number);
                const lastDate = new Date(year, month - 1, day);
                dueDate = new Date(lastDate);
                dueDate.setDate(dueDate.getDate() + 7); // Weekly premium
                
                dueDate.setHours(0, 0, 0, 0);
                daysUntilDue = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
            }
            
            const premiumInfo = {
                propertyId: p.id,
                title: title,
                ownerEmail: ownerEmail,
                ownerName: ownerName,
                amount: weeklyFee,
                dueDate: dueDate,
                dueDateFormatted: dueDate ? dueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : null,
                daysUntilDue: daysUntilDue,
                lastPaid: premiumLastPayment
            };
            
            if (!premiumLastPayment) {
                neverPaid.push(premiumInfo);
            } else if (daysUntilDue < 0) {
                overdue.push(premiumInfo);
            } else if (daysUntilDue === 0) {
                dueToday.push(premiumInfo);
            } else if (daysUntilDue === 1) {
                dueTomorrow.push(premiumInfo);
            }
        });
        
        const total = overdue.length + dueToday.length + dueTomorrow.length + neverPaid.length;
        
        if (total === 0) {
            panel.classList.add('hidden');
            return;
        }
        
        panel.classList.remove('hidden');
        
        const isUrgent = overdue.length > 0 || neverPaid.length > 0;
        const isWarning = dueToday.length > 0;
        
        const borderColor = isUrgent ? 'border-amber-500/70' : isWarning ? 'border-orange-500/70' : 'border-cyan-500/70';
        const headerGradient = isUrgent ? 'from-amber-600 to-orange-600' : isWarning ? 'from-orange-500 to-amber-500' : 'from-cyan-500 to-blue-500';
        const headerIcon = isUrgent ? '👑' : isWarning ? '⏰' : '📅';
        
        let html = `
            <div class="glass-effect rounded-2xl shadow-2xl overflow-hidden border-2 ${borderColor}">
                <div class="bg-gradient-to-r ${headerGradient} px-6 py-4 cursor-pointer" onclick="togglePremiumPanel()">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <span class="text-2xl">${headerIcon}</span>
                            <div>
                                <h3 class="text-xl font-bold text-white">Premium Listing Collection Alert</h3>
                                <p class="text-white/80 text-sm">${total} premium listing${total !== 1 ? 's' : ''} need${total === 1 ? 's' : ''} payment</p>
                            </div>
                        </div>
                        <div id="premiumPanelToggle" class="text-white/80 hover:text-white transition">
                            <svg class="w-6 h-6 transform transition-transform" id="premiumPanelArrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </div>
                    </div>
                </div>
                <div id="premiumPanelContent" class="p-4 space-y-4">
        `;
        
        if (neverPaid.length > 0) {
            html += `
                <div class="bg-red-900/30 rounded-xl p-4 border border-red-500/50">
                    <h4 class="text-red-400 font-bold mb-3 flex items-center gap-2">
                        <span>🚨</span> NEVER PAID (${neverPaid.length})
                    </h4>
                    <div class="space-y-2">
                        ${neverPaid.map(p => renderPremiumItem(p, 'never')).join('')}
                    </div>
                </div>
            `;
        }
        
        if (overdue.length > 0) {
            html += `
                <div class="bg-red-900/30 rounded-xl p-4 border border-red-500/50">
                    <h4 class="text-red-400 font-bold mb-3 flex items-center gap-2">
                        <span>🚨</span> OVERDUE (${overdue.length})
                    </h4>
                    <div class="space-y-2">
                        ${overdue.map(p => renderPremiumItem(p, 'overdue')).join('')}
                    </div>
                </div>
            `;
        }
        
        if (dueToday.length > 0) {
            html += `
                <div class="bg-orange-900/30 rounded-xl p-4 border border-orange-500/50">
                    <h4 class="text-orange-400 font-bold mb-3 flex items-center gap-2">
                        <span>⏰</span> DUE TODAY (${dueToday.length})
                    </h4>
                    <div class="space-y-2">
                        ${dueToday.map(p => renderPremiumItem(p, 'today')).join('')}
                    </div>
                </div>
            `;
        }
        
        if (dueTomorrow.length > 0) {
            html += `
                <div class="bg-cyan-900/30 rounded-xl p-4 border border-cyan-500/50">
                    <h4 class="text-cyan-400 font-bold mb-3 flex items-center gap-2">
                        <span>📅</span> DUE TOMORROW (${dueTomorrow.length})
                    </h4>
                    <div class="space-y-2">
                        ${dueTomorrow.map(p => renderPremiumItem(p, 'tomorrow')).join('')}
                    </div>
                </div>
            `;
        }
        
        html += `
                </div>
            </div>
        `;
        
        panel.innerHTML = html;
        
        // Set global premium alert count
        window.premiumAlertCount = total;
        
    } catch (error) {
        console.error('[PremiumAlerts] Error:', error);
        panel.classList.add('hidden');
        window.premiumAlertCount = 0;
    }
};

function renderPremiumItem(item, urgency) {
    const statusColors = {
        never: 'text-red-300',
        overdue: 'text-red-300',
        today: 'text-orange-300',
        tomorrow: 'text-yellow-300'
    };
    
    const borderColors = {
        never: 'border-l-red-500',
        overdue: 'border-l-red-500',
        today: 'border-l-orange-500',
        tomorrow: 'border-l-yellow-500'
    };
    
    let dueDisplay = item.dueDateFormatted || 'Never paid';
    let reminderMsg = '';
    
    if (urgency === 'never') {
        reminderMsg = `Hey ${item.ownerName}! 👋 Just a reminder about the premium listing fee for "${item.title}". 💰 $${item.amount.toLocaleString()}/week. Let me know when you're ready to meet up!`;
    } else if (item.daysUntilDue === 1) {
        reminderMsg = `Hey ${item.ownerName}! 👋 Just a reminder that the premium listing fee for "${item.title}" is due tomorrow. 💰 $${item.amount.toLocaleString()}/week. Let me know when you're available!`;
    } else if (item.daysUntilDue === 0) {
        reminderMsg = `Hey ${item.ownerName}! 👋 Just a reminder that the premium listing fee for "${item.title}" is due today. 💰 $${item.amount.toLocaleString()}/week. Let me know when you're available!`;
    } else if (item.daysUntilDue < 0) {
        const daysOverdue = Math.abs(item.daysUntilDue);
        reminderMsg = `Hey ${item.ownerName}, the premium listing fee for "${item.title}" was due ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} ago. 💰 $${item.amount.toLocaleString()}/week. Please let me know when we can meet up to sort this out!`;
        dueDisplay = `${daysOverdue}d OVERDUE!`;
    }
    
    const escapedReminder = reminderMsg.replace(/'/g, "\\'").replace(/"/g, '\\"');
    const itemId = `premium-${item.propertyId}`;
    
    return `
        <div id="${itemId}" data-email="${item.ownerEmail}" class="bg-gray-800/50 rounded-lg border border-gray-700 border-l-4 ${borderColors[urgency] || 'border-l-gray-500'} p-3 flex items-center justify-between gap-3 hover:bg-gray-700/50 transition cursor-pointer">
            <div class="flex-1 min-w-0">
                <div class="text-white font-medium truncate flex items-center gap-2">
                    <span class="text-amber-400">👑</span>
                    ${item.title}
                </div>
                <div class="text-gray-400 text-sm">Owner: ${item.ownerName}</div>
                <div class="${statusColors[urgency] || 'text-gray-400'} text-xs">Due: ${dueDisplay}</div>
            </div>
            <div class="text-right">
                <div class="text-amber-400 font-bold">$${item.amount.toLocaleString()}/wk</div>
                <button onclick="event.stopPropagation(); copySubscriptionReminder('${escapedReminder}')" 
                        class="text-cyan-400 hover:text-cyan-300 text-xs mt-1 flex items-center gap-1"
                        style="outline: none;">
                    📋 Copy Reminder
                </button>
            </div>
        </div>
    `;
}

window.togglePremiumPanel = function() {
    const content = $('premiumPanelContent');
    const arrow = $('premiumPanelArrow');
    if (content && arrow) {
        content.classList.toggle('hidden');
        arrow.classList.toggle('rotate-180');
    }
};

window.handlePremiumPanelClick = function(event) {
    // Check if clicked on the header area (gradient background)
    const header = event.target.closest('.bg-gradient-to-r');
    if (header) {
        togglePremiumPanel();
        return;
    }
    
    // Check if clicked on copy button
    if (event.target.closest('button') && event.target.textContent.includes('Copy')) {
        return;
    }
    
    // Check if clicked on a premium item row (has id starting with premium-)
    const premiumItem = event.target.closest('[id^="premium-"]');
    if (premiumItem) {
        const email = premiumItem.dataset.email;
        if (email) {
            goToAdminUserByEmail(email);
        }
    }
};

// ============================================================
// PASSWORD RESET FUNCTIONS
// ============================================================

/**
 * Open the reset password modal for a user
 */
window.openResetPasswordModal = function(email, displayName) {
    // Remove any existing modal
    const existingModal = document.getElementById('resetPasswordModal');
    if (existingModal) existingModal.remove();
    
    const modalHTML = `
        <div id="resetPasswordModal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div class="bg-gray-900 rounded-2xl shadow-2xl border border-blue-500/50 max-w-md w-full p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-bold text-white flex items-center gap-2">
                        <span>🔑</span> Reset Password
                    </h3>
                    <button onclick="closeResetPasswordModal()" class="text-gray-400 hover:text-white text-xl">&times;</button>
                </div>
                
                <div class="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4 mb-4">
                    <p class="text-blue-300 text-sm">
                        <strong>User:</strong> ${displayName}<br>
                        <strong>Email:</strong> ${email}
                    </p>
                </div>
                
                <div class="mb-4">
                    <label class="block text-gray-400 text-sm mb-2">New Temporary Password:</label>
                    <div class="flex gap-2">
                        <input type="text" id="newPasswordInput" 
                               class="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                               placeholder="Enter new password (min 6 chars)"
                               minlength="6">
                        <button onclick="generateRandomPassword()" 
                                class="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg font-bold text-sm transition" 
                                title="Generate random password">
                            🎲
                        </button>
                    </div>
                    <p class="text-gray-500 text-xs mt-2">Give this password to the user so they can log in.</p>
                </div>
                
                <div class="bg-amber-900/30 border border-amber-500/30 rounded-xl p-3 mb-4">
                    <p class="text-amber-300 text-xs">
                        ⚠️ <strong>Note:</strong> This action will be logged for security audit. The user should change their password after logging in.
                    </p>
                </div>
                
                <div class="flex gap-3">
                    <button id="resetPasswordBtn" onclick="confirmResetPassword('${email.replace(/'/g, "\\'")}')" 
                            class="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-bold hover:opacity-90 transition">
                        🔑 Set Password
                    </button>
                    <button onclick="closeResetPasswordModal()" 
                            class="flex-1 bg-gray-700 text-white py-3 rounded-xl font-bold hover:bg-gray-600 transition">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Focus the input
    setTimeout(() => {
        const input = document.getElementById('newPasswordInput');
        if (input) input.focus();
    }, 100);
};

/**
 * Close the reset password modal
 */
window.closeResetPasswordModal = function() {
    const modal = document.getElementById('resetPasswordModal');
    if (modal) modal.remove();
};

/**
 * Generate a random password
 */
window.generateRandomPassword = function() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const input = document.getElementById('newPasswordInput');
    if (input) {
        input.value = password;
        input.select();
    }
};

/**
 * Confirm and execute password reset
 */
window.confirmResetPassword = async function(email) {
    const input = document.getElementById('newPasswordInput');
    const newPassword = input?.value?.trim();
    
    if (!newPassword) {
        showToast('Please enter a password', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    const btn = document.getElementById('resetPasswordBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="animate-pulse">⏳ Setting password...</span>';
    }
    
    try {
        // Call the Cloud Function
        const adminSetUserPassword = firebase.functions().httpsCallable('adminSetUserPassword');
        const result = await adminSetUserPassword({
            targetEmail: email,
            newPassword: newPassword
        });
        
        if (result.data.success) {
            showToast(`✅ Password set successfully! Tell the user: "${newPassword}"`, 'success', 8000);
            
            // Copy password to clipboard
            try {
                await navigator.clipboard.writeText(newPassword);
                showToast('📋 Password copied to clipboard!', 'success');
            } catch (e) {
                // Clipboard failed, that's okay - they can see it in the toast
            }
            
            closeResetPasswordModal();
        } else {
            throw new Error(result.data.message || 'Failed to set password');
        }
        
    } catch (error) {
        console.error('[Password Reset] Error:', error);
        showToast('❌ ' + (error.message || 'Failed to reset password'), 'error');
        
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '🔑 Set Password';
        }
    }
};

/**
 * ADMIN UTILITY: Bulk sync owner contact info AND display names to all properties
 * This fixes properties that were created before ownerContactPhone/ownerDisplayName syncing was implemented.
 * Run from browser console: await adminBulkSyncOwnerContacts()
 */
window.adminBulkSyncOwnerContacts = async function() {
    if (!auth.currentUser || !TierService.isMasterAdmin(auth.currentUser.email)) {
        console.error('[BulkSync] Admin access required');
        return { success: false, error: 'Admin access required' };
    }
    
    console.log('[BulkSync] Starting bulk sync of owner contact info AND display names to properties...');
    
    // Helper function to resolve display name (matches data.js logic)
    function resolveDisplayName(userData, email) {
        if (userData.displayName && userData.displayName.includes(' ')) {
            return userData.displayName;
        }
        if (userData.firstName && userData.lastName) {
            return userData.firstName + ' ' + userData.lastName;
        }
        if (userData.firstName) {
            return userData.firstName;
        }
        if (userData.displayName) {
            return userData.displayName;
        }
        if (userData.username && userData.username.includes(' ')) {
            return userData.username;
        }
        if (userData.username) {
            return userData.username;
        }
        return email ? email.split('@')[0] : 'Unknown';
    }
    
    try {
        // Get all users
        const usersSnapshot = await db.collection('users').get();
        const userInfo = {};
        
        usersSnapshot.docs.forEach(doc => {
            const userData = doc.data();
            if (userData.email) {
                const email = userData.email.toLowerCase();
                userInfo[email] = {
                    phone: userData.phone ? userData.phone.replace(/\D/g, '') : null,
                    displayName: resolveDisplayName(userData, email)
                };
            }
        });
        
        console.log(`[BulkSync] Found ${Object.keys(userInfo).length} users`);
        
        // Get all properties
        const propsDoc = await db.collection('settings').doc('properties').get();
        if (!propsDoc.exists) {
            console.error('[BulkSync] No properties document found');
            return { success: false, error: 'No properties found' };
        }
        
        const allProperties = propsDoc.data();
        const updates = {};
        let updatedCount = 0;
        let skippedCount = 0;
        let noUserCount = 0;
        
        Object.keys(allProperties).forEach(propId => {
            const prop = allProperties[propId];
            if (!prop || !prop.ownerEmail) {
                skippedCount++;
                return;
            }
            
            const ownerEmail = prop.ownerEmail.toLowerCase();
            const ownerData = userInfo[ownerEmail];
            
            if (ownerData) {
                let needsUpdate = false;
                const propUpdate = { ...prop };
                
                // Check if phone needs update
                if (ownerData.phone && (!prop.ownerContactPhone || prop.ownerContactPhone !== ownerData.phone)) {
                    propUpdate.ownerContactPhone = ownerData.phone;
                    needsUpdate = true;
                }
                
                // Check if display name needs update
                if (ownerData.displayName && (!prop.ownerDisplayName || prop.ownerDisplayName !== ownerData.displayName)) {
                    propUpdate.ownerDisplayName = ownerData.displayName;
                    needsUpdate = true;
                }
                
                if (needsUpdate) {
                    updates[propId] = propUpdate;
                    updatedCount++;
                    console.log(`[BulkSync] Will update property ${propId} (${prop.title || 'Unknown'}): displayName="${ownerData.displayName}", phone="${ownerData.phone || 'none'}"`);
                } else {
                    skippedCount++;
                }
            } else {
                noUserCount++;
                console.warn(`[BulkSync] Owner ${ownerEmail} not found in users collection (property: ${prop.title || propId})`);
            }
        });
        
        if (Object.keys(updates).length > 0) {
            console.log(`[BulkSync] Applying ${updatedCount} updates to Firestore...`);
            await db.collection('settings').doc('properties').set(updates, { merge: true });
            console.log('[BulkSync] ✅ Firestore updated successfully');
            
            // Refresh PropertyDataService
            if (typeof PropertyDataService !== 'undefined' && PropertyDataService.refresh) {
                await PropertyDataService.refresh();
            }
        }
        
        const result = {
            success: true,
            updated: updatedCount,
            skipped: skippedCount,
            ownersNotFound: noUserCount
        };
        
        console.log('[BulkSync] ✅ Complete:', result);
        showToast(`✅ Synced ${updatedCount} properties with display names and contact info.`, 'success', 5000);
        
        return result;
        
    } catch (error) {
        console.error('[BulkSync] Error:', error);
        showToast('❌ Bulk sync failed: ' + error.message, 'error');
        return { success: false, error: error.message };
    }
};

/**
 * ADMIN UTILITY: Clear all admin notifications from Firestore
 * Use this to clean up stale notifications that keep appearing
 * Run from browser console: await adminClearNotifications()
 */
window.adminClearNotifications = async function(olderThanDays = 7) {
    if (!auth.currentUser || !TierService.isMasterAdmin(auth.currentUser.email)) {
        console.error('[ClearNotifs] Admin access required');
        return { success: false, error: 'Admin access required' };
    }
    
    console.log(`[ClearNotifs] Clearing admin notifications older than ${olderThanDays} days...`);
    
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        
        const snapshot = await db.collection('adminNotifications').get();
        
        if (snapshot.empty) {
            console.log('[ClearNotifs] No notifications found');
            return { success: true, deleted: 0 };
        }
        
        let deletedCount = 0;
        let keptCount = 0;
        const batch = db.batch();
        
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
            
            if (createdAt < cutoffDate || data.dismissed) {
                batch.delete(doc.ref);
                deletedCount++;
                console.log(`[ClearNotifs] Will delete: ${doc.id} (${data.type || 'unknown'}, created: ${createdAt.toISOString()})`);
            } else {
                keptCount++;
            }
        });
        
        if (deletedCount > 0) {
            await batch.commit();
            console.log(`[ClearNotifs] ✅ Deleted ${deletedCount} notifications, kept ${keptCount}`);
        } else {
            console.log(`[ClearNotifs] No old notifications to delete, kept ${keptCount}`);
        }
        
        showToast(`✅ Cleared ${deletedCount} old notifications`, 'success');
        return { success: true, deleted: deletedCount, kept: keptCount };
        
    } catch (error) {
        console.error('[ClearNotifs] Error:', error);
        showToast('❌ Failed to clear notifications: ' + error.message, 'error');
        return { success: false, error: error.message };
    }
};

/**
 * ADMIN UTILITY: View all admin notifications in Firestore (for debugging)
 * Run from browser console: await adminViewNotifications()
 */
window.adminViewNotifications = async function() {
    if (!auth.currentUser || !TierService.isMasterAdmin(auth.currentUser.email)) {
        console.error('[ViewNotifs] Admin access required');
        return { success: false, error: 'Admin access required' };
    }
    
    try {
        const snapshot = await db.collection('adminNotifications').get();
        
        if (snapshot.empty) {
            console.log('[ViewNotifs] No notifications in adminNotifications collection');
            return { success: true, notifications: [] };
        }
        
        const notifications = [];
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            notifications.push({
                id: doc.id,
                type: data.type,
                userEmail: data.userEmail,
                displayName: data.displayName,
                dismissed: data.dismissed,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
            });
        });
        
        console.log('[ViewNotifs] Found notifications:', notifications);
        console.table(notifications);
        
        return { success: true, notifications };
        
    } catch (error) {
        console.error('[ViewNotifs] Error:', error);
        return { success: false, error: error.message };
    }
};
