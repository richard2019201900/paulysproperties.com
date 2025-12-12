// ==================== DOM ELEMENTS ====================
const $ = id => document.getElementById(id);

// ==================== UTILITY FUNCTIONS ====================
const sanitize = str => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

const formatPrice = amt => amt >= 1e6 ? `$${(amt/1e6).toFixed(1)}M` : amt >= 1e3 ? `$${(amt/1e3).toFixed(0)}k` : `$${amt.toLocaleString()}`;

const showElement = el => el?.classList.remove('hidden');
const hideElement = el => el?.classList.add('hidden');
const toggleClass = (el, cls, add) => el?.classList.toggle(cls, add);

// ==================== CLIPBOARD ====================
window.copyToClipboard = function(elementId, btn) {
    const el = $(elementId);
    const text = el.value || el.textContent;
    navigator.clipboard.writeText(text).then(() => {
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = orig, 2000);
    }).catch(() => {
        // Fallback for older browsers
        el.select?.();
        document.execCommand('copy');
    });
};

// ==================== MODAL FUNCTIONS ====================
window.openModal = function(id) {
    showElement($(id));
    
    // If opening login modal, clear all forms and show login options
    if (id === 'loginModal') {
        // Clear login form
        const ownerEmail = $('ownerEmail');
        const ownerPassword = $('ownerPassword');
        if (ownerEmail) ownerEmail.value = '';
        if (ownerPassword) ownerPassword.value = '';
        
        // Clear create account form
        const newAccountEmail = $('newAccountEmail');
        const newAccountPassword = $('newAccountPassword');
        const newAccountDisplayName = $('newAccountDisplayName');
        if (newAccountEmail) newAccountEmail.value = '';
        if (newAccountPassword) newAccountPassword.value = '';
        if (newAccountDisplayName) newAccountDisplayName.value = '';
        
        // Hide error messages
        hideElement($('loginError'));
        hideElement($('createAccountError'));
        
        // Reset button states
        const createBtn = $('createAccountBtn');
        if (createBtn) {
            createBtn.disabled = false;
            createBtn.textContent = '🌱 Create Starter Account';
        }
        const loginBtn = $('loginSubmitBtn');
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
        }
        
        // Reset to show login options (not a specific form)
        showElement($('loginOptions'));
        hideElement($('ownerLoginForm'));
        hideElement($('createAccountForm'));
    }
};
window.closeModal = function(id) {
    hideElement($(id));
    
    // If closing login modal, clear all forms and reset buttons
    if (id === 'loginModal') {
        const ownerEmail = $('ownerEmail');
        const ownerPassword = $('ownerPassword');
        const newAccountEmail = $('newAccountEmail');
        const newAccountPassword = $('newAccountPassword');
        const newAccountDisplayName = $('newAccountDisplayName');
        if (ownerEmail) ownerEmail.value = '';
        if (ownerPassword) ownerPassword.value = '';
        if (newAccountEmail) newAccountEmail.value = '';
        if (newAccountPassword) newAccountPassword.value = '';
        if (newAccountDisplayName) newAccountDisplayName.value = '';
        
        // Reset button states
        const createBtn = $('createAccountBtn');
        if (createBtn) {
            createBtn.disabled = false;
            createBtn.textContent = '🌱 Create Starter Account';
        }
        const loginBtn = $('loginSubmitBtn');
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
        }
    }
};

window.openContactModal = async function(type, propertyTitle, propertyId) {
    const isRent = type === 'rent';
    const colors = isRent ? ['purple', 'blue'] : ['amber', 'orange'];
    const defaultPhone = '2057028233';
    
    $('modalTitle').textContent = isRent ? 'Rent This Property' : 'Make an Offer to Purchase';
    $('modalTitle').className = `text-3xl font-black bg-gradient-to-r from-${colors[0]}-500 to-${colors[1]}-600 bg-clip-text text-transparent mb-4 text-center`;
    $('modalPropertyName').textContent = (isRent ? 'Rent: ' : 'Purchase: ') + propertyTitle;
    $('modalMessage').value = isRent 
        ? `Hi! I'm interested in renting ${propertyTitle}. Please contact me ASAP to discuss availability and next steps.`
        : `Hi! I'm interested in making an offer on ${propertyTitle}. Please contact me ASAP to discuss further.`;
    
    const accent = $('modalAccent');
    accent.className = `bg-gradient-to-r from-${colors[0]}-900 to-${colors[1]}-900 p-4 rounded-xl mb-6 text-center border border-${colors[0]}-700`;
    
    // Show appropriate disclaimer
    const disclaimer = $('modalDisclaimer');
    if (disclaimer) {
        if (isRent) {
            disclaimer.innerHTML = `
                <div class="text-xs text-gray-400 mt-2">
                    <strong>📋 Note:</strong> All communications, property viewings, and transactions are conducted in-city. 
                    This website serves as a listing platform only.
                </div>
            `;
        } else {
            disclaimer.innerHTML = `
                <div class="text-xs text-gray-400 mt-2 space-y-1">
                    <div><strong>📋 Note:</strong> All communications, property viewings, and transactions are conducted in-city. This website serves as a listing platform only.</div>
                    <div><strong>💰 City Fee:</strong> A standard <span class="text-amber-400 font-bold">10% PMA Realtor Fee</span> (city requirement) applies to all property purchases. This fee is not charged by PaulysProperties.com.</div>
                </div>
            `;
        }
    }
    
    // Reset to default phone first
    $('modalPhone').value = defaultPhone;
    
    // Load owner's phone number if property ID is provided
    if (propertyId) {
        try {
            const ownerEmail = getPropertyOwnerEmail(propertyId);
            if (ownerEmail) {
                const usersSnapshot = await db.collection('users').where('email', '==', ownerEmail).get();
                if (!usersSnapshot.empty) {
                    const userData = usersSnapshot.docs[0].data();
                    if (userData.phone) {
                        // Sanitize phone - remove all non-digits
                        $('modalPhone').value = userData.phone.replace(/\D/g, '');
                    }
                }
            }
        } catch (error) {
            console.error('Error loading owner phone:', error);
        }
    }
    
    openModal('contactModal');
};

window.openRegisterContactModal = function() {
    closeModal('loginModal');
    
    const defaultPhone = '2057028233';
    
    $('modalTitle').textContent = 'Request New Account';
    $('modalTitle').className = 'text-3xl font-black bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent mb-4 text-center';
    $('modalPropertyName').innerHTML = `
        <label class="block text-gray-300 font-bold mb-2 text-left text-base">Account Type:</label>
        <select id="accountTypeSelect" onchange="updateRegisterMessage()" class="w-full px-4 py-3 border-2 border-gray-600 rounded-xl bg-gray-700 text-white focus:ring-2 focus:ring-cyan-500 font-medium transition">
            <option value="Property Owner">Property Owner</option>
            <option value="Property Renter">Property Renter</option>
        </select>
    `;
    $('modalMessage').value = "Hi! I'm interested in creating a new account as a Property Owner. Please contact me to get started. Thank you!";
    $('modalPhone').value = defaultPhone;
    
    // Clear disclaimer for registration
    const disclaimer = $('modalDisclaimer');
    if (disclaimer) disclaimer.innerHTML = '';
    
    const accent = $('modalAccent');
    accent.className = 'bg-gradient-to-r from-cyan-900 to-blue-900 p-4 rounded-xl mb-6 text-center border border-cyan-700';
    
    openModal('contactModal');
};

// ==================== PHOTO SERVICES ====================
window.openPhotoServicesModal = function() {
    openModal('photoServicesModal');
    // Update opt-in content based on login status
    updateManagedServicesOptIn();
    // Reset the copy button state
    const btn = $('photoServicesCopyBtn');
    if (btn) {
        btn.innerHTML = '<span>📱</span> Copy & Notify: 2057028233';
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
};

// Collapse photo promo bar (desktop) - shows minimal tab
window.collapsePhotoPromoBar = function() {
    const expanded = $('photoPromoExpanded');
    const collapsed = $('photoPromoCollapsed');
    if (expanded && collapsed) {
        expanded.classList.add('hidden');
        collapsed.classList.remove('hidden');
        sessionStorage.setItem('photoPromoBarCollapsed', 'true');
    }
};

// Expand photo promo bar (desktop)
window.expandPhotoPromoBar = function() {
    const expanded = $('photoPromoExpanded');
    const collapsed = $('photoPromoCollapsed');
    if (expanded && collapsed) {
        expanded.classList.remove('hidden');
        collapsed.classList.add('hidden');
        sessionStorage.removeItem('photoPromoBarCollapsed');
    }
};

// Collapse mobile photo promo bar
window.collapseMobilePhotoPromoBar = function() {
    const bar = $('mobilePhotoPromoBar');
    const collapsed = $('mobilePhotoPromoCollapsed');
    if (bar && collapsed) {
        bar.classList.add('hidden');
        collapsed.classList.remove('hidden');
        sessionStorage.setItem('mobilePhotoPromoBarCollapsed', 'true');
    }
};

// Expand mobile photo promo bar
window.expandMobilePhotoPromoBar = function() {
    const bar = $('mobilePhotoPromoBar');
    const collapsed = $('mobilePhotoPromoCollapsed');
    if (bar && collapsed) {
        bar.classList.remove('hidden');
        collapsed.classList.add('hidden');
        sessionStorage.removeItem('mobilePhotoPromoBarCollapsed');
    }
};

// Check if promo bars should be collapsed (on page load)
window.checkPhotoPromoBarState = function() {
    // Desktop
    if (sessionStorage.getItem('photoPromoBarCollapsed') === 'true') {
        const expanded = $('photoPromoExpanded');
        const collapsed = $('photoPromoCollapsed');
        if (expanded && collapsed) {
            expanded.classList.add('hidden');
            collapsed.classList.remove('hidden');
        }
    }
    // Mobile
    if (sessionStorage.getItem('mobilePhotoPromoBarCollapsed') === 'true') {
        const bar = $('mobilePhotoPromoBar');
        const collapsed = $('mobilePhotoPromoCollapsed');
        if (bar && collapsed) {
            bar.classList.add('hidden');
            collapsed.classList.remove('hidden');
        }
    }
};

// Call on page load
document.addEventListener('DOMContentLoaded', function() {
    checkPhotoPromoBarState();
});

window.updateManagedServicesOptIn = async function() {
    const container = $('optInContent');
    if (!container) return;
    
    const user = auth.currentUser;
    
    if (!user) {
        // Not logged in
        container.innerHTML = `
            <div class="text-center">
                <p class="text-gray-300 text-sm mb-3">🔒 Log in to get notified when managed services launch!</p>
                <button onclick="closeModal('photoServicesModal'); openModal('loginModal');" class="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition">
                    Log In to Opt-In
                </button>
            </div>
        `;
        return;
    }
    
    // Check if user is already opted in
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        const isOptedIn = userData?.managedServicesInterest === true;
        
        if (isOptedIn) {
            container.innerHTML = `
                <div class="text-center">
                    <div class="flex items-center justify-center gap-2 text-green-400 mb-2">
                        <span class="text-2xl">✅</span>
                        <span class="font-bold">You're on the list!</span>
                    </div>
                    <p class="text-gray-300 text-sm mb-3">We'll contact you when managed services launch.</p>
                    <button onclick="optOutManagedServices()" class="text-gray-400 hover:text-red-400 text-xs underline transition">
                        Remove me from the list
                    </button>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="text-center">
                    <p class="text-gray-300 text-sm mb-3">🔔 Want to be notified when this launches?</p>
                    <button onclick="optInManagedServices()" class="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white px-6 py-3 rounded-lg font-bold transition shadow-lg flex items-center gap-2 mx-auto">
                        <span>🚀</span> Yes, I'm Interested!
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error checking opt-in status:', error);
        container.innerHTML = `<p class="text-gray-400 text-sm text-center">Error loading status</p>`;
    }
};

window.optInManagedServices = async function() {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        await db.collection('users').doc(user.uid).update({
            managedServicesInterest: true,
            managedServicesOptInDate: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('🚀 You\'re on the list! We\'ll notify you when managed services launch.', 'success');
        updateManagedServicesOptIn();
        
        // Log to activity
        if (typeof logAdminActivity === 'function') {
            logAdminActivity('managed_services_optin', {
                email: user.email,
                username: user.displayName || user.email?.split('@')[0]
            });
        }
    } catch (error) {
        console.error('Error opting in:', error);
        showToast('Error saving preference. Please try again.', 'error');
    }
};

window.optOutManagedServices = async function() {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        await db.collection('users').doc(user.uid).update({
            managedServicesInterest: false,
            managedServicesOptOutDate: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('You\'ve been removed from the list.', 'info');
        updateManagedServicesOptIn();
    } catch (error) {
        console.error('Error opting out:', error);
        showToast('Error saving preference. Please try again.', 'error');
    }
};

window.copyAndNotifyPhotoServices = async function() {
    const user = auth.currentUser;
    const btn = $('photoServicesCopyBtn');
    
    // Copy phone number to clipboard
    try {
        await navigator.clipboard.writeText('2057028233');
    } catch (e) {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = '2057028233';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
    
    // Create notification for admin
    try {
        const userEmail = user?.email || 'Anonymous Visitor';
        const username = user?.displayName || user?.email?.split('@')[0] || 'Anonymous';
        
        // Save to Firestore photoServiceRequests collection
        await db.collection('photoServiceRequests').add({
            userEmail: userEmail,
            username: username,
            userId: user?.uid || null,
            requestedAt: firebase.firestore.FieldValue.serverTimestamp(),
            type: 'photo_inquiry',
            status: 'pending',
            viewed: false
        });
        
        console.log('[PhotoServices] Request notification created for:', userEmail);
        
        // Update button to show success
        if (btn) {
            btn.innerHTML = '<span>✅</span> Copied! Team Notified';
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
        }
        
        showToast('📸 Phone copied! Our team has been notified of your interest.', 'success');
        
    } catch (error) {
        console.error('[PhotoServices] Error creating notification:', error);
        // Still show success for copy even if notification failed
        showToast('📱 Phone number copied!', 'success');
        if (btn) {
            btn.innerHTML = '<span>✅</span> Copied!';
        }
    }
};

// Legacy function for backwards compatibility
window.copyPhotoServicePhone = function() {
    copyAndNotifyPhotoServices();
};

window.updateRegisterMessage = function() {
    const accountType = $('accountTypeSelect')?.value || 'Property Owner';
    $('modalMessage').value = `Hi! I'm interested in creating a new account as a ${accountType}. Please contact me to get started. Thank you!`;
};

// ==================== LIGHTBOX ====================
window.openLightbox = function(images, index) {
    state.currentImages = images;
    state.currentImageIndex = index;
    $('lightboxImage').src = images[index];
    $('lightbox').classList.add('active');
    document.body.style.overflow = 'hidden';
};

window.closeLightbox = function() {
    $('lightbox').classList.remove('active');
    document.body.style.overflow = '';
};

window.changeImage = function(dir) {
    const len = state.currentImages.length;
    state.currentImageIndex = (state.currentImageIndex + dir + len) % len;
    $('lightboxImage').src = state.currentImages[state.currentImageIndex];
};

// Keyboard navigation for lightbox
document.addEventListener('keydown', e => {
    if (!$('lightbox').classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') changeImage(1);
    if (e.key === 'ArrowLeft') changeImage(-1);
});

// ==================== EDITABLE STAT TILE COMPONENT ====================
/**
 * Creates an interactive, editable stat tile
 * Features:
 * - Click to edit inline
 * - Optimistic UI with rollback on failure
 * - Real-time sync to Firestore
 * - Visual feedback for saving/success/error states
 */
const EditableStatTile = {
    /**
     * Render a stat tile
     * @param {Object} config - Tile configuration
     */
    render(config) {
        const { id, propertyId, field, label, value, icon, gradient, prefix = '', suffix = '', type = 'number' } = config;
        
        return `
            <div id="tile-${id}" 
                 class="stat-tile bg-gradient-to-br ${gradient} rounded-2xl shadow-xl p-6 text-white border cursor-pointer"
                 onclick="EditableStatTile.startEdit('${id}', ${propertyId}, '${field}', '${type}')"
                 data-property-id="${propertyId}"
                 data-field="${field}"
                 data-original-value="${value}">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-bold opacity-90">${label}</h3>
                    ${icon}
                    <span class="sync-indicator synced" id="sync-${id}">
                        <span class="dot"></span>
                        <span>Synced</span>
                    </span>
                </div>
                <div id="value-${id}" class="text-3xl font-black">
                    ${prefix}${typeof value === 'number' ? value.toLocaleString() : value}${suffix}
                </div>
                <p class="text-sm opacity-60 mt-2">Click to edit</p>
            </div>
        `;
    },
    
    /**
     * Start editing a tile
     */
    async startEdit(tileId, propertyId, field, type) {
        const tile = $(`tile-${tileId}`);
        const valueEl = $(`value-${tileId}`);
        
        if (tile.classList.contains('editing')) return;
        
        // Get current value from Firestore (fresh read)
        const currentValue = PropertyDataService.getValue(propertyId, field, tile.dataset.originalValue);
        
        tile.classList.add('editing');
        
        const inputType = type === 'number' ? 'number' : 'text';
        const rawValue = typeof currentValue === 'number' ? currentValue : currentValue.replace(/[$,]/g, '');
        
        valueEl.innerHTML = `
            <input type="${inputType}" 
                   id="input-${tileId}"
                   class="stat-input text-2xl"
                   value="${rawValue}"
                   onkeydown="EditableStatTile.handleKeydown(event, '${tileId}', ${propertyId}, '${field}', '${type}')"
                   onblur="EditableStatTile.cancelEdit('${tileId}', ${propertyId}, '${field}')">
            <div class="flex gap-2 mt-3">
                <button onclick="event.stopPropagation(); EditableStatTile.saveEdit('${tileId}', ${propertyId}, '${field}', '${type}')" 
                        class="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg font-bold text-sm transition">
                    Save
                </button>
                <button onclick="event.stopPropagation(); EditableStatTile.cancelEdit('${tileId}', ${propertyId}, '${field}')" 
                        class="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded-lg font-bold text-sm transition">
                    Cancel
                </button>
            </div>
        `;
        
        const input = $(`input-${tileId}`);
        input.focus();
        input.select();
        
        // Prevent tile click from interfering
        input.onclick = (e) => e.stopPropagation();
    },
    
    /**
     * Handle keyboard events in edit mode
     */
    handleKeydown(event, tileId, propertyId, field, type) {
        event.stopPropagation();
        if (event.key === 'Enter') {
            this.saveEdit(tileId, propertyId, field, type);
        } else if (event.key === 'Escape') {
            this.cancelEdit(tileId, propertyId, field);
        }
    },
    
    /**
     * Save the edited value
     * Implements optimistic UI with automatic rollback on failure
     */
    async saveEdit(tileId, propertyId, field, type) {
        const tile = $(`tile-${tileId}`);
        const valueEl = $(`value-${tileId}`);
        const input = $(`input-${tileId}`);
        const syncIndicator = $(`sync-${tileId}`);
        
        if (!input) return;
        
        const newValue = type === 'number' ? parseInt(input.value, 10) : input.value;
        const originalValue = tile.dataset.originalValue;
        
        // Validation
        if (type === 'number' && (isNaN(newValue) || newValue < 0)) {
            tile.classList.add('error');
            setTimeout(() => tile.classList.remove('error'), 500);
            return;
        }
        
        // Optimistic UI update
        tile.classList.remove('editing');
        tile.classList.add('saving');
        syncIndicator.className = 'sync-indicator syncing';
        syncIndicator.innerHTML = '<span class="dot"></span><span>Saving...</span>';
        
        const displayValue = type === 'number' 
            ? `${newValue.toLocaleString()}`
            : newValue;
        valueEl.innerHTML = displayValue;
        
        try {
            // Write to Firestore (includes fresh read before write)
            await PropertyDataService.write(propertyId, field, newValue);
            
            // Success feedback
            tile.classList.remove('saving');
            tile.classList.add('success');
            syncIndicator.className = 'sync-indicator synced';
            syncIndicator.innerHTML = '<span class="dot"></span><span>Saved!</span>';
            tile.dataset.originalValue = newValue;
            
            setTimeout(() => {
                tile.classList.remove('success');
                syncIndicator.innerHTML = '<span class="dot"></span><span>Synced</span>';
            }, 2000);
            
        } catch (error) {
            // Rollback on failure
            console.error('Save failed, rolling back:', error);
            tile.classList.remove('saving');
            tile.classList.add('error');
            syncIndicator.className = 'sync-indicator error';
            syncIndicator.innerHTML = '<span class="dot"></span><span>Error!</span>';
            
            // Restore original value
            const rollbackValue = type === 'number'
                ? `${parseInt(originalValue).toLocaleString()}`
                : originalValue;
            valueEl.innerHTML = rollbackValue;
            
            setTimeout(() => {
                tile.classList.remove('error');
                syncIndicator.className = 'sync-indicator synced';
                syncIndicator.innerHTML = '<span class="dot"></span><span>Synced</span>';
            }, 3000);
        }
    },
    
    /**
     * Cancel editing and restore original value
     */
    cancelEdit(tileId, propertyId, field) {
        const tile = $(`tile-${tileId}`);
        const valueEl = $(`value-${tileId}`);
        
        if (!tile.classList.contains('editing')) return;
        
        tile.classList.remove('editing');
        
        const originalValue = PropertyDataService.getValue(propertyId, field, tile.dataset.originalValue);
        const displayValue = typeof originalValue === 'number'
            ? `${originalValue.toLocaleString()}`
            : originalValue;
            
        valueEl.innerHTML = displayValue;
    }
};

// Make EditableStatTile globally accessible
window.EditableStatTile = EditableStatTile;

// ==================== REVIEWS ====================
function loadReviews() {
    try {
        state.reviews = JSON.parse(localStorage.getItem('propertyReviews') || '{}');
    } catch {
        state.reviews = {};
    }
}

function displayReviews(id) {
    const reviews = state.reviews[id] || [];
    $('reviewsDisplay').innerHTML = reviews.length 
        ? reviews.map(r => `
            <div class="review-card p-5 md:p-6 rounded-xl shadow-md">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h5 class="font-bold text-white text-lg">${sanitize(r.name)}</h5>
                        <div class="text-yellow-400 text-lg md:text-xl">${'*'.repeat(r.rating)}</div>
                    </div>
                    <div class="text-sm text-gray-400 font-medium">${sanitize(r.date)}</div>
                </div>
                <p class="text-gray-300 font-medium">${sanitize(r.text)}</p>
            </div>
        `).join('')
        : '<p class="text-gray-500 text-center font-semibold">No reviews yet. Be the first to leave a review!</p>';
}
