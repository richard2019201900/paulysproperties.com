// ==================== NAVIGATION ====================
function updateAuthButton(isLoggedIn) {
    const navBtn = $('navAuthBtn');
    const mobileBtn = $('mobileAuthBtn');
    const navCreateBtn = $('navCreateListingBtn');
    const mobileCreateBtn = $('mobileCreateListingBtn');
    const navUserDisplay = $('navUserDisplay');
    
    if (isLoggedIn) {
        navBtn.textContent = 'Logout';
        navBtn.className = 'hidden md:block bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-xl hover:opacity-90 transition font-semibold shadow-lg text-sm lg:text-base';
        mobileBtn.textContent = 'Logout';
        mobileBtn.className = 'block w-full text-left px-4 py-3 text-red-400 hover:bg-gray-800 font-semibold';
        showElement($('navDashboardLink'));
        showElement($('mobileDashboardLink'));
        // Show Create Listing buttons
        if (navCreateBtn) navCreateBtn.className = 'hidden md:block bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 px-3 lg:px-5 py-2 lg:py-2.5 rounded-xl hover:opacity-90 transition font-bold shadow-lg text-xs lg:text-sm';
        if (mobileCreateBtn) mobileCreateBtn.className = 'block px-4 py-3 text-amber-400 hover:bg-gray-800 cursor-pointer font-semibold';
        // Show user display
        if (navUserDisplay) {
            navUserDisplay.className = 'hidden md:flex items-center gap-2';
            updateNavUserDisplay();
        }
        // Show "My Properties" filter
        const myPropertiesFilter = $('myPropertiesFilter');
        if (myPropertiesFilter) myPropertiesFilter.className = 'flex items-center gap-2 text-gray-300 font-semibold cursor-pointer text-sm md:text-base hover:text-white transition';
    } else {
        navBtn.textContent = 'Register / Sign In';
        navBtn.className = 'hidden md:block gradient-bg text-white px-4 lg:px-6 py-2 lg:py-3 rounded-xl hover:opacity-90 transition font-semibold shadow-lg text-sm lg:text-base';
        mobileBtn.textContent = 'Register / Sign In';
        mobileBtn.className = 'block w-full text-left px-4 py-3 text-purple-400 hover:bg-gray-800 font-semibold';
        hideElement($('navDashboardLink'));
        hideElement($('mobileDashboardLink'));
        // Hide Create Listing buttons completely (set className to hidden only, no md:block)
        if (navCreateBtn) navCreateBtn.className = 'hidden';
        if (mobileCreateBtn) mobileCreateBtn.className = 'hidden';
        // Hide user display
        if (navUserDisplay) navUserDisplay.className = 'hidden';
        // Hide "My Properties" filter and uncheck it
        const myPropertiesFilter = $('myPropertiesFilter');
        const showMyProperties = $('showMyProperties');
        if (myPropertiesFilter) myPropertiesFilter.className = 'hidden';
        if (showMyProperties) showMyProperties.checked = false;
    }
}

// Update the nav bar user display
async function updateNavUserDisplay() {
    const user = auth.currentUser;
    if (!user) return;
    
    const navUserName = $('navUserName');
    const navUserTier = $('navUserTier');
    
    if (!navUserName || !navUserTier) return;
    
    try {
        const doc = await db.collection('users').doc(user.uid).get();
        const data = doc.data() || {};
        const username = data.username || user.email.split('@')[0];
        
        // Check if master admin
        if (TierService.isMasterAdmin(user.email)) {
            navUserName.textContent = username;
            navUserTier.innerHTML = '👑 Owner';
            navUserTier.className = 'text-xs text-red-400';
        } else {
            const tier = data.tier || 'starter';
            const tierData = TIERS[tier] || TIERS.starter;
            
            navUserName.textContent = username;
            navUserTier.innerHTML = `${tierData.icon} ${tierData.name}`;
            navUserTier.className = `text-xs ${tierData.color}`;
        }
    } catch (error) {
        console.error('Error updating nav user display:', error);
        navUserName.textContent = user.email.split('@')[0];
        navUserTier.textContent = '🌱 Starter';
    }
}

window.updateNavUserDisplay = updateNavUserDisplay;

window.handleAuthClick = function() {
    hideElement($('mobileMenu'));
    state.currentUser === 'owner' ? logout() : openModal('loginModal');
};

window.showCreateAccountForm = function() {
    hideElement($('loginOptions'));
    hideElement($('ownerLoginForm'));
    showElement($('createAccountForm'));
    hideElement($('createAccountError'));
};

window.showLoginForm = function() {
    hideElement($('loginOptions'));
    hideElement($('createAccountForm'));
    showElement($('ownerLoginForm'));
    hideElement($('loginError'));
};

window.hideCreateAccountForm = function() {
    hideElement($('createAccountForm'));
    showElement($('loginOptions'));
};

// Handle create account form submission
document.addEventListener('DOMContentLoaded', function() {
    const createForm = $('createAccountFormEl');
    if (createForm) {
        createForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = $('newAccountEmail').value.trim().toLowerCase();
            const email = username + '@pma.network'; // Append domain
            const password = $('newAccountPassword').value;
            const displayName = $('newAccountDisplayName').value.trim();
            const errorDiv = $('createAccountError');
            const btn = $('createAccountBtn');
            
            hideElement(errorDiv);
            
            // Validate username format
            if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
                errorDiv.textContent = 'Username can only contain letters, numbers, dots and underscores.';
                showElement(errorDiv);
                return;
            }
            
            if (username.length < 3) {
                errorDiv.textContent = 'Username must be at least 3 characters.';
                showElement(errorDiv);
                return;
            }
            
            if (password.length < 6) {
                errorDiv.textContent = 'Password must be at least 6 characters.';
                showElement(errorDiv);
                return;
            }
            
            btn.disabled = true;
            btn.textContent = 'Creating Account...';
            
            try {
                // Create the user with Firebase Auth
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                console.log('[Auth] Account created:', user.email);
                
                // Create user document with starter tier and display name
                await db.collection('users').doc(user.uid).set({
                    email: user.email.toLowerCase(),
                    username: displayName,
                    tier: 'starter',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                console.log('[Auth] User document created with starter tier');
                
                // Show success with credentials reminder
                errorDiv.className = 'text-green-400 text-sm font-medium text-center p-3 bg-green-900/30 rounded-xl';
                errorDiv.innerHTML = `✓ Account created!<br><strong>Save these credentials:</strong><br>Username: ${username}@pma.network<br>Password: (what you entered)`;
                showElement(errorDiv);
                
                // Close modal after delay
                setTimeout(() => {
                    closeModal('loginModal');
                    errorDiv.className = 'hidden text-red-400 text-sm font-medium text-center p-3 bg-red-900/30 rounded-xl';
                }, 3000);
                
            } catch (error) {
                console.error('[Auth] Create account error:', error);
                
                let errorMessage = 'Failed to create account. Please try again.';
                if (error.code === 'auth/email-already-in-use') {
                    errorMessage = 'This username is already registered. Try signing in instead, or use a different username.';
                    // Add a sign-in link
                    errorDiv.innerHTML = `${errorMessage}<br><button onclick="showLoginForm()" class="text-purple-400 underline mt-2">→ Sign In</button>`;
                    showElement(errorDiv);
                    btn.disabled = false;
                    btn.textContent = '🌱 Create Starter Account';
                    return;
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = 'Invalid username. Use only letters, numbers, dots and underscores.';
                } else if (error.code === 'auth/weak-password') {
                    errorMessage = 'Password must be at least 6 characters.';
                }
                
                errorDiv.textContent = errorMessage;
                showElement(errorDiv);
                btn.disabled = false;
                btn.textContent = '🌱 Create Starter Account';
            }
        });
    }
});

window.goToDashboard = function() {
    hideElement($('mobileMenu'));
    if (state.currentUser === 'owner') {
        hideElement($('renterSection'));
        hideElement($('propertyDetailPage'));
        hideElement($('propertyStatsPage'));
        showElement($('ownerDashboard'));
        renderOwnerDashboard();
        window.scrollTo(0, 0);
    }
};

window.backToDashboard = function() {
    hideElement($('propertyStatsPage'));
    showElement($('ownerDashboard'));
    window.scrollTo(0, 0);
};

window.goHome = function() {
    // Block navigation if profile is incomplete
    if (!canNavigateAway()) {
        showProfileCompletionOverlay();
        return;
    }
    hideElement($('ownerDashboard'));
    hideElement($('propertyDetailPage'));
    hideElement($('propertyStatsPage'));
    showElement($('renterSection'));
    window.scrollTo(0, 0);
};

window.navigateTo = function(section) {
    // Block navigation if profile is incomplete
    if (!canNavigateAway()) {
        showProfileCompletionOverlay();
        return;
    }
    hideElement($('mobileMenu'));
    hideElement($('ownerDashboard'));
    hideElement($('propertyDetailPage'));
    hideElement($('propertyStatsPage'));
    showElement($('renterSection'));
    setTimeout(() => $(section)?.scrollIntoView({ behavior: 'smooth' }), 100);
};

window.goBack = function() {
    hideElement($('propertyDetailPage'));
    showElement($('renterSection'));
    $('properties').scrollIntoView({ behavior: 'smooth' });
};

// ==================== PROPERTY NAVIGATION ====================
// Navigate between properties (prev/next)
window.navigateProperty = function(direction) {
    const currentId = state.currentPropertyId;
    if (!currentId) return;
    
    // Get the current list of visible/filtered properties
    const visibleProperties = getVisibleProperties();
    
    if (visibleProperties.length === 0) return;
    
    // Find current property index
    const currentIndex = visibleProperties.findIndex(p => p.id === currentId);
    if (currentIndex === -1) return;
    
    let newIndex;
    if (direction === 'prev') {
        newIndex = currentIndex > 0 ? currentIndex - 1 : visibleProperties.length - 1;
    } else {
        newIndex = currentIndex < visibleProperties.length - 1 ? currentIndex + 1 : 0;
    }
    
    const newProperty = visibleProperties[newIndex];
    if (newProperty) {
        // Navigate to the new property
        viewProperty(newProperty.id);
        // Scroll to top of page
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// Get list of currently visible properties (respecting filters)
window.getVisibleProperties = function() {
    // If we have filtered properties, use those, otherwise use all
    if (state.filteredProperties && state.filteredProperties.length > 0) {
        return state.filteredProperties;
    }
    return properties;
};

// Update the property navigation counter
window.updatePropertyNavCounter = function() {
    const counter = $('propertyNavCounter');
    const prevBtn = $('prevPropertyBtn');
    const nextBtn = $('nextPropertyBtn');
    
    if (!counter) return;
    
    const currentId = state.currentPropertyId;
    const visibleProperties = getVisibleProperties();
    const currentIndex = visibleProperties.findIndex(p => p.id === currentId);
    
    if (currentIndex !== -1 && visibleProperties.length > 0) {
        counter.textContent = `${currentIndex + 1} of ${visibleProperties.length}`;
        
        // Show/hide nav buttons based on property count
        if (prevBtn) prevBtn.style.display = visibleProperties.length > 1 ? 'block' : 'none';
        if (nextBtn) nextBtn.style.display = visibleProperties.length > 1 ? 'block' : 'none';
    } else {
        counter.textContent = '';
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
    }
};

// Keyboard navigation for properties
document.addEventListener('keydown', function(e) {
    const detailPage = $('propertyDetailPage');
    if (!detailPage || detailPage.classList.contains('hidden')) return;
    
    // Don't navigate if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    
    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateProperty('prev');
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateProperty('next');
    } else if (e.key === 'Escape') {
        e.preventDefault();
        goBack();
    }
});

// ==================== USERNAME FUNCTIONS ====================
window.loadUsername = async function() {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        const doc = await db.collection('users').doc(user.uid).get();
        if (doc.exists) {
            const data = doc.data();
            if (data.username) {
                $('ownerUsername').value = data.username;
                // Pre-populate cache for this user
                window.ownerUsernameCache = window.ownerUsernameCache || {};
                window.ownerUsernameCache[user.email.toLowerCase()] = data.username;
            }
            if (data.phone) {
                // Sanitize phone - remove all non-digits
                $('ownerPhone').value = data.phone.replace(/\D/g, '');
            }
            
            // Update tier badge
            const tier = data.tier || 'starter';
            updateTierBadge(tier, user.email);
            
            // Check profile completion (skip for master owner)
            if (!TierService.isMasterAdmin(user.email)) {
                checkProfileCompletion(data.username, data.phone);
            }
        } else {
            // New user with no document - show profile completion
            if (!TierService.isMasterAdmin(user.email)) {
                checkProfileCompletion(null, null);
            }
        }
    } catch (error) {
        console.error('Error loading user settings:', error);
    }
}

// ==================== PROFILE COMPLETION CHECK ====================
window.isProfileComplete = false;

window.checkProfileCompletion = function(username, phone) {
    const hasUsername = username && username.trim().length > 0;
    const hasPhone = phone && phone.replace(/\D/g, '').length > 0;
    
    window.isProfileComplete = hasUsername && hasPhone;
    
    // Update checkmarks in overlay
    const nameCheck = $('profileCheckName');
    const phoneCheck = $('profileCheckPhone');
    
    if (nameCheck) {
        if (hasUsername) {
            nameCheck.className = 'w-6 h-6 rounded-full border-2 border-green-500 bg-green-500 flex items-center justify-center text-xs';
            nameCheck.innerHTML = '<span class="text-white">✓</span>';
        } else {
            nameCheck.className = 'w-6 h-6 rounded-full border-2 border-gray-500 flex items-center justify-center text-xs';
            nameCheck.innerHTML = '<span class="text-gray-500">✗</span>';
        }
    }
    
    if (phoneCheck) {
        if (hasPhone) {
            phoneCheck.className = 'w-6 h-6 rounded-full border-2 border-green-500 bg-green-500 flex items-center justify-center text-xs';
            phoneCheck.innerHTML = '<span class="text-white">✓</span>';
        } else {
            phoneCheck.className = 'w-6 h-6 rounded-full border-2 border-gray-500 flex items-center justify-center text-xs';
            phoneCheck.innerHTML = '<span class="text-gray-500">✗</span>';
        }
    }
    
    if (!window.isProfileComplete) {
        showProfileCompletionOverlay();
    } else {
        hideProfileCompletionOverlay();
    }
}

window.showProfileCompletionOverlay = function() {
    let overlay = $('profileCompletionOverlay');
    if (overlay) {
        showElement(overlay);
    }
}

window.hideProfileCompletionOverlay = function() {
    let overlay = $('profileCompletionOverlay');
    if (overlay) {
        hideElement(overlay);
    }
}

window.scrollToProfileSettings = function() {
    hideProfileCompletionOverlay();
    
    // Navigate to dashboard first
    goToDashboard();
    
    // Wait for dashboard to render, then scroll and highlight
    setTimeout(() => {
        const profileSection = $('profileSettingsSection');
        if (profileSection) {
            profileSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Add gold border effect to draw attention
            profileSection.classList.add('ring-4', 'ring-yellow-500', 'ring-opacity-100');
            profileSection.style.boxShadow = '0 0 20px rgba(234, 179, 8, 0.5)';
            setTimeout(() => {
                profileSection.classList.remove('ring-4', 'ring-yellow-500', 'ring-opacity-100');
                profileSection.style.boxShadow = '';
            }, 5000);
        } else {
            // Fallback - scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, 300);
}

// Check if navigation should be blocked
window.canNavigateAway = function() {
    const user = auth.currentUser;
    if (!user) return true; // Not logged in, can navigate
    if (TierService.isMasterAdmin(user.email)) return true; // Owner can always navigate
    return window.isProfileComplete;
}


window.updateTierBadge = function(tier, email) {
    const isMasterAdmin = TierService.isMasterAdmin(email);
    const listingCount = (ownerPropertyMap[email.toLowerCase()] || []).length;
    
    const iconEl = $('tierIcon');
    const nameEl = $('tierName');
    const listingsEl = $('tierListings');
    const badgeEl = $('userTierBadge');
    const upgradeBtn = $('tierUpgradeBtn');
    const pendingBadge = $('tierPendingBadge');
    
    if (isMasterAdmin) {
        // Master admin gets special display
        if (iconEl) iconEl.textContent = '👑';
        if (nameEl) nameEl.textContent = 'Owner';
        if (listingsEl) listingsEl.textContent = `${listingCount}/∞ Listings`;
        if (upgradeBtn) hideElement(upgradeBtn);
        if (pendingBadge) hideElement(pendingBadge);
        
        if (badgeEl) {
            badgeEl.className = badgeEl.className.replace(/border-\w+-\d+/g, '');
            badgeEl.classList.add('border-red-600');
        }
    } else {
        const tierData = TIERS[tier] || TIERS.starter;
        const maxListings = tierData.maxListings === Infinity ? '∞' : tierData.maxListings;
        
        if (iconEl) iconEl.textContent = tierData.icon;
        if (nameEl) nameEl.textContent = tierData.name;
        if (listingsEl) listingsEl.textContent = `${listingCount}/${maxListings} Listings`;
        
        // Hide upgrade button if already at Elite (max tier)
        if (upgradeBtn) {
            if (tier === 'elite') {
                hideElement(upgradeBtn);
            } else {
                showElement(upgradeBtn);
            }
        }
        
        // Update badge background based on tier
        if (badgeEl) {
            badgeEl.className = badgeEl.className.replace(/border-\w+-\d+/g, '');
            if (tier === 'pro') {
                badgeEl.classList.add('border-yellow-600');
            } else if (tier === 'elite') {
                badgeEl.classList.add('border-purple-600');
            } else {
                badgeEl.classList.add('border-gray-600');
            }
        }
        
        // Check for pending upgrade request
        checkPendingUpgradeRequest(email);
    }
    
    // Show/hide admin section
    const adminSection = $('adminSection');
    if (adminSection) {
        if (isMasterAdmin) {
            showElement(adminSection);
            loadPendingUpgradeRequests();
            // Also check for subscription alerts after a delay (to allow user list to load)
            setTimeout(() => {
                if (window.adminUsersData) {
                    showSubscriptionAlert();
                }
            }, 2000);
        } else {
            hideElement(adminSection);
        }
    }
}

window.saveUsername = async function() {
    const user = auth.currentUser;
    if (!user) return;
    
    const username = $('ownerUsername').value.trim();
    const btn = $('saveUsernameBtn');
    const status = $('usernameStatus');
    
    if (!username) {
        status.textContent = 'Please enter a display name';
        status.className = 'text-yellow-400 text-sm mt-3';
        showElement(status);
        return;
    }
    
    btn.disabled = true;
    btn.textContent = 'Saving...';
    
    try {
        await db.collection('users').doc(user.uid).set({
            username: username,
            email: user.email,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        status.textContent = 'Display name saved successfully!';
        status.className = 'text-green-400 text-sm mt-3';
        showElement(status);
        
        // Update cache
        window.ownerUsernameCache = window.ownerUsernameCache || {};
        window.ownerUsernameCache[user.email.toLowerCase()] = username;
        
        // Update nav bar display
        updateNavUserDisplay();
        
        // Sync everywhere
        syncOwnerNameEverywhere(user.email, username);
        
        // Update admin user list if visible
        const adminCard = document.querySelector(`[data-userid]`);
        if (adminCard) {
            const inputField = document.querySelector(`[id^="adminName_"]`);
            if (inputField && inputField.closest('[data-email]')?.dataset.email === user.email) {
                inputField.value = username;
            }
        }
        
        // Re-check profile completion
        const phone = $('ownerPhone')?.value?.replace(/\D/g, '') || '';
        checkProfileCompletion(username, phone);
        
        setTimeout(() => hideElement(status), 3000);
    } catch (error) {
        console.error('Error saving username:', error);
        status.textContent = 'Error saving display name. Please try again.';
        status.className = 'text-red-400 text-sm mt-3';
        showElement(status);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Name';
    }
};

window.saveOwnerPhone = async function() {
    const user = auth.currentUser;
    if (!user) return;
    
    // Remove all non-digit characters from phone
    const phone = $('ownerPhone').value.replace(/\D/g, '');
    $('ownerPhone').value = phone; // Update the field to show cleaned number
    
    const btn = $('savePhoneBtn');
    const status = $('phoneStatus');
    
    if (!phone) {
        status.textContent = 'Please enter a phone number';
        status.className = 'text-yellow-400 text-sm mt-3';
        showElement(status);
        return;
    }
    
    btn.disabled = true;
    btn.textContent = 'Saving...';
    
    try {
        await db.collection('users').doc(user.uid).set({
            phone: phone,
            email: user.email,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        status.textContent = 'Phone number saved successfully!';
        status.className = 'text-green-400 text-sm mt-3';
        showElement(status);
        
        // Re-check profile completion
        const username = $('ownerUsername')?.value?.trim() || '';
        checkProfileCompletion(username, phone);
        
        setTimeout(() => hideElement(status), 3000);
    } catch (error) {
        console.error('Error saving phone:', error);
        status.textContent = 'Error saving phone number. Please try again.';
        status.className = 'text-red-400 text-sm mt-3';
        showElement(status);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Phone';
    }
};

// ==================== AUTH FUNCTIONS ====================
window.showOwnerLoginForm = function() {
    hideElement($('loginOptions'));
    showElement($('ownerLoginForm'));
    hideElement($('loginError'));
};

window.hideOwnerLoginForm = function() {
    showElement($('loginOptions'));
    hideElement($('ownerLoginForm'));
};

window.loginAsRenter = function() {
    state.currentUser = 'renter';
    closeModal('loginModal');
    window.goHome();
};

window.logout = function() {
    state.currentUser = null;
    updateAuthButton(false);
    // Clear username field and status
    $('ownerUsername').value = '';
    hideElement($('usernameStatus'));
    // Clean up notification listener
    if (window.userNotificationUnsubscribe) {
        window.userNotificationUnsubscribe();
        window.userNotificationUnsubscribe = null;
    }
    // Clean up upgrade request listener
    if (window.upgradeRequestUnsubscribe) {
        window.upgradeRequestUnsubscribe();
        window.upgradeRequestUnsubscribe = null;
    }
    // Clean up admin polling interval
    if (window.adminPollInterval) {
        clearInterval(window.adminPollInterval);
        window.adminPollInterval = null;
    }
    // Clean up user tier listener
    if (window.userTierUnsubscribe) {
        window.userTierUnsubscribe();
        window.userTierUnsubscribe = null;
    }
    // Hide global alert
    dismissGlobalAlert();
    // Reset all admin alert state
    window.lastKnownRequestCount = -1;
    window.adminPendingRequests = [];
    window.adminAlertShownForRequests = new Set();
    
    auth.signOut().then(() => window.goHome()).catch(() => window.goHome());
};

// Force logout - used when user is deleted by admin
window.forceLogout = function() {
    console.log('[ForceLogout] User account deleted - forcing logout');
    
    // Clean up all listeners first (prevent further callbacks)
    if (window.userNotificationUnsubscribe) {
        window.userNotificationUnsubscribe();
        window.userNotificationUnsubscribe = null;
    }
    if (window.upgradeRequestUnsubscribe) {
        window.upgradeRequestUnsubscribe();
        window.upgradeRequestUnsubscribe = null;
    }
    if (window.adminPollInterval) {
        clearInterval(window.adminPollInterval);
        window.adminPollInterval = null;
    }
    if (window.userTierUnsubscribe) {
        window.userTierUnsubscribe();
        window.userTierUnsubscribe = null;
    }
    
    // Reset state
    state.currentUser = null;
    state.userTier = null;
    window.lastKnownRequestCount = -1;
    window.adminPendingRequests = [];
    window.adminAlertShownForRequests = new Set();
    
    // Update UI
    updateAuthButton(false);
    dismissGlobalAlert();
    
    // Sign out and go to home page as guest
    auth.signOut().then(() => {
        // Show a temporary toast message instead of blocking alert
        showDeletedAccountToast();
        goHome();
    }).catch(() => {
        showDeletedAccountToast();
        goHome();
    });
};

// Show toast message when account is deleted
window.showDeletedAccountToast = function() {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3';
    toast.innerHTML = `
        <span class="text-2xl">👋</span>
        <div>
            <div class="font-bold">Account Removed</div>
            <div class="text-sm opacity-90">Your account has been deleted by an administrator.</div>
        </div>
    `;
    document.body.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        toast.style.transition = 'all 0.3s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
};

// ==================== CALCULATIONS ====================
function getAvailableCount() {
    const ownerProps = getOwnerProperties();
    return ownerProps.filter(p => state.availability[p.id] !== false).length;
}

function calculateTotals() {
    const ownerProps = getOwnerProperties();
    const details = {
        weeklyPayers: [],   // Properties where renter pays weekly
        monthlyPayers: [],  // Properties where renter pays monthly
        available: []       // Available properties
    };
    
    let weeklyIncome = 0;
    let monthlyIncome = 0;
    
    ownerProps.forEach(p => {
        const weeklyPrice = PropertyDataService.getValue(p.id, 'weeklyPrice', p.weeklyPrice);
        const monthlyPrice = PropertyDataService.getValue(p.id, 'monthlyPrice', p.monthlyPrice);
        const paymentFrequency = PropertyDataService.getValue(p.id, 'paymentFrequency', p.paymentFrequency || 'weekly');
        const renterName = PropertyDataService.getValue(p.id, 'renterName', p.renterName || '');
        const isRented = state.availability[p.id] === false;
        
        const propInfo = {
            id: p.id,
            title: p.title,
            weeklyPrice,
            monthlyPrice,
            renterName,
            paymentFrequency
        };
        
        if (isRented) {
            if (paymentFrequency === 'monthly') {
                // Monthly payer contributes monthly rate
                monthlyIncome += monthlyPrice;
                // Weekly equivalent: monthly / 4
                weeklyIncome += Math.round(monthlyPrice / 4);
                details.monthlyPayers.push(propInfo);
            } else {
                // Weekly payer contributes weekly rate
                weeklyIncome += weeklyPrice;
                // Monthly equivalent: weekly * 4
                monthlyIncome += Math.round(weeklyPrice * 4);
                details.weeklyPayers.push(propInfo);
            }
        } else {
            details.available.push(propInfo);
        }
    });
    
    // Store details globally for the flip cards
    window.incomeDetails = details;
    
    return { weekly: weeklyIncome, monthly: monthlyIncome, details };
}

// Flip card toggle
window.flipCard = function(card) {
    card.classList.toggle('flipped');
};

// Update breakdown panels
function updateIncomeBreakdowns(details) {
    const weeklyEl = $('weeklyBreakdown');
    const monthlyEl = $('monthlyBreakdown');
    const unitsEl = $('unitsBreakdown');
    
    if (!weeklyEl || !monthlyEl || !unitsEl) return;
    
    // Weekly breakdown - shows what contributes to weekly total
    let weeklyHTML = '';
    let weeklyNum = 1;
    if (details.weeklyPayers.length > 0) {
        weeklyHTML += '<div class="font-bold text-blue-300 mb-1">Weekly Payers:</div>';
        details.weeklyPayers.forEach(p => {
            weeklyHTML += `<div class="flex justify-between py-0.5 border-b border-blue-700/30">
                <span class="truncate mr-2"><span class="text-blue-400 mr-1">${weeklyNum}.</span>${p.title}</span>
                <span class="text-green-300 font-bold">$${p.weeklyPrice.toLocaleString()}</span>
            </div>`;
            weeklyNum++;
        });
    }
    if (details.monthlyPayers.length > 0) {
        weeklyHTML += '<div class="font-bold text-blue-300 mt-2 mb-1">Monthly Payers (÷4):</div>';
        details.monthlyPayers.forEach(p => {
            const weeklyEquiv = Math.round(p.monthlyPrice / 4);
            weeklyHTML += `<div class="flex justify-between py-0.5 border-b border-blue-700/30">
                <span class="truncate mr-2"><span class="text-blue-400 mr-1">${weeklyNum}.</span>${p.title}</span>
                <span class="text-yellow-300">~$${weeklyEquiv.toLocaleString()}</span>
            </div>`;
            weeklyNum++;
        });
    }
    if (!weeklyHTML) weeklyHTML = '<div class="opacity-70">No rented properties</div>';
    weeklyEl.innerHTML = weeklyHTML;
    
    // Monthly breakdown - shows what contributes to monthly total
    let monthlyHTML = '';
    let monthlyNum = 1;
    if (details.monthlyPayers.length > 0) {
        monthlyHTML += '<div class="font-bold text-green-300 mb-1">Monthly Payers:</div>';
        details.monthlyPayers.forEach(p => {
            monthlyHTML += `<div class="flex justify-between py-0.5 border-b border-green-700/30">
                <span class="truncate mr-2"><span class="text-green-400 mr-1">${monthlyNum}.</span>${p.title}</span>
                <span class="text-green-300 font-bold">$${p.monthlyPrice.toLocaleString()}</span>
            </div>`;
            monthlyNum++;
        });
    }
    if (details.weeklyPayers.length > 0) {
        monthlyHTML += '<div class="font-bold text-green-300 mt-2 mb-1">Weekly Payers (×4):</div>';
        details.weeklyPayers.forEach(p => {
            const monthlyEquiv = Math.round(p.weeklyPrice * 4);
            monthlyHTML += `<div class="flex justify-between py-0.5 border-b border-green-700/30">
                <span class="truncate mr-2"><span class="text-green-400 mr-1">${monthlyNum}.</span>${p.title}</span>
                <span class="text-yellow-300">~$${monthlyEquiv.toLocaleString()}</span>
            </div>`;
            monthlyNum++;
        });
    }
    if (!monthlyHTML) monthlyHTML = '<div class="opacity-70">No rented properties</div>';
    monthlyEl.innerHTML = monthlyHTML;
    
    // Units breakdown
    let unitsHTML = '';
    let unitsNum = 1;
    const rented = [...details.weeklyPayers, ...details.monthlyPayers];
    if (rented.length > 0) {
        unitsHTML += '<div class="font-bold text-red-300 mb-1">🔴 Rented:</div>';
        rented.forEach(p => {
            unitsHTML += `<div class="flex justify-between py-0.5 border-b border-purple-700/30">
                <span class="truncate mr-2"><span class="text-purple-400 mr-1">${unitsNum}.</span>${p.title}</span>
                <span class="text-sky-300">${p.renterName || 'Unknown'}</span>
            </div>`;
            unitsNum++;
        });
    }
    if (details.available.length > 0) {
        unitsHTML += '<div class="font-bold text-green-300 mt-2 mb-1">🟢 Available:</div>';
        details.available.forEach(p => {
            unitsHTML += `<div class="py-0.5 border-b border-purple-700/30 truncate"><span class="text-purple-400 mr-1">${unitsNum}.</span>${p.title}</div>`;
            unitsNum++;
        });
    }
    if (!unitsHTML) unitsHTML = '<div class="opacity-70">No properties</div>';
    unitsEl.innerHTML = unitsHTML;
}

// ==================== RENDER FUNCTIONS ====================
function renderOwnerDashboard() {
    // Load user notifications
    loadUserNotifications();
    
    const ownerProps = getOwnerProperties();
    const totals = calculateTotals();
    $('weeklyIncomeDisplay').textContent = formatPrice(totals.weekly);
    $('monthlyIncomeDisplay').textContent = formatPrice(totals.monthly);
    $('unitsAvailableDisplay').textContent = `${getAvailableCount()}/${ownerProps.length}`;
    
    // Populate breakdown panels
    updateIncomeBreakdowns(totals.details);
    
    if (ownerProps.length === 0) {
        $('ownerPropertiesTable').innerHTML = `
            <tr>
                <td colspan="11" class="px-6 py-12 text-center text-gray-400">
                    <div class="text-4xl mb-4">🏠</div>
                    <p class="text-xl font-semibold">No properties assigned to this account</p>
                    <p class="text-sm mt-2">Contact the administrator to get properties assigned to your account.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // AUTO-FIX: Check all properties for inconsistent renter/availability status
    ownerProps.forEach(p => {
        const renterName = PropertyDataService.getValue(p.id, 'renterName', p.renterName || '');
        const renterPhone = PropertyDataService.getValue(p.id, 'renterPhone', p.renterPhone || '');
        const lastPaymentDate = PropertyDataService.getValue(p.id, 'lastPaymentDate', p.lastPaymentDate || '');
        if ((renterName || renterPhone || lastPaymentDate) && state.availability[p.id] !== false) {
            console.log(`[Auto-fix] Property ${p.id} has renter/payment info but was marked available - fixing to rented`);
            state.availability[p.id] = false;
            PropertyDataService.write(p.id, 'isAvailable', false);
        }
    });
    
    $('ownerPropertiesTable').innerHTML = ownerProps.map((p, index) => {
        // Get renter and payment info
        const renterName = PropertyDataService.getValue(p.id, 'renterName', p.renterName || '');
        const paymentFrequency = PropertyDataService.getValue(p.id, 'paymentFrequency', p.paymentFrequency || 'weekly');
        const lastPaymentDate = PropertyDataService.getValue(p.id, 'lastPaymentDate', p.lastPaymentDate || '');
        const weeklyPrice = PropertyDataService.getValue(p.id, 'weeklyPrice', p.weeklyPrice);
        const monthlyPrice = PropertyDataService.getValue(p.id, 'monthlyPrice', p.monthlyPrice);
        
        // Calculate next due date
        let nextDueDate = '';
        let daysUntilDue = null;
        let reminderScript = '';
        let dueDateDisplay = '';
        
        if (lastPaymentDate) {
            const lastDate = parseLocalDate(lastPaymentDate);
            const nextDate = new Date(lastDate);
            if (paymentFrequency === 'weekly') {
                nextDate.setDate(nextDate.getDate() + 7);
            } else {
                nextDate.setMonth(nextDate.getMonth() + 1);
            }
            nextDueDate = nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            nextDate.setHours(0, 0, 0, 0);
            daysUntilDue = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntilDue < 0) {
                dueDateDisplay = `<span class="text-red-400 font-bold">${Math.abs(daysUntilDue)}d overdue</span>`;
            } else if (daysUntilDue === 0) {
                dueDateDisplay = `<span class="text-red-400 font-bold">Due today</span>`;
            } else if (daysUntilDue === 1) {
                dueDateDisplay = `<span class="text-orange-400 font-bold">Due tomorrow</span>`;
            } else if (daysUntilDue <= 3) {
                dueDateDisplay = `<span class="text-yellow-400">${daysUntilDue}d left</span>`;
            } else {
                dueDateDisplay = `<span class="text-green-400">${daysUntilDue}d left</span>`;
            }
            
            // Generate reminder script
            const amountDue = paymentFrequency === 'weekly' ? weeklyPrice : monthlyPrice;
            if (renterName && daysUntilDue <= 1) {
                const fullNextDate = nextDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                if (daysUntilDue === 1) {
                    reminderScript = `Hey ${renterName}! 👋 Just a friendly reminder that your ${paymentFrequency} rent payment of $${amountDue.toLocaleString()} is due tomorrow (${fullNextDate}). Let me know if you have any questions!`;
                } else if (daysUntilDue === 0) {
                    reminderScript = `Hey ${renterName}! 👋 Just a friendly reminder that your ${paymentFrequency} rent payment of $${amountDue.toLocaleString()} is due today (${fullNextDate}). Let me know if you have any questions!`;
                } else {
                    const daysOverdue = Math.abs(daysUntilDue);
                    reminderScript = `Hey ${renterName}, your ${paymentFrequency} rent payment of $${amountDue.toLocaleString()} was due on ${fullNextDate} (${daysOverdue} day${daysOverdue > 1 ? 's' : ''} ago). Please make your payment as soon as possible. Let me know if you need to discuss anything!`;
                }
            }
        }
        
        const lastPaidDisplay = lastPaymentDate ? formatDate(lastPaymentDate, { month: 'short', day: 'numeric' }) : '-';
        
        // Store reminder for this property
        if (reminderScript) {
            window.dashboardReminders = window.dashboardReminders || {};
            window.dashboardReminders[p.id] = reminderScript;
        }
        
        // Alternating color scheme - solid backgrounds for clarity
        const isEven = index % 2 === 0;
        const mainBg = isEven ? 'bg-slate-800' : 'bg-gray-800';
        const subBg = isEven ? 'bg-slate-900/80' : 'bg-gray-900/80';
        const accentColor = isEven ? 'border-l-purple-500' : 'border-l-blue-500';
        
        return `
        <tbody class="property-group">
            <tr class="${mainBg} border-l-4 ${accentColor}">
                <td class="px-3 py-4 text-center text-white font-bold text-lg" rowspan="2">${index + 1}</td>
                <td class="px-4 py-4"><div class="toggle-switch ${state.availability[p.id] !== false ? 'active' : ''}" onclick="toggleAvailability(${p.id})" role="switch" aria-checked="${state.availability[p.id] !== false}" tabindex="0"></div></td>
                <td class="px-4 py-4">
                    <span class="property-name-link font-bold text-white text-base" onclick="viewPropertyStats(${p.id})" role="button" tabindex="0" title="Click to view property stats">${sanitize(p.title)}</span>
                </td>
                <td class="px-4 py-4 text-gray-300 capitalize hidden md:table-cell">${p.type}</td>
                <td class="px-4 py-4 text-gray-300 hidden lg:table-cell editable-cell text-center" onclick="startCellEdit(${p.id}, 'bedrooms', this, 'number')" title="Click to edit">
                    <span class="cell-value">${PropertyDataService.getValue(p.id, 'bedrooms', p.bedrooms)}</span>
                </td>
                <td class="px-4 py-4 text-gray-300 hidden lg:table-cell editable-cell text-center" onclick="startCellEdit(${p.id}, 'bathrooms', this, 'number')" title="Click to edit">
                    <span class="cell-value">${PropertyDataService.getValue(p.id, 'bathrooms', p.bathrooms)}</span>
                </td>
                <td class="px-4 py-4 text-gray-300 hidden lg:table-cell editable-cell text-center" onclick="startCellEdit(${p.id}, 'interiorType', this, 'select')" title="Click to edit">
                    <span class="cell-value">${PropertyDataService.getValue(p.id, 'interiorType', p.interiorType)}</span>
                </td>
                <td class="px-4 py-4 text-gray-300 hidden lg:table-cell editable-cell text-center" onclick="startCellEdit(${p.id}, 'storage', this, 'number')" title="Click to edit">
                    <span class="cell-value">${PropertyDataService.getValue(p.id, 'storage', p.storage).toLocaleString()}</span>
                </td>
                <td class="px-4 py-4 text-green-400 font-bold editable-cell text-center" onclick="startCellEdit(${p.id}, 'weeklyPrice', this, 'number')" title="Click to edit">
                    <span class="cell-value">${weeklyPrice.toLocaleString()}</span>
                </td>
                <td class="px-4 py-4 text-purple-400 font-bold editable-cell text-center" onclick="startCellEdit(${p.id}, 'monthlyPrice', this, 'number')" title="Click to edit">
                    <span class="cell-value">${monthlyPrice.toLocaleString()}</span>
                </td>
                <td class="px-3 py-4 text-center" rowspan="2">
                    <button onclick="confirmDeleteProperty(${p.id}, '${sanitize(p.title).replace(/'/g, "\\'")}')" class="text-red-400 hover:text-red-300 hover:bg-red-900/30 p-2 rounded-lg transition" title="Delete property">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </td>
            </tr>
            <tr class="${subBg} border-l-4 ${accentColor}">
                <td colspan="9" class="px-4 py-3">
                    <div class="flex flex-wrap items-center text-sm gap-x-6 gap-y-2">
                        <div class="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-3 py-1.5 rounded-lg min-w-[280px] border border-transparent hover:border-gray-600" onclick="startCellEdit(${p.id}, 'renterName', this, 'text')" title="Click to edit renter name">
                            <svg class="w-4 h-4 text-sky-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                            <span class="text-gray-500">Renter:</span>
                            <span class="cell-value text-white font-medium">${renterName || '<span class="text-gray-600 italic">Not set</span>'}</span>
                            <svg class="w-3 h-3 text-gray-600 flex-shrink-0 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </div>
                        <div class="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-3 py-1.5 rounded-lg border border-transparent hover:border-gray-600" onclick="startCellEdit(${p.id}, 'paymentFrequency', this, 'frequency')" title="Click to edit payment frequency">
                            <svg class="w-4 h-4 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span class="text-gray-500">Frequency:</span>
                            <span class="cell-value text-white font-medium capitalize">${paymentFrequency}</span>
                            <svg class="w-3 h-3 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                        <div class="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-3 py-1.5 rounded-lg border border-transparent hover:border-gray-600" onclick="startCellEdit(${p.id}, 'lastPaymentDate', this, 'date')" title="Click to edit last payment date">
                            <svg class="w-4 h-4 text-lime-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            <span class="text-gray-500">Paid:</span>
                            <span class="cell-value text-white font-medium">${lastPaidDisplay !== '-' ? lastPaidDisplay : '<span class="text-gray-600 italic">-</span>'}</span>
                            <svg class="w-3 h-3 text-gray-600 flex-shrink-0 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </div>
                        <div class="flex items-center gap-2 px-3 py-1.5">
                            <svg class="w-4 h-4 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span class="text-gray-500">Due:</span>
                            <span class="font-medium text-white">${nextDueDate || '<span class="text-gray-600">-</span>'}</span>
                            ${dueDateDisplay ? `<span class="ml-1">(${dueDateDisplay})</span>` : ''}
                        </div>
                        ${reminderScript ? `
                        <div class="ml-auto">
                            <button onclick="copyDashboardReminder(${p.id}, this)" class="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs hover:opacity-90 transition flex items-center gap-1 shadow-lg" title="Copy reminder - text in city for fastest response">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                                📋 Copy Text
                            </button>
                        </div>
                        ` : ''}
                    </div>
                </td>
            </tr>
        </tbody>
        <tbody><tr class="h-2"><td colspan="11"></td></tr></tbody>
    `;
    }).join('');
}

// ==================== INLINE CELL EDITING ====================
window.startCellEdit = function(propertyId, field, cell, type) {
    // Don't start if already editing
    if (cell.querySelector('input, select')) return;
    
    const currentValue = PropertyDataService.getValue(propertyId, field, properties.find(p => p.id === propertyId)?.[field]) || '';
    const originalHTML = cell.innerHTML;
    
    cell.dataset.originalHTML = originalHTML;
    cell.dataset.propertyId = propertyId;
    cell.dataset.field = field;
    cell.dataset.type = type;
    
    let inputHTML = '';
    
    if (type === 'select' && field === 'interiorType') {
        inputHTML = `
            <select class="cell-input bg-gray-800 border border-purple-500 rounded px-2 py-1 text-white text-sm w-full" 
                    onchange="saveCellEdit(this, ${propertyId}, '${field}', '${type}')"
                    onblur="setTimeout(() => cancelCellEdit(this), 150)">
                <option value="Instance" ${currentValue === 'Instance' ? 'selected' : ''}>Instance</option>
                <option value="Walk-in" ${currentValue === 'Walk-in' ? 'selected' : ''}>Walk-in</option>
            </select>
        `;
    } else if (type === 'frequency') {
        inputHTML = `
            <select class="cell-input bg-gray-800 border border-purple-500 rounded px-2 py-1 text-white text-sm" 
                    onchange="saveCellEdit(this, ${propertyId}, '${field}', '${type}')"
                    onblur="setTimeout(() => cancelCellEdit(this), 150)">
                <option value="weekly" ${currentValue === 'weekly' ? 'selected' : ''}>Weekly</option>
                <option value="monthly" ${currentValue === 'monthly' ? 'selected' : ''}>Monthly</option>
            </select>
        `;
    } else if (type === 'date') {
        inputHTML = `
            <input type="date" 
                   class="cell-input bg-gray-800 border border-purple-500 rounded px-2 py-1 text-white text-sm" 
                   value="${currentValue}"
                   onkeydown="handleCellKeydown(event, this, ${propertyId}, '${field}', '${type}')"
                   onblur="saveCellEdit(this, ${propertyId}, '${field}', '${type}')">
        `;
    } else if (type === 'text') {
        inputHTML = `
            <input type="text" 
                   class="cell-input bg-gray-800 border border-purple-500 rounded px-2 py-1 text-white text-sm w-32" 
                   value="${currentValue}"
                   placeholder="Enter name..."
                   onkeydown="handleCellKeydown(event, this, ${propertyId}, '${field}', '${type}')"
                   onblur="saveCellEdit(this, ${propertyId}, '${field}', '${type}')">
        `;
    } else {
        // number type
        inputHTML = `
            <input type="number" 
                   class="cell-input bg-gray-800 border border-purple-500 rounded px-2 py-1 text-white text-sm w-20" 
                   value="${currentValue}"
                   onkeydown="handleCellKeydown(event, this, ${propertyId}, '${field}', '${type}')"
                   onblur="saveCellEdit(this, ${propertyId}, '${field}', '${type}')">
        `;
    }
    
    cell.innerHTML = inputHTML;
    
    const input = cell.querySelector('input, select');
    input.focus();
    if (input.select) input.select();
};

window.handleCellKeydown = function(event, input, propertyId, field, type) {
    if (event.key === 'Enter') {
        event.preventDefault();
        saveCellEdit(input, propertyId, field, type);
    } else if (event.key === 'Escape') {
        cancelCellEdit(input);
    }
};

window.saveCellEdit = async function(input, propertyId, field, type) {
    const cell = input.closest('td, div');
    let newValue = input.value;
    const originalHTML = cell.dataset.originalHTML;
    
    // Parse value based on type
    if (type === 'number') {
        newValue = parseInt(newValue);
        if (isNaN(newValue)) {
            cell.innerHTML = originalHTML;
            return;
        }
    } else if (type === 'text' || type === 'date' || type === 'frequency' || type === 'select') {
        // Keep as string, allow empty for text and date fields (so they can be cleared)
        if (!newValue && type !== 'text' && type !== 'date') {
            cell.innerHTML = originalHTML;
            return;
        }
    }
    
    // Show saving state
    cell.innerHTML = `<span class="text-gray-500">Saving...</span>`;
    
    try {
        // For empty date values, save empty string to clear the field
        await PropertyDataService.write(propertyId, field, newValue);
        
        // Auto-flip to "rented" when setting renter name, phone, or payment date
        if ((field === 'renterName' || field === 'renterPhone' || field === 'lastPaymentDate') && newValue) {
            if (state.availability[propertyId] !== false) {
                // Property is currently available, flip to rented
                state.availability[propertyId] = false;
                await PropertyDataService.write(propertyId, 'isAvailable', false);
                console.log(`Auto-flipped property ${propertyId} to rented (${field} set)`);
            }
        }
        
        // Re-render dashboard to show updated values
        renderOwnerDashboard();
        renderProperties(state.filteredProperties);
        
    } catch (error) {
        console.error('Save failed:', error);
        cell.innerHTML = originalHTML;
        alert('Failed to save. Please try again.');
    }
};

window.cancelCellEdit = function(input) {
    if (!input) return;
    const cell = input.closest('td');
    if (cell && cell.dataset.originalHTML) {
        cell.innerHTML = cell.dataset.originalHTML;
    }
};

async function renderProperties(list) {
    // Update property count
    $('propertyCount').textContent = `(${list.length})`;
    
    // First render with placeholder owner
    $('propertiesGrid').innerHTML = list.filter(p => p && p.images && p.images.length > 0).map(p => {
        const available = state.availability[p.id] !== false;
        return `
        <article class="property-card bg-gray-800 rounded-2xl shadow-xl overflow-hidden cursor-pointer border border-gray-700" onclick="viewProperty(${p.id})">
            <div class="relative">
                ${!available ? '<div class="unavailable-overlay"><div class="unavailable-text">UNAVAILABLE</div></div>' : ''}
                <img src="${p.images[0]}" alt="${sanitize(p.title)}" class="w-full h-64 md:h-72 object-cover" loading="lazy">
                ${p.videoUrl ? '<div class="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-pink-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full font-bold text-xs md:text-sm shadow-lg flex items-center space-x-1 md:space-x-2"><svg class="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"></path></svg><span>Video Tour</span></div>' : ''}
            </div>
            <div class="p-5 md:p-6">
                <div class="flex justify-between items-start gap-2 mb-3">
                    <h4 class="text-xl md:text-2xl font-bold text-white min-h-[3.5rem] md:min-h-[4rem] line-clamp-2">${sanitize(p.title)}</h4>
                    <span class="badge text-white text-xs font-bold px-2 md:px-3 py-1 rounded-full uppercase shrink-0">${p.type}</span>
                </div>
                <p class="text-gray-300 mb-2 font-medium text-sm md:text-base">Location: ${sanitize(p.location)}</p>
                <p class="text-xs md:text-sm text-gray-400 mb-2 font-semibold">Interior: ${PropertyDataService.getValue(p.id, 'interiorType', p.interiorType)}</p>
                <p id="owner-${p.id}" class="text-xs md:text-sm text-blue-400 mb-4 font-semibold">👤 Owner: Loading...</p>
                <div class="grid grid-cols-3 gap-2 mb-4 text-xs md:text-sm text-gray-300 font-semibold">
                    <div>${PropertyDataService.getValue(p.id, 'bedrooms', p.bedrooms)} Beds</div>
                    <div>${PropertyDataService.getValue(p.id, 'bathrooms', p.bathrooms)} Baths</div>
                    <div>${PropertyDataService.getValue(p.id, 'storage', p.storage).toLocaleString()}</div>
                </div>
                <div class="mb-4">
                    <div class="text-gray-400 font-semibold text-sm"><span class="font-bold text-gray-300">Weekly:</span> ${PropertyDataService.getValue(p.id, 'weeklyPrice', p.weeklyPrice).toLocaleString()}</div>
                    <div class="text-purple-400 font-black text-xl md:text-2xl mt-1">${PropertyDataService.getValue(p.id, 'monthlyPrice', p.monthlyPrice).toLocaleString()}<span class="text-xs md:text-sm font-semibold text-gray-400">/month</span></div>
                </div>
                <button onclick="viewProperty(${p.id})" class="w-full gradient-bg text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold hover:opacity-90 transition shadow-lg mb-2 text-sm md:text-base">View Details</button>
                <button onclick="event.stopPropagation(); openContactModal('offer', '${sanitize(p.title)}', ${p.id})" class="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold hover:opacity-90 transition shadow-lg text-sm md:text-base">Make an Offer</button>
            </div>
        </article>`;
    }).join('');
    
    // Then fetch and update owner names with tier icons asynchronously
    for (const p of list) {
        const ownerInfo = await getPropertyOwnerWithTier(p.id);
        const ownerEl = $(`owner-${p.id}`);
        if (ownerEl) {
            ownerEl.innerHTML = `👤 Owner: ${ownerInfo.display}`;
        }
    }
}

// ==================== TIER UPGRADE MODAL ====================
window.openUpgradeModal = function(reason, currentTier) {
    $('upgradeReason').textContent = reason;
    $('upgradeCurrentTier').value = currentTier;
    $('upgradeMessage').value = '';
    
    // Highlight current tier
    ['Starter', 'Pro', 'Elite'].forEach(t => {
        const el = $('tier' + t);
        if (el) {
            el.classList.remove('ring-2', 'ring-white');
            if (t.toLowerCase() === currentTier) {
                el.classList.add('ring-2', 'ring-white');
            }
        }
    });
    
    // Filter dropdown to only show upgrades
    const dropdown = $('upgradeRequestedTier');
    if (dropdown) {
        dropdown.innerHTML = '<option value="">Choose a plan...</option>';
        if (currentTier === 'starter') {
            dropdown.innerHTML += '<option value="pro">⭐ Pro - 3 Listings ($25k/month)</option>';
            dropdown.innerHTML += '<option value="elite">👑 Elite - Unlimited ($50k/month)</option>';
        } else if (currentTier === 'pro') {
            dropdown.innerHTML += '<option value="elite">👑 Elite - Unlimited ($50k/month)</option>';
        }
    }
    
    hideElement($('upgradeStatus'));
    openModal('upgradeModal');
};

window.generateUpgradeMessage = function() {
    const user = auth.currentUser;
    if (!user) return;
    
    const requestedTier = $('upgradeRequestedTier').value;
    const currentTier = $('upgradeCurrentTier').value;
    const messageBox = $('upgradeMessage');
    
    if (!requestedTier) {
        messageBox.value = '';
        return;
    }
    
    const tierInfo = {
        pro: { name: 'Pro', price: '$25,000', listings: '3' },
        elite: { name: 'Elite', price: '$50,000', listings: 'unlimited' }
    };
    
    const info = tierInfo[requestedTier];
    const currentTierName = TIERS[currentTier]?.name || 'Starter';
    const displayName = $('ownerUsername')?.value || user.email.split('@')[0];
    
    const message = `Hey Pauly! I'd like to upgrade my PaulysProperties.com account from ${currentTierName} to ${info.name}.

Account: ${user.email}
Display Name: ${displayName}
Requested Plan: ${info.name} (${info.listings} listings)
Monthly Cost: ${info.price}

I'm ready to pay and start listing more properties!`;
    
    messageBox.value = message;
};

window.copyUpgradeMessage = async function() {
    const messageBox = $('upgradeMessage');
    const status = $('upgradeStatus');
    const btn = $('upgradeSubmitBtn');
    const tierSelect = $('upgradeRequestedTier');
    
    if (!messageBox.value || !tierSelect.value) {
        status.textContent = 'Please select a plan first.';
        status.className = 'text-yellow-400 text-sm';
        showElement(status);
        return;
    }
    
    const user = auth.currentUser;
    const requestedTier = tierSelect.value;
    const displayName = $('ownerUsername')?.value || user?.email?.split('@')[0] || 'Unknown';
    
    btn.disabled = true;
    btn.innerHTML = '⏳ Sending...';
    
    try {
        // Save notification to Firestore
        await db.collection('upgradeNotifications').add({
            userEmail: user.email,
            userId: user.uid,
            displayName: displayName,
            currentTier: state.userTier || 'starter',
            requestedTier: requestedTier,
            message: messageBox.value,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Copy to clipboard
        await navigator.clipboard.writeText(messageBox.value);
        
        status.textContent = '✓ Request sent & copied! Pauly has been notified.';
        status.className = 'text-green-400 text-sm';
        showElement(status);
        
        btn.innerHTML = '✓ Sent & Copied!';
        btn.className = btn.className.replace('from-blue-500 to-blue-600', 'from-green-500 to-green-600');
        
        // Refresh pending indicator
        checkPendingUpgradeRequest(user.email);
        
        setTimeout(() => {
            closeModal('upgradeModal');
            btn.innerHTML = '🔔 Notify & Copy';
            btn.className = btn.className.replace('from-green-500 to-green-600', 'from-blue-500 to-blue-600');
            btn.disabled = false;
        }, 2000);
        
    } catch (err) {
        console.error('Error sending upgrade request:', err);
        
        // Still try to copy even if notification fails
        try {
            await navigator.clipboard.writeText(messageBox.value);
            status.textContent = '✓ Copied! (Notification failed - please contact Pauly directly)';
            status.className = 'text-yellow-400 text-sm';
        } catch {
            status.textContent = 'Failed to send. Please try again.';
            status.className = 'text-red-400 text-sm';
        }
        showElement(status);
        btn.innerHTML = '🔔 Notify & Copy Message';
        btn.disabled = false;
    }
};

// Check for pending upgrade request and show indicator
window.checkPendingUpgradeRequest = async function(email) {
    const pendingBadge = $('tierPendingBadge');
    const pendingBanner = $('pendingUpgradeUserBanner');
    const pendingMessage = $('pendingUpgradeUserMessage');
    const pendingDate = $('pendingUpgradeUserDate');
    const upgradeBtn = $('tierUpgradeBtn');
    
    if (!email) return;
    
    try {
        const snapshot = await db.collection('upgradeNotifications')
            .where('userEmail', '==', email.toLowerCase())
            .where('status', '==', 'pending')
            .limit(1)
            .get();
        
        if (snapshot.empty) {
            // No pending request - hide pending indicators
            if (pendingBadge) hideElement(pendingBadge);
            if (pendingBanner) hideElement(pendingBanner);
            
            // Show upgrade button again (unless at Elite tier)
            if (upgradeBtn && state.userTier !== 'elite') {
                showElement(upgradeBtn);
            }
            return;
        }
        
        // There's a pending request
        const request = snapshot.docs[0].data();
        const currentTierData = TIERS[request.currentTier] || TIERS.starter;
        const requestedTierData = TIERS[request.requestedTier] || TIERS.pro;
        const requestDate = request.createdAt?.toDate ? request.createdAt.toDate().toLocaleString() : 'Recently';
        
        // Show pending badge
        if (pendingBadge) showElement(pendingBadge);
        
        // Hide upgrade button while request is pending
        if (upgradeBtn) hideElement(upgradeBtn);
        
        // Show pending banner
        if (pendingBanner) {
            showElement(pendingBanner);
            if (pendingMessage) {
                pendingMessage.innerHTML = `You've requested to upgrade from <span class="font-bold ${currentTierData.color}">${currentTierData.icon} ${currentTierData.name}</span> to <span class="font-bold ${requestedTierData.color}">${requestedTierData.icon} ${requestedTierData.name}</span>. Waiting for owner approval.`;
            }
            if (pendingDate) {
                pendingDate.textContent = `Submitted: ${requestDate}`;
            }
        }
        
    } catch (error) {
        console.log('Could not check pending upgrade request:', error.message);
        // Hide indicators on error
        if (pendingBadge) hideElement(pendingBadge);
        if (pendingBanner) hideElement(pendingBanner);
    }
};

// ==================== ADMIN FUNCTIONS ====================
// Store users for filtering
window.adminUsersData = [];

window.switchAdminTab = function(tab) {
    const tabs = ['users', 'requests', 'create', 'history', 'tools'];
    const tabElements = {
        users: $('adminUsersTab'),
        requests: $('adminRequestsTab'),
        create: $('adminCreateTab'),
        history: $('adminHistoryTab'),
        tools: $('adminToolsTab')
    };
    const tabButtons = {
        users: $('adminTabUsers'),
        requests: $('adminTabRequests'),
        create: $('adminTabCreate'),
        history: $('adminTabHistory'),
        tools: $('adminTabTools')
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
    else if (tab === 'requests') loadUpgradeRequests();
    else if (tab === 'history') loadUpgradeHistory();
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
            const requestedTierData = TIERS[req.requestedTier] || TIERS.pro;
            const date = req.createdAt?.toDate ? req.createdAt.toDate().toLocaleString() : 'Unknown';
            const price = req.requestedTier === 'pro' ? '$25,000' : '$50,000';
            
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
    console.log('[AdminAlert] updateRequestsBadge called with count:', count);
    
    const badge = $('requestsTabBadge');
    const notificationBadge = $('upgradeNotificationBadge');
    const notificationCount = $('upgradeNotificationCount');
    const alertBox = $('pendingUpgradesAlert');
    const alertCount = $('pendingUpgradesCount');
    
    console.log('[AdminAlert] Badge elements found:', {
        badge: !!badge,
        notificationBadge: !!notificationBadge,
        alertBox: !!alertBox
    });
    
    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.classList.remove('hidden');
            console.log('[AdminAlert] Badge shown with count:', count);
        } else {
            badge.classList.add('hidden');
            console.log('[AdminAlert] Badge hidden');
        }
    } else {
        console.log('[AdminAlert] WARNING: requestsTabBadge element not found!');
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

// Approve upgrade request
window.approveUpgradeRequest = async function(requestId, userEmail, newTier, currentTier) {
    const paymentNote = prompt(`Approving upgrade to ${newTier.toUpperCase()} for ${userEmail}\n\nEnter payment confirmation:`);
    if (paymentNote === null) return;
    
    try {
        // Update user tier
        await TierService.setUserTier(userEmail, newTier, currentTier, paymentNote);
        
        // Set subscription payment date to today
        const snapshot = await db.collection('users').where('email', '==', userEmail).get();
        if (!snapshot.empty) {
            const userId = snapshot.docs[0].id;
            const today = new Date().toISOString().split('T')[0];
            await db.collection('users').doc(userId).update({
                subscriptionLastPaid: today,
                subscriptionUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log(`[Subscription] Set initial payment date for ${userEmail}: ${today}`);
        }
        
        // Mark request as approved
        await db.collection('upgradeNotifications').doc(requestId).update({
            status: 'approved',
            approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
            approvedBy: auth.currentUser?.email,
            paymentNote: paymentNote
        });
        
        // Create notification for user
        await db.collection('userNotifications').add({
            userEmail: userEmail.toLowerCase(),
            type: 'upgrade_approved',
            title: '🎉 Upgrade Approved!',
            message: `Your upgrade to ${TIERS[newTier]?.name || newTier} has been approved! You now have access to ${TIERS[newTier]?.maxListings === Infinity ? 'unlimited' : TIERS[newTier]?.maxListings} listings.`,
            newTier: newTier,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            read: false
        });
        
        alert(`✓ ${userEmail} upgraded to ${newTier}!\n\nSubscription payment date set to today.\nUser will be notified.`);
        loadUpgradeRequests();
        loadAllUsers();
        
    } catch (error) {
        console.error('Error approving request:', error);
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
        
        alert(`Request from ${userEmail} has been denied. User will be notified.`);
        loadUpgradeRequests();
        loadUpgradeHistory(); // Refresh history to show denial
        
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
    console.log('[AdminAlert] loadPendingUpgradeRequests called');
    
    const currentEmail = auth.currentUser?.email;
    console.log('[AdminAlert] Current user:', currentEmail);
    
    if (!TierService.isMasterAdmin(currentEmail)) {
        console.log('[AdminAlert] Not master admin, skipping');
        return;
    }
    
    console.log('[AdminAlert] IS MASTER ADMIN - Setting up notifications');
    
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
            console.log('[AdminAlert] Checking for pending requests...');
            const snapshot = await db.collection('upgradeNotifications')
                .where('status', '==', 'pending')
                .get();
            
            console.log('[AdminAlert] Found', snapshot.size, 'pending requests');
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
                console.log('[AdminAlert] Real-time snapshot received, count:', snapshot.size);
                processRequestSnapshot(snapshot);
            }, (error) => {
                console.error('[AdminAlert] Listener error:', error);
                console.log('[AdminAlert] Falling back to polling only');
            });
        
        console.log('[AdminAlert] Real-time listener setup complete');
            
    } catch (error) {
        console.error('[AdminAlert] Error setting up listener:', error);
    }
    
    // ALSO set up polling as backup (every 5 seconds)
    checkPendingRequests(); // Check immediately
    window.adminPollInterval = setInterval(checkPendingRequests, 5000);
    console.log('[AdminAlert] Polling backup started (every 5 seconds)');
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
        console.log('[AdminAlert] Pending requests changed - refreshing user list');
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
            console.log('[AdminAlert] NEW REQUEST DETECTED:', req.id, req.userEmail);
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
    
    if (!alertBar) {
        console.log('[AdminAlert] Alert bar element not found!');
        return;
    }
    
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
    
    console.log('[AdminAlert] Persistent alert shown');
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

window.updateAdminStats = function(users) {
    const totalUsers = users.length;
    const proUsers = users.filter(u => u.tier === 'pro');
    const eliteUsers = users.filter(u => u.tier === 'elite');
    const starterUsers = users.filter(u => u.tier === 'starter' || !u.tier);
    const totalListings = Object.values(ownerPropertyMap).reduce((sum, props) => sum + props.length, 0);
    const availableListings = properties.filter(p => p.available).length;
    const rentedListings = properties.filter(p => !p.available).length;
    
    // Front stats
    const statUsers = $('adminStatUsers');
    const statPro = $('adminStatPro');
    const statElite = $('adminStatElite');
    const statListings = $('adminStatListings');
    
    if (statUsers) statUsers.textContent = totalUsers;
    if (statPro) statPro.textContent = proUsers.length;
    if (statElite) statElite.textContent = eliteUsers.length;
    if (statListings) statListings.textContent = totalListings;
    
    // Back details - Users
    const usersDetail = $('adminStatUsersDetail');
    if (usersDetail) {
        usersDetail.innerHTML = `
            <div>🌱 Starter: ${starterUsers.length}</div>
            <div>⭐ Pro: ${proUsers.length}</div>
            <div>👑 Elite: ${eliteUsers.length}</div>
        `;
    }
    
    // Back details - Pro (with monthly revenue)
    const proDetail = $('adminStatProDetail');
    if (proDetail) {
        const proRevenue = proUsers.length * 25000;
        proDetail.innerHTML = `
            <div>💰 Revenue: $${proRevenue.toLocaleString()}/mo</div>
            <div>📊 3 listings each</div>
            ${proUsers.slice(0, 2).map(u => `<div class="truncate">• ${u.username || u.email.split('@')[0]}</div>`).join('')}
            ${proUsers.length > 2 ? `<div class="text-gray-500">+${proUsers.length - 2} more</div>` : ''}
        `;
    }
    
    // Back details - Elite (with monthly revenue)
    const eliteDetail = $('adminStatEliteDetail');
    if (eliteDetail) {
        const eliteRevenue = eliteUsers.length * 50000;
        eliteDetail.innerHTML = `
            <div>💰 Revenue: $${eliteRevenue.toLocaleString()}/mo</div>
            <div>📊 Unlimited listings</div>
            ${eliteUsers.slice(0, 2).map(u => `<div class="truncate">• ${u.username || u.email.split('@')[0]}</div>`).join('')}
            ${eliteUsers.length > 2 ? `<div class="text-gray-500">+${eliteUsers.length - 2} more</div>` : ''}
        `;
    }
    
    // Back details - Listings
    const listingsDetail = $('adminStatListingsDetail');
    if (listingsDetail) {
        listingsDetail.innerHTML = `
            <div>🟢 Available: ${availableListings}</div>
            <div>🔴 Rented: ${rentedListings}</div>
            <div>💵 Total Revenue: $${(proUsers.length * 25000 + eliteUsers.length * 50000).toLocaleString()}/mo</div>
        `;
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

window.loadAllUsers = async function() {
    const container = $('allUsersList');
    if (!container) return;
    
    container.innerHTML = '<p class="text-gray-500 italic">Loading users...</p>';
    
    try {
        const users = await TierService.getAllUsers();
        window.adminUsersData = users;
        
        updateAdminStats(users);
        
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
    
    container.innerHTML = users.map(user => {
        // Check if this user is the master admin
        const isUserMasterAdmin = TierService.isMasterAdmin(user.email);
        
        // Check if user has pending upgrade request
        const hasPendingRequest = pendingEmails.includes(user.email?.toLowerCase());
        const pendingRequest = pending.find(r => r.userEmail?.toLowerCase() === user.email?.toLowerCase());
        
        // Use Admin tier display for master admin, otherwise use their actual tier
        const tierData = isUserMasterAdmin 
            ? { icon: '👑', name: 'Owner', bgColor: 'bg-red-600', maxListings: Infinity }
            : (TIERS[user.tier] || TIERS.starter);
        
        // ownerPropertyMap contains property IDs, need to look up actual property objects
        const userPropertyIds = ownerPropertyMap[user.email?.toLowerCase()] || [];
        const userProperties = userPropertyIds.map(id => properties.find(p => p.id === id)).filter(p => p);
        const listingCount = userProperties.length;
        const maxListings = (isUserMasterAdmin || tierData.maxListings === Infinity) ? '∞' : tierData.maxListings;
        const lastUpdated = user.tierUpdatedAt?.toDate ? user.tierUpdatedAt.toDate().toLocaleDateString() : 'Never';
        const escapedEmail = user.email.replace(/'/g, "\\'");
        const escapedId = user.id;
        const displayName = user.username || user.email.split('@')[0];
        
        // Build properties list HTML with numbering and proper data
        const propertiesHTML = userProperties.length > 0 
            ? userProperties.map((p, index) => {
                const title = p.title || p.name || 'Unnamed Property';
                // Check available status - use state.availability which syncs with dashboard
                const isAvailable = state.availability[p.id] !== false;
                return `
                    <div class="flex items-center justify-between py-1.5 border-b border-gray-700/50 last:border-0">
                        <span class="text-gray-300 text-xs">
                            <span class="text-gray-500 mr-2">${index + 1}.</span>
                            ${title}
                        </span>
                        <span class="text-xs ${isAvailable ? 'text-green-400' : 'text-red-400'}">${isAvailable ? '🟢 Available' : '🔴 Rented'}</span>
                    </div>
                `;
            }).join('')
            : '<p class="text-gray-500 text-xs italic">No properties listed</p>';
        
        // Pending upgrade badge
        const pendingBadge = hasPendingRequest ? `
            <span class="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse ml-2">
                💰 WANTS ${(TIERS[pendingRequest?.requestedTier]?.name || 'Upgrade').toUpperCase()}
            </span>
        ` : '';
        
        // === SUBSCRIPTION TRACKING FOR PRO/ELITE USERS ===
        let subscriptionHTML = '';
        if (!isUserMasterAdmin && (user.tier === 'pro' || user.tier === 'elite')) {
            const subLastPaid = user.subscriptionLastPaid || '';
            const tierPrice = user.tier === 'pro' ? '$25,000' : '$50,000';
            
            // Calculate next due date (monthly)
            let nextDueDate = '';
            let daysUntilDue = null;
            let statusColor = 'text-gray-400';
            let statusBg = 'bg-gray-700';
            let statusIcon = '📅';
            
            if (subLastPaid) {
                const lastDate = new Date(subLastPaid);
                const nextDate = new Date(lastDate);
                nextDate.setMonth(nextDate.getMonth() + 1);
                nextDueDate = nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                nextDate.setHours(0, 0, 0, 0);
                daysUntilDue = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
                
                if (daysUntilDue < 0) {
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
                ? new Date(subLastPaid).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Never';
            
            const dueDisplay = daysUntilDue !== null
                ? (daysUntilDue < 0 
                    ? `<span class="text-red-400 font-bold">${Math.abs(daysUntilDue)}d OVERDUE!</span>`
                    : daysUntilDue === 0
                        ? `<span class="text-orange-400 font-bold">DUE TODAY!</span>`
                        : `<span class="${statusColor}">${daysUntilDue}d left</span>`)
                : '<span class="text-gray-500">Not set</span>';
            
            subscriptionHTML = `
                <div class="mt-3 p-3 rounded-lg border ${statusBg}">
                    <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div class="flex items-center gap-2">
                            <span class="text-lg">${statusIcon}</span>
                            <span class="text-white font-bold text-sm">Subscription: ${tierPrice}/mo</span>
                        </div>
                        <button onclick="copySubscriptionReminder('${escapedEmail}', '${displayName}', '${user.tier}', '${tierPrice}')" 
                            class="bg-cyan-600 hover:bg-cyan-700 text-white px-2 py-1 rounded text-xs font-bold transition">
                            📋 Copy Reminder
                        </button>
                    </div>
                    <div class="grid grid-cols-2 gap-3 text-xs">
                        <div>
                            <span class="text-gray-400">Last Paid:</span>
                            <span class="text-white ml-1 cursor-pointer hover:text-cyan-400" 
                                  onclick="editSubscriptionDate('${escapedId}', '${escapedEmail}', '${subLastPaid}')"
                                  title="Click to edit">
                                ${lastPaidDisplay} ✏️
                            </span>
                        </div>
                        <div>
                            <span class="text-gray-400">Next Due:</span>
                            <span class="ml-1">${nextDueDate || '-'}</span>
                            ${dueDisplay}
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Don't show action buttons for master admin
        const actionButtons = isUserMasterAdmin ? '' : `
            <div class="flex flex-wrap gap-2">
                ${user.tier !== 'pro' ? `
                    <button onclick="adminUpgradeUser('${escapedEmail}', 'pro', '${user.tier}')" 
                        class="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-3 py-2 rounded-lg font-bold text-xs hover:opacity-90 transition"
                        title="Upgrade this user to Pro tier ($25k/mo)">
                        ⭐ Upgrade to Pro
                    </button>
                ` : ''}
                ${user.tier !== 'elite' ? `
                    <button onclick="adminUpgradeUser('${escapedEmail}', 'elite', '${user.tier}')" 
                        class="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-2 rounded-lg font-bold text-xs hover:opacity-90 transition"
                        title="Upgrade this user to Elite tier ($50k/mo)">
                        👑 Upgrade to Elite
                    </button>
                ` : ''}
                ${user.tier !== 'starter' ? `
                    <button onclick="adminDowngradeUser('${escapedEmail}', '${user.tier}')" 
                        class="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-3 py-2 rounded-lg font-bold text-xs hover:opacity-90 transition"
                        title="Downgrade to free Starter tier">
                        🌱 Downgrade
                    </button>
                ` : ''}
                <button onclick="adminDeleteUser('${escapedId}', '${escapedEmail}')" 
                    class="bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-2 rounded-lg font-bold text-xs hover:opacity-90 transition"
                    title="Delete this user account">
                    🗑️ Delete
                </button>
            </div>
        `;
        
        // Card border styling - highlight users with pending requests
        const cardBorder = hasPendingRequest 
            ? 'border-orange-500 ring-2 ring-orange-500/50 animate-pulse'
            : (isUserMasterAdmin ? 'border-red-600/50' : 'border-gray-700');
        
        return `
            <div class="bg-gray-800 rounded-xl p-4 border ${cardBorder} admin-user-card" data-email="${user.email}" data-userid="${escapedId}">
                <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <span class="text-2xl">${tierData.icon}</span>
                            <div>
                                <div class="text-white font-bold flex items-center flex-wrap">${displayName}${pendingBadge}</div>
                                <div class="text-gray-500 text-xs">${user.email}</div>
                            </div>
                        </div>
                        <div class="flex flex-wrap items-center gap-3 text-sm">
                            <span class="px-2 py-1 rounded ${tierData.bgColor} text-white font-bold text-xs">${tierData.name}</span>
                            <span class="text-gray-400">${listingCount}/${maxListings} listings</span>
                            <span class="text-gray-500 text-xs">Updated: ${lastUpdated}</span>
                            <button onclick="toggleUserProperties('${escapedId}')" class="text-cyan-400 hover:underline text-xs flex items-center gap-1">
                                <span id="propToggle_${escapedId}">▶</span> Properties (${listingCount})
                            </button>
                        </div>
                        <!-- Inline Properties List -->
                        <div id="propList_${escapedId}" class="hidden mt-3 bg-gray-900/50 rounded-lg p-3 max-h-32 overflow-y-auto">
                            ${propertiesHTML}
                        </div>
                        ${subscriptionHTML}
                    </div>
                    ${actionButtons}
                </div>
            </div>
        `;
    }).join('');
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

window.filterAdminUsers = function() {
    const searchTerm = ($('adminUserSearch')?.value || '').toLowerCase();
    const filtered = window.adminUsersData.filter(user => {
        return user.email.toLowerCase().includes(searchTerm) ||
               (user.username || '').toLowerCase().includes(searchTerm);
    });
    renderAdminUsersList(filtered);
};

// ==================== SUBSCRIPTION TRACKING ====================

// Edit subscription last paid date
window.editSubscriptionDate = function(userId, email, currentDate) {
    const newDate = prompt(
        `Enter last subscription payment date for ${email}:\n\n` +
        `Format: YYYY-MM-DD (e.g., 2025-12-04)\n` +
        `Current value: ${currentDate || 'Not set'}`,
        currentDate || new Date().toISOString().split('T')[0]
    );
    
    if (newDate !== null) {
        // Validate date format
        if (newDate && !/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
            alert('Invalid date format. Please use YYYY-MM-DD');
            return;
        }
        
        saveSubscriptionDate(userId, email, newDate);
    }
};

// Save subscription date to Firestore
window.saveSubscriptionDate = async function(userId, email, date) {
    try {
        await db.collection('users').doc(userId).update({
            subscriptionLastPaid: date || '',
            subscriptionUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`[Subscription] Updated last paid for ${email}: ${date}`);
        
        // Update local cache and re-render
        if (window.adminUsersData) {
            const userIndex = window.adminUsersData.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                window.adminUsersData[userIndex].subscriptionLastPaid = date;
            }
        }
        
        // Re-render the user list
        loadAllUsers();
        
    } catch (error) {
        console.error('Error saving subscription date:', error);
        alert('Error saving subscription date: ' + error.message);
    }
};

// Copy subscription reminder text
window.copySubscriptionReminder = function(email, displayName, tier, price) {
    const tierName = tier === 'pro' ? 'Pro ⭐' : 'Elite 👑';
    
    const reminderText = `Hey ${displayName}! 👋

This is a friendly reminder that your PaulysProperties.com ${tierName} subscription payment is coming up!

💰 Amount Due: ${price}
📅 Subscription: ${tierName} Tier
🏠 Benefits: ${tier === 'pro' ? '3 property listings' : 'Unlimited property listings'}

Please meet up to make your monthly payment when you're available. Let me know what works for you!

Thanks for being a valued member! 🙏`;

    navigator.clipboard.writeText(reminderText).then(() => {
        // Show success feedback
        const toast = document.createElement('div');
        toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2';
        toast.innerHTML = `<span class="text-lg">✅</span> Reminder copied for ${displayName}!`;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.transition = 'opacity 0.3s';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }).catch(err => {
        console.error('Copy failed:', err);
        alert('Failed to copy. Please try manually.');
    });
};

// Check for overdue subscriptions and show alerts
window.checkSubscriptionAlerts = function() {
    if (!window.adminUsersData) return;
    
    const overdueUsers = [];
    const dueSoonUsers = [];
    
    window.adminUsersData.forEach(user => {
        if (user.tier !== 'pro' && user.tier !== 'elite') return;
        if (TierService.isMasterAdmin(user.email)) return;
        
        const subLastPaid = user.subscriptionLastPaid;
        if (!subLastPaid) {
            // Never paid - consider overdue
            overdueUsers.push({
                name: user.username || user.email.split('@')[0],
                email: user.email,
                tier: user.tier,
                daysOverdue: 'Never paid'
            });
            return;
        }
        
        const lastDate = new Date(subLastPaid);
        const nextDate = new Date(lastDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        nextDate.setHours(0, 0, 0, 0);
        const daysUntilDue = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue < 0) {
            overdueUsers.push({
                name: user.username || user.email.split('@')[0],
                email: user.email,
                tier: user.tier,
                daysOverdue: Math.abs(daysUntilDue)
            });
        } else if (daysUntilDue <= 3) {
            dueSoonUsers.push({
                name: user.username || user.email.split('@')[0],
                email: user.email,
                tier: user.tier,
                daysLeft: daysUntilDue
            });
        }
    });
    
    // Store for display
    window.overdueSubscriptions = overdueUsers;
    window.dueSoonSubscriptions = dueSoonUsers;
    
    // Update subscription alert badge
    updateSubscriptionAlertBadge(overdueUsers.length, dueSoonUsers.length);
    
    return { overdue: overdueUsers, dueSoon: dueSoonUsers };
};

// Update subscription alert badge on All Users tab
window.updateSubscriptionAlertBadge = function(overdueCount, dueSoonCount) {
    // Add badge to the All Users tab if there are issues
    const allUsersTab = document.querySelector('button[onclick*="switchAdminTab"][onclick*="users"]');
    if (!allUsersTab) return;
    
    // Remove existing badge
    const existingBadge = allUsersTab.querySelector('.sub-alert-badge');
    if (existingBadge) existingBadge.remove();
    
    if (overdueCount > 0) {
        const badge = document.createElement('span');
        badge.className = 'sub-alert-badge bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2 animate-pulse';
        badge.textContent = `🚨 ${overdueCount}`;
        badge.title = `${overdueCount} overdue subscription(s)`;
        allUsersTab.appendChild(badge);
    } else if (dueSoonCount > 0) {
        const badge = document.createElement('span');
        badge.className = 'sub-alert-badge bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2';
        badge.textContent = `⚠️ ${dueSoonCount}`;
        badge.title = `${dueSoonCount} subscription(s) due soon`;
        allUsersTab.appendChild(badge);
    }
};

// Show global subscription alert if there are overdue subscriptions
window.showSubscriptionAlert = function() {
    const { overdue, dueSoon } = checkSubscriptionAlerts();
    
    if (overdue.length > 0) {
        const names = overdue.slice(0, 3).map(u => u.name).join(', ');
        const more = overdue.length > 3 ? ` +${overdue.length - 3} more` : '';
        
        showGlobalAlert(
            '🚨 Overdue Subscriptions!',
            `${names}${more} - Click to view`,
            'users'
        );
    }
};

window.updateAdminUserField = async function(userId, email, field, value) {
    try {
        await db.collection('users').doc(userId).update({
            [field]: value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log(`[Admin] Updated ${field} for ${email}: ${value}`);
        
        // Update cache and sync everywhere
        if (field === 'username') {
            window.ownerUsernameCache = window.ownerUsernameCache || {};
            window.ownerUsernameCache[email.toLowerCase()] = value;
            
            // If this is the current user, update nav and profile
            const currentUser = auth.currentUser;
            if (currentUser && currentUser.email.toLowerCase() === email.toLowerCase()) {
                // Update nav display
                const navUserName = $('navUserName');
                if (navUserName) navUserName.textContent = value;
                
                // Update profile input
                const ownerUsername = $('ownerUsername');
                if (ownerUsername) ownerUsername.value = value;
            }
            
            // Update any property cards showing this owner
            syncOwnerNameEverywhere(email, value);
        }
    } catch (error) {
        console.error('Error updating user field:', error);
        alert('Error updating field: ' + error.message);
    }
};

// Sync owner name across all visible elements
window.syncOwnerNameEverywhere = function(email, newName) {
    const normalizedEmail = email.toLowerCase();
    
    // Update property cards with this owner
    document.querySelectorAll(`[data-owner-email="${normalizedEmail}"]`).forEach(el => {
        el.textContent = newName;
    });
    
    // Update any owner display elements
    document.querySelectorAll('.owner-name').forEach(el => {
        if (el.dataset.email?.toLowerCase() === normalizedEmail) {
            el.textContent = newName;
        }
    });
    
    console.log(`[Sync] Updated owner name everywhere for ${email} to ${newName}`);
};

window.adminDeleteUser = async function(userId, email) {
    // Get user's properties
    const userPropertyIds = ownerPropertyMap[email.toLowerCase()] || [];
    const userProperties = userPropertyIds.map(id => properties.find(p => p.id === id)).filter(p => p);
    const propertyCount = userProperties.length;
    
    // Build confirmation message
    let message = `⚠️ DELETE USER: ${email}\n\n`;
    
    if (propertyCount > 0) {
        message += `This user has ${propertyCount} propert${propertyCount > 1 ? 'ies' : 'y'}:\n`;
        userProperties.slice(0, 5).forEach((p, i) => {
            message += `  ${i + 1}. ${p.title}\n`;
        });
        if (propertyCount > 5) {
            message += `  ... and ${propertyCount - 5} more\n`;
        }
        message += `\nWhat would you like to do with their properties?\n\n`;
        message += `Click OK to DELETE properties too\n`;
        message += `Click Cancel to keep properties (unassigned)`;
    } else {
        message += `This user has no properties.\n\nContinue with deletion?`;
    }
    
    const deleteProperties = propertyCount > 0 ? confirm(message) : null;
    
    // If they clicked Cancel on property question, ask if they still want to delete user
    if (propertyCount > 0 && !deleteProperties) {
        if (!confirm(`Delete ${email} but KEEP their ${propertyCount} properties unassigned?\n\nClick OK to continue, Cancel to abort.`)) {
            return;
        }
    } else if (propertyCount === 0) {
        if (!confirm(message)) return;
    }
    
    try {
        if (deleteProperties && propertyCount > 0) {
            // Delete properties completely
            for (const prop of userProperties) {
                await deletePropertyCompletely(prop.id, email);
            }
            console.log(`[Admin] Deleted ${propertyCount} properties for ${email}`);
        } else if (propertyCount > 0) {
            // Orphan properties - clear owner but keep property
            for (const prop of userProperties) {
                await orphanProperty(prop.id);
            }
            console.log(`[Admin] Orphaned ${propertyCount} properties for ${email}`);
        }
        
        // Delete user document from Firestore
        await db.collection('users').doc(userId).delete();
        
        // Delete from Firebase Auth using Cloud Function
        try {
            const deleteAuthUser = functions.httpsCallable('deleteAuthUser');
            const result = await deleteAuthUser({ email: email });
            console.log('[Admin] Auth user deleted:', result.data);
        } catch (authError) {
            console.warn('[Admin] Could not delete Auth user (Cloud Function may not be deployed):', authError.message);
            // Continue - Firestore deletion was successful
        }
        
        // Remove from ownerPropertyMap
        delete ownerPropertyMap[email.toLowerCase()];
        
        // Clear from username cache
        if (window.ownerUsernameCache) {
            delete window.ownerUsernameCache[email.toLowerCase()];
        }
        
        const resultMsg = deleteProperties && propertyCount > 0
            ? `✓ User ${email} and their ${propertyCount} properties deleted.`
            : `✓ User ${email} deleted.${propertyCount > 0 ? ` Their ${propertyCount} properties are now unassigned.` : ''}`;
        
        alert(resultMsg);
        loadAllUsers();
        renderProperties(properties);
        
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user: ' + error.message);
    }
};

// Helper to orphan a property (clear owner but keep property)
window.orphanProperty = async function(propertyId) {
    try {
        // Get the old owner email before clearing
        const prop = properties.find(p => p.id === propertyId);
        const oldOwnerEmail = prop?.ownerEmail;
        
        // Update property in memory
        if (prop) {
            prop.ownerEmail = null;
        }
        
        // Update in Firestore
        const propsDoc = await db.collection('settings').doc('properties').get();
        if (propsDoc.exists) {
            const propsData = propsDoc.data();
            if (propsData[propertyId]) {
                propsData[propertyId].ownerEmail = null;
                await db.collection('settings').doc('properties').set(propsData);
            }
        }
        
        // Clear from propertyOwnerEmail mapping if it exists
        if (typeof propertyOwnerEmail !== 'undefined' && propertyOwnerEmail[propertyId]) {
            delete propertyOwnerEmail[propertyId];
        }
        
        // Remove from ownerPropertyMap for the old owner
        if (oldOwnerEmail) {
            const lowerEmail = oldOwnerEmail.toLowerCase();
            if (ownerPropertyMap[lowerEmail]) {
                ownerPropertyMap[lowerEmail] = ownerPropertyMap[lowerEmail].filter(id => id !== propertyId);
            }
        }
        
        console.log(`[Admin] Property ${propertyId} orphaned (owner cleared)`);
        return true;
    } catch (error) {
        console.error(`Error orphaning property ${propertyId}:`, error);
        throw error;
    }
};

// ==================== ADMIN PROPERTY REASSIGNMENT ====================
// Store current property being reassigned
window.reassignPropertyId = null;

window.openReassignModal = async function(propertyId) {
    if (!TierService.isMasterAdmin(auth.currentUser?.email)) {
        alert('Only the owner can reassign properties');
        return;
    }
    
    window.reassignPropertyId = propertyId;
    const prop = properties.find(p => p.id === propertyId);
    
    if (!prop) {
        alert('Property not found');
        return;
    }
    
    // Set property title in modal
    $('reassignPropertyTitle').textContent = prop.title;
    
    // Clear previous state
    hideElement($('reassignError'));
    hideElement($('reassignSuccess'));
    $('reassignBtn').disabled = false;
    $('reassignBtn').textContent = '✓ Reassign Property';
    
    // Load users into dropdown
    const select = $('reassignOwnerSelect');
    select.innerHTML = '<option value="">-- Loading Users --</option>';
    
    try {
        const snapshot = await db.collection('users').get();
        select.innerHTML = '<option value="">-- Select Owner --</option><option value="unassigned">🚫 Unassigned (No Owner)</option>';
        
        snapshot.forEach(doc => {
            const user = doc.data();
            const tierData = TIERS[user.tier] || TIERS.starter;
            const displayName = user.username || user.email.split('@')[0];
            const option = document.createElement('option');
            option.value = user.email;
            option.textContent = `${tierData.icon} ${displayName} (${user.email})`;
            select.appendChild(option);
        });
        
        // Pre-select current owner if exists
        const currentOwnerEmail = prop.ownerEmail || getPropertyOwnerEmail(propertyId);
        if (currentOwnerEmail) {
            select.value = currentOwnerEmail;
        }
        
    } catch (error) {
        console.error('Error loading users:', error);
        select.innerHTML = '<option value="">-- Error Loading Users --</option>';
    }
    
    openModal('reassignModal');
};

window.confirmReassignProperty = async function() {
    const propertyId = window.reassignPropertyId;
    const newOwnerEmail = $('reassignOwnerSelect').value;
    const errorDiv = $('reassignError');
    const successDiv = $('reassignSuccess');
    const btn = $('reassignBtn');
    
    hideElement(errorDiv);
    hideElement(successDiv);
    
    if (!newOwnerEmail) {
        errorDiv.textContent = 'Please select an owner';
        showElement(errorDiv);
        return;
    }
    
    btn.disabled = true;
    btn.textContent = 'Reassigning...';
    
    try {
        const prop = properties.find(p => p.id === propertyId);
        const oldOwnerEmail = prop?.ownerEmail || getPropertyOwnerEmail(propertyId);
        
        // Handle "unassigned" selection
        const actualNewEmail = newOwnerEmail === 'unassigned' ? null : newOwnerEmail.toLowerCase();
        
        // Update property in memory
        if (prop) {
            prop.ownerEmail = actualNewEmail;
        }
        
        // Update in Firestore
        const propsDoc = await db.collection('settings').doc('properties').get();
        if (propsDoc.exists) {
            const propsData = propsDoc.data();
            if (propsData[propertyId]) {
                propsData[propertyId].ownerEmail = actualNewEmail;
                await db.collection('settings').doc('properties').set(propsData);
            }
        }
        
        // Update propertyOwnerEmail mapping
        if (typeof propertyOwnerEmail !== 'undefined') {
            if (actualNewEmail) {
                propertyOwnerEmail[propertyId] = actualNewEmail;
            } else {
                delete propertyOwnerEmail[propertyId];
            }
        }
        
        // Remove from old owner's property list
        if (oldOwnerEmail) {
            const oldLower = oldOwnerEmail.toLowerCase();
            if (ownerPropertyMap[oldLower]) {
                ownerPropertyMap[oldLower] = ownerPropertyMap[oldLower].filter(id => id !== propertyId);
            }
        }
        
        // Add to new owner's property list
        if (actualNewEmail) {
            if (!ownerPropertyMap[actualNewEmail]) {
                ownerPropertyMap[actualNewEmail] = [];
            }
            if (!ownerPropertyMap[actualNewEmail].includes(propertyId)) {
                ownerPropertyMap[actualNewEmail].push(propertyId);
            }
        }
        
        // Clear username cache for this property to force refresh
        if (window.ownerUsernameCache && oldOwnerEmail) {
            delete window.ownerUsernameCache[oldOwnerEmail.toLowerCase()];
        }
        
        console.log(`[Admin] Property ${propertyId} reassigned from ${oldOwnerEmail || 'unassigned'} to ${actualNewEmail || 'unassigned'}`);
        
        successDiv.textContent = '✓ Property reassigned successfully!';
        showElement(successDiv);
        btn.textContent = '✓ Done!';
        btn.classList.remove('from-purple-600', 'to-purple-700');
        btn.classList.add('from-green-600', 'to-green-700');
        
        // Refresh the property detail page after a short delay
        setTimeout(() => {
            closeModal('reassignModal');
            viewProperty(propertyId); // Reload property view
        }, 1500);
        
    } catch (error) {
        console.error('Error reassigning property:', error);
        errorDiv.textContent = 'Error: ' + error.message;
        showElement(errorDiv);
        btn.disabled = false;
        btn.textContent = '✓ Reassign Property';
    }
};

// Helper to get property owner email (check both sources)
function getPropertyOwnerEmail(propertyId) {
    // Check static mapping first
    if (typeof propertyOwnerEmail !== 'undefined' && propertyOwnerEmail[propertyId]) {
        return propertyOwnerEmail[propertyId];
    }
    // Check property object
    const prop = properties.find(p => p.id === propertyId);
    return prop?.ownerEmail || null;
}

// Helper to completely delete a property
window.deletePropertyCompletely = async function(propertyId, ownerEmail) {
    try {
        // Remove from properties array
        const index = properties.findIndex(p => p.id === propertyId);
        if (index !== -1) {
            properties.splice(index, 1);
        }
        
        // Remove from Firestore properties collection
        const propsDoc = await db.collection('settings').doc('properties').get();
        if (propsDoc.exists) {
            const propsData = propsDoc.data();
            if (propsData[propertyId]) {
                delete propsData[propertyId];
                await db.collection('settings').doc('properties').set(propsData);
            }
        }
        
        // Remove availability entry
        const availDoc = await db.collection('settings').doc('propertyAvailability').get();
        if (availDoc.exists) {
            const availData = availDoc.data();
            if (availData[propertyId] !== undefined) {
                delete availData[propertyId];
                await db.collection('settings').doc('propertyAvailability').set(availData);
            }
        }
        
        // Remove from state
        delete state.availability[propertyId];
        
        // Remove from owner map
        if (ownerEmail) {
            const lowerEmail = ownerEmail.toLowerCase();
            if (ownerPropertyMap[lowerEmail]) {
                ownerPropertyMap[lowerEmail] = ownerPropertyMap[lowerEmail].filter(id => id !== propertyId);
            }
        }
        
        console.log(`[Admin] Property ${propertyId} deleted completely`);
        return true;
    } catch (error) {
        console.error(`Error deleting property ${propertyId}:`, error);
        throw error;
    }
};

// Admin Create User Form
document.addEventListener('DOMContentLoaded', function() {
    const form = $('adminCreateUserForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = $('adminNewEmail').value.trim().toLowerCase();
            const email = username + '@pma.network'; // Append domain
            const password = $('adminNewPassword').value;
            const displayName = $('adminNewDisplayName').value.trim();
            const tier = $('adminNewTier').value;
            const errorDiv = $('adminCreateUserError');
            const successDiv = $('adminCreateUserSuccess');
            const btn = $('adminCreateUserBtn');
            
            hideElement(errorDiv);
            hideElement(successDiv);
            
            btn.disabled = true;
            btn.textContent = 'Creating...';
            
            try {
                // Use Firebase Admin SDK workaround - create via secondary auth
                const result = await adminCreateUser(email, password, displayName, tier);
                
                successDiv.innerHTML = `✓ Account created!<br><strong>Username:</strong> ${username}@pma.network<br><strong>Password:</strong> ${password}<br><strong>Tier:</strong> ${tier}`;
                showElement(successDiv);
                
                // Clear form
                $('adminNewEmail').value = '';
                $('adminNewPassword').value = '';
                $('adminNewDisplayName').value = '';
                $('adminNewTier').value = 'starter';
                
                // Refresh users list
                loadAllUsers();
                
            } catch (error) {
                console.error('Error creating user:', error);
                errorDiv.textContent = error.message || 'Failed to create account.';
                showElement(errorDiv);
            } finally {
                btn.disabled = false;
                btn.textContent = '➕ Create Account';
            }
        });
    }
});

window.adminCreateUser = async function(email, password, displayName, tier) {
    let uid;
    
    // Try Cloud Function first (preferred method)
    try {
        const createAuthUser = functions.httpsCallable('createAuthUser');
        const result = await createAuthUser({ 
            email: email, 
            password: password, 
            displayName: displayName 
        });
        uid = result.data.uid;
        console.log('[Admin] User created via Cloud Function:', uid);
    } catch (cfError) {
        console.warn('[Admin] Cloud Function not available, using secondary auth:', cfError.message);
        
        // Fallback: Create a secondary Firebase Auth instance
        const secondaryApp = firebase.apps.find(app => app.name === 'Secondary') || 
            firebase.initializeApp(firebase.app().options, 'Secondary');
        const secondaryAuth = secondaryApp.auth();
        
        try {
            const userCredential = await secondaryAuth.createUserWithEmailAndPassword(email, password);
            uid = userCredential.user.uid;
            await secondaryAuth.signOut();
            console.log('[Admin] User created via secondary auth:', uid);
        } catch (authError) {
            try { await secondaryAuth.signOut(); } catch(e) {}
            throw authError;
        }
    }
    
    // Create user document in Firestore
    await db.collection('users').doc(uid).set({
        email: email.toLowerCase(),
        username: displayName,
        tier: tier,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: auth.currentUser?.email || 'admin'
    });
    
    // Log to upgrade history if not starter
    if (tier !== 'starter') {
        await db.collection('upgradeHistory').add({
            userEmail: email.toLowerCase(),
            previousTier: 'starter',
            newTier: tier,
            upgradedAt: firebase.firestore.FieldValue.serverTimestamp(),
            upgradedBy: auth.currentUser?.email || 'admin',
            paymentNote: 'Account created by admin',
            price: tier === 'pro' ? 25000 : (tier === 'elite' ? 50000 : 0)
        });
    }
    
    return { uid: uid, email: email };
};

window.generateRandomPassword = function() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    $('adminNewPassword').value = password;
};

window.loadUpgradeHistory = async function() {
    const container = $('upgradeHistoryList');
    if (!container) return;
    
    container.innerHTML = '<p class="text-gray-500 italic">Loading history...</p>';
    
    // Check if current user is the master owner (not just any admin)
    const isMasterOwner = auth.currentUser?.email === 'richard2019201900@gmail.com';
    
    try {
        const history = await TierService.getUpgradeHistory();
        
        if (history.length === 0) {
            container.innerHTML = '<p class="text-gray-500 italic">No upgrade history found.</p>';
            return;
        }
        
        container.innerHTML = history.map(entry => {
            const prevTierData = TIERS[entry.previousTier] || TIERS.starter;
            const date = entry.upgradedAt?.toDate ? entry.upgradedAt.toDate().toLocaleString() : 'Unknown';
            const isDenial = entry.type === 'denial' || entry.newTier?.startsWith('DENIED:');
            
            // Handle denial entries differently
            let newTierDisplay;
            let priceDisplay;
            let borderColor = 'border-gray-700';
            
            if (isDenial) {
                const requestedTier = entry.newTier?.replace('DENIED: ', '') || 'unknown';
                const requestedTierData = TIERS[requestedTier] || { icon: '❓', name: requestedTier, color: 'text-gray-400' };
                newTierDisplay = `<span class="px-2 py-1 rounded bg-red-900/50 text-red-400">❌ Denied ${requestedTierData.icon} ${requestedTierData.name}</span>`;
                priceDisplay = '<span class="text-red-400 font-bold">$0</span>';
                borderColor = 'border-red-700/50';
            } else {
                const newTierData = TIERS[entry.newTier] || TIERS.starter;
                newTierDisplay = `<span class="px-2 py-1 rounded bg-gray-700 ${newTierData.color}">${newTierData.icon} ${newTierData.name}</span>`;
                priceDisplay = entry.price ? `<span class="text-green-400 font-bold">$${entry.price.toLocaleString()}</span>` : '<span class="text-gray-500">-</span>';
            }
            
            // Only master owner can delete history entries
            const deleteBtn = isMasterOwner ? `
                <button onclick="deleteUpgradeHistory('${entry.id}')" 
                    class="ml-2 text-red-400 hover:text-red-300 text-xs opacity-50 hover:opacity-100 transition"
                    title="Delete this entry">
                    🗑️
                </button>
            ` : '';
            
            return `
                <div id="history-${entry.id}" class="bg-gray-800 rounded-xl p-4 border ${borderColor}">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="text-white font-bold">${entry.userEmail}</span>
                            </div>
                            <div class="flex flex-wrap items-center gap-2 text-sm">
                                <span class="px-2 py-1 rounded bg-gray-700 ${prevTierData.color}">${prevTierData.icon} ${prevTierData.name}</span>
                                <span class="text-gray-500">→</span>
                                ${newTierDisplay}
                                ${priceDisplay}
                            </div>
                            ${entry.paymentNote ? `<p class="text-gray-400 text-sm mt-1 italic">${entry.paymentNote}</p>` : ''}
                        </div>
                        <div class="text-right text-sm flex items-start gap-2">
                            <div>
                                <div class="text-gray-400">${date}</div>
                                <div class="text-gray-500 text-xs">by ${entry.upgradedBy || 'system'}</div>
                            </div>
                            ${deleteBtn}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading upgrade history:', error);
        container.innerHTML = '<p class="text-red-400">Error loading history.</p>';
    }
};

// Delete upgrade history entry (master owner only)
window.deleteUpgradeHistory = async function(entryId) {
    // Double-check permission
    if (auth.currentUser?.email !== 'richard2019201900@gmail.com') {
        alert('Only the master owner can delete history entries.');
        return;
    }
    
    if (!confirm('Delete this upgrade history entry? This cannot be undone.')) {
        return;
    }
    
    try {
        await db.collection('upgradeHistory').doc(entryId).delete();
        
        // Remove from UI with animation
        const entryEl = $(`history-${entryId}`);
        if (entryEl) {
            entryEl.style.transition = 'all 0.3s ease';
            entryEl.style.opacity = '0';
            entryEl.style.transform = 'translateX(20px)';
            setTimeout(() => entryEl.remove(), 300);
        }
        
        console.log('[Admin] Deleted upgrade history entry:', entryId);
    } catch (error) {
        console.error('Error deleting history entry:', error);
        alert('Error deleting entry: ' + error.message);
    }
};

window.adminUpgradeUser = async function(email, newTier, currentTier) {
    const tierData = TIERS[newTier];
    const price = newTier === 'pro' ? '$25,000' : '$50,000';
    
    const paymentNote = prompt(`Upgrading ${email} to ${tierData.name} (${price}/month)\n\nEnter payment confirmation or notes:`);
    if (paymentNote === null) return;
    
    try {
        await TierService.setUserTier(email, newTier, currentTier, paymentNote);
        
        // Also set the subscription last paid date to today
        const snapshot = await db.collection('users').where('email', '==', email).get();
        if (!snapshot.empty) {
            const userId = snapshot.docs[0].id;
            const today = new Date().toISOString().split('T')[0];
            await db.collection('users').doc(userId).update({
                subscriptionLastPaid: today,
                subscriptionUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log(`[Subscription] Set initial payment date for ${email}: ${today}`);
        }
        
        alert(`✓ ${email} upgraded to ${tierData.name}!\n\nSubscription payment date set to today.`);
        loadAllUsers();
    } catch (error) {
        console.error('Error upgrading user:', error);
        alert('Error upgrading user: ' + error.message);
    }
};

window.adminDowngradeUser = async function(email, currentTier) {
    if (!confirm(`Are you sure you want to reset ${email} to Starter tier?\n\nThis will also clear their subscription payment history.`)) return;
    
    const reason = prompt('Reason for downgrade (optional):');
    if (reason === null) return;
    
    try {
        await TierService.setUserTier(email, 'starter', currentTier, `Downgraded: ${reason || 'No reason given'}`);
        
        // Clear subscription data when downgrading
        const snapshot = await db.collection('users').where('email', '==', email).get();
        if (!snapshot.empty) {
            const userId = snapshot.docs[0].id;
            await db.collection('users').doc(userId).update({
                subscriptionLastPaid: '',
                subscriptionUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        alert(`${email} reset to Starter tier.`);
        loadAllUsers();
    } catch (error) {
        console.error('Error downgrading user:', error);
        alert('Error: ' + error.message);
    }
};

// Admin Tools Functions
window.copyBulkEmailList = function() {
    const emails = window.adminUsersData.map(u => u.email).join(', ');
    navigator.clipboard.writeText(emails).then(() => {
        alert(`Copied ${window.adminUsersData.length} emails to clipboard!`);
    });
};

window.exportUsersCSV = function() {
    const headers = ['Email', 'Display Name', 'Tier', 'Created', 'Listings'];
    const rows = window.adminUsersData.map(u => {
        const listingCount = (ownerPropertyMap[u.email?.toLowerCase()] || []).length;
        const created = u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'Unknown';
        return [u.email, u.username || '', u.tier, created, listingCount];
    });
    
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    downloadFile('users.csv', csv, 'text/csv');
};

window.exportListingsCSV = function() {
    const headers = ['Title', 'Location', 'Type', 'Owner Email', 'Weekly', 'Monthly', 'Available'];
    const rows = properties.map(p => {
        return [p.title, p.location, p.type, p.owner || '', p.weekly || '', p.monthly || '', p.available ? 'Yes' : 'No'];
    });
    
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    downloadFile('listings.csv', csv, 'text/csv');
};

window.downloadFile = function(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

window.findUserByProperty = function() {
    const searchTerm = ($('adminFindByProperty')?.value || '').toLowerCase();
    const resultDiv = $('adminFindResult');
    
    if (!searchTerm) {
        resultDiv.innerHTML = '<span class="text-yellow-400">Enter a property name or address.</span>';
        return;
    }
    
    const found = properties.find(p => 
        p.title.toLowerCase().includes(searchTerm) || 
        (p.location || '').toLowerCase().includes(searchTerm)
    );
    
    if (found) {
        resultDiv.innerHTML = `<span class="text-green-400">Found: <strong>${found.title}</strong><br>Owner: ${found.owner || 'Unknown'}</span>`;
    } else {
        resultDiv.innerHTML = '<span class="text-red-400">No property found matching that search.</span>';
    }
};

window.cleanupOrphanedListings = async function() {
    if (!confirm('This will identify listings with invalid or missing owners. Continue?')) return;
    
    const orphaned = properties.filter(p => {
        if (!p.owner) return true;
        const user = window.adminUsersData.find(u => u.email.toLowerCase() === p.owner.toLowerCase());
        return !user;
    });
    
    if (orphaned.length === 0) {
        alert('No orphaned listings found. All properties have valid owners.');
    } else {
        const list = orphaned.map(p => `• ${p.title} (owner: ${p.owner || 'none'})`).join('\n');
        alert(`Found ${orphaned.length} orphaned listings:\n\n${list}\n\nYou can manually reassign these from the property pages.`);
    }
};

// ==================== CREATE LISTING ====================
window.openCreateListingModal = async function() {
    hideElement($('mobileMenu'));
    
    // Check tier limits before opening
    const user = auth.currentUser;
    if (!user) {
        alert('Please sign in to create a listing.');
        return;
    }
    
    // Check profile completion first (skip for master owner)
    if (!TierService.isMasterAdmin(user.email) && !window.isProfileComplete) {
        showProfileCompletionOverlay();
        return;
    }
    
    const { canCreate, reason, tierInfo } = await TierService.canCreateListing(user.email);
    
    if (!canCreate) {
        // Show upgrade modal instead
        openUpgradeModal(reason, tierInfo.tier);
        return;
    }
    
    // Reset form
    const form = $('createListingForm');
    if (form) form.reset();
    
    // Explicitly clear all input values to prevent browser autocomplete
    const inputs = ['newListingTitle', 'newListingLocation', 'newListingBedrooms', 
                    'newListingBathrooms', 'newListingStorage', 'newListingWeekly', 
                    'newListingMonthly', 'newListingImages'];
    inputs.forEach(id => {
        const el = $(id);
        if (el) el.value = '';
    });
    
    // Reset selects to first option
    const typeSelect = $('newListingType');
    if (typeSelect) typeSelect.selectedIndex = 0;
    const interiorSelect = $('newListingInterior');
    if (interiorSelect) interiorSelect.selectedIndex = 0;
    
    // Reset buttons to initial state
    const createBtn = $('createListingBtn');
    if (createBtn) {
        createBtn.disabled = false;
        createBtn.textContent = '🏠 Create Listing';
    }
    const cancelBtn = $('cancelListingBtn');
    if (cancelBtn) showElement(cancelBtn);
    
    hideElement($('createListingError'));
    hideElement($('createListingSuccess'));
    openModal('createListingModal');
};

// Handle create listing form submission
document.addEventListener('DOMContentLoaded', function() {
    const createForm = $('createListingForm');
    if (createForm) {
        createForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const errorDiv = $('createListingError');
            const successDiv = $('createListingSuccess');
            const btn = $('createListingBtn');
            
            hideElement(errorDiv);
            hideElement(successDiv);
            
            // Get form values
            const title = $('newListingTitle').value.trim();
            const type = $('newListingType').value;
            const location = $('newListingLocation').value.trim();
            const bedrooms = parseInt($('newListingBedrooms').value);
            const bathrooms = parseInt($('newListingBathrooms').value);
            const storage = parseInt($('newListingStorage').value) || 600;
            const interiorType = $('newListingInterior').value;
            const weeklyPrice = parseInt($('newListingWeekly').value);
            const monthlyPrice = parseInt($('newListingMonthly').value);
            const imagesText = $('newListingImages').value.trim();
            
            // Debug logging
            console.log('[CreateListing] Form values:', {
                title, type, location, bedrooms, bathrooms, storage, 
                interiorType, weeklyPrice, monthlyPrice
            });
            
            // Parse images
            const images = imagesText 
                ? imagesText.split('\n').map(url => url.trim()).filter(url => url)
                : ['images/placeholder.jpg'];
            
            // Validate
            if (!title || !type || !location || !bedrooms || !bathrooms || !weeklyPrice || !monthlyPrice) {
                errorDiv.textContent = 'Please fill in all required fields.';
                showElement(errorDiv);
                return;
            }
            
            btn.disabled = true;
            btn.textContent = 'Creating...';
            
            // Hide cancel button immediately to prevent accidental clicks
            const cancelBtn = $('cancelListingBtn');
            if (cancelBtn) hideElement(cancelBtn);
            
            try {
                // Generate new ID (find max ID + 1)
                const maxId = properties.reduce((max, p) => Math.max(max, p.id), 0);
                const newId = maxId + 1;
                
                // Get owner email first (lowercase for consistency)
                const ownerEmail = (auth.currentUser?.email || 'richard2019201900@gmail.com').toLowerCase();
                
                // Create new property object
                const newProperty = {
                    id: newId,
                    title: title,
                    type: type,
                    location: location,
                    bedrooms: bedrooms,
                    bathrooms: bathrooms,
                    storage: storage,
                    interiorType: interiorType,
                    weeklyPrice: weeklyPrice,
                    monthlyPrice: monthlyPrice,
                    images: images,
                    videoUrl: null,
                    features: false,
                    ownerEmail: ownerEmail // Store owner email in property
                };
                
                // CRITICAL: Clear any stale property overrides for this ID FIRST
                // This must happen BEFORE adding to local state or saving to Firestore
                console.log('[CreateListing] Clearing overrides for property', newId);
                console.log('[CreateListing] Current state.propertyOverrides[' + newId + ']:', state.propertyOverrides[newId]);
                delete state.propertyOverrides[newId];
                
                // Get all fields that need to be deleted (all possible override fields)
                const overrideFields = ['bedrooms', 'bathrooms', 'storage', 'weeklyPrice', 'monthlyPrice', 
                                       'interiorType', 'renterName', 'renterPhone', 'renterNotes',
                                       'lastPaymentDate', 'paymentFrequency', 'title', 'location', 
                                       'type', 'customReminderScript', 'ownerName', 'ownerPhone',
                                       'updatedAt', 'updatedBy'];
                const deleteUpdates = {};
                overrideFields.forEach(field => {
                    deleteUpdates[`${newId}.${field}`] = firebase.firestore.FieldValue.delete();
                });
                
                console.log('[CreateListing] Deleting these fields from Firestore:', Object.keys(deleteUpdates));
                await db.collection('settings').doc('propertyOverrides').update(deleteUpdates).catch(err => {
                    // Ignore if fields don't exist
                    console.log('[CreateListing] No stale overrides to clean up for property', newId, err?.message);
                });
                console.log('[CreateListing] Override cleanup complete');
                
                // NOW add to local properties array (after cleanup)
                properties.push(newProperty);
                
                // Add to owner map
                if (!ownerPropertyMap[ownerEmail]) {
                    ownerPropertyMap[ownerEmail] = [];
                }
                ownerPropertyMap[ownerEmail].push(newId);
                propertyOwnerEmail[newId] = ownerEmail;
                
                // Set availability to true
                state.availability[newId] = true;
                await db.collection('settings').doc('propertyAvailability').set({ [newId]: true }, { merge: true });
                
                // Save property to Firestore
                await db.collection('settings').doc('properties').set({
                    [newId]: newProperty
                }, { merge: true });
                
                // Save owner property map to Firestore
                await db.collection('settings').doc('ownerPropertyMap').set({
                    [ownerEmail]: ownerPropertyMap[ownerEmail]
                }, { merge: true });
                
                // Update filtered properties
                state.filteredProperties = [...properties];
                
                // Re-render
                renderProperties(state.filteredProperties);
                renderOwnerDashboard();
                
                // Update tier badge to reflect new listing count
                updateTierBadge(state.userTier || 'starter', ownerEmail);
                
                successDiv.textContent = '✓ Listing created successfully!';
                showElement(successDiv);
                
                // Change button to show success
                btn.textContent = '✓ Created!';
                btn.classList.remove('from-amber-500', 'to-yellow-500');
                btn.classList.add('from-green-500', 'to-emerald-500');
                
                // Close modal after delay
                setTimeout(() => {
                    closeModal('createListingModal');
                    goToDashboard();
                    // Reset button state for next time
                    btn.disabled = false;
                    btn.textContent = '🏠 Create Listing';
                    btn.classList.remove('from-green-500', 'to-emerald-500');
                    btn.classList.add('from-amber-500', 'to-yellow-500');
                }, 1500);
                
            } catch (error) {
                console.error('Error creating listing:', error);
                errorDiv.textContent = 'Failed to create listing. Please try again.';
                showElement(errorDiv);
                // Show cancel button again on error
                const cancelBtn = $('cancelListingBtn');
                if (cancelBtn) showElement(cancelBtn);
                // Reset button on error
                btn.disabled = false;
                btn.textContent = '🏠 Create Listing';
            }
        });
    }
});

// ==================== DELETE PROPERTY ====================
window.confirmDeleteProperty = function(propertyId, propertyTitle) {
    // Store the property info for deletion
    window.pendingDeleteProperty = { id: propertyId, title: propertyTitle };
    
    // Update modal content
    $('deletePropertyName').textContent = propertyTitle;
    
    // Show the modal
    openModal('deleteConfirmModal');
};

window.cancelDelete = function() {
    window.pendingDeleteProperty = null;
    closeModal('deleteConfirmModal');
};

window.executeDeleteProperty = async function() {
    if (!window.pendingDeleteProperty) return;
    
    const propertyId = window.pendingDeleteProperty.id;
    const btn = $('confirmDeleteBtn');
    
    btn.disabled = true;
    btn.textContent = 'Deleting...';
    
    try {
        // Remove from local properties array
        const propIndex = properties.findIndex(p => p.id === propertyId);
        if (propIndex !== -1) {
            properties.splice(propIndex, 1);
        }
        
        // Remove from owner map
        const ownerEmail = (auth.currentUser?.email || '').toLowerCase();
        if (ownerPropertyMap[ownerEmail]) {
            const idx = ownerPropertyMap[ownerEmail].indexOf(propertyId);
            if (idx !== -1) {
                ownerPropertyMap[ownerEmail].splice(idx, 1);
            }
        }
        delete propertyOwnerEmail[propertyId];
        
        // Remove from availability
        delete state.availability[propertyId];
        
        // Remove from local propertyOverrides
        delete state.propertyOverrides[propertyId];
        
        // Remove from Firestore - properties doc
        await db.collection('settings').doc('properties').update({
            [propertyId]: firebase.firestore.FieldValue.delete()
        });
        
        // Update owner map in Firestore
        await db.collection('settings').doc('ownerPropertyMap').set({
            [ownerEmail]: ownerPropertyMap[ownerEmail]
        }, { merge: true });
        
        // Remove availability
        await db.collection('settings').doc('propertyAvailability').update({
            [propertyId]: firebase.firestore.FieldValue.delete()
        });
        
        // CRITICAL: Remove propertyOverrides for this property
        // The overrides are stored in flat format: "15.bedrooms", "15.storage", etc.
        const overrideFields = ['bedrooms', 'bathrooms', 'storage', 'weeklyPrice', 'monthlyPrice', 
                               'interiorType', 'renterName', 'renterPhone', 'renterNotes',
                               'lastPaymentDate', 'paymentFrequency', 'title', 'location',
                               'type', 'customReminderScript', 'ownerName', 'ownerPhone',
                               'updatedAt', 'updatedBy'];
        const deleteUpdates = {};
        overrideFields.forEach(field => {
            deleteUpdates[`${propertyId}.${field}`] = firebase.firestore.FieldValue.delete();
        });
        
        await db.collection('settings').doc('propertyOverrides').update(deleteUpdates).catch(err => {
            // Ignore if fields don't exist
            console.log('[Delete] No overrides to clean up for property', propertyId);
        });
        
        // Update filtered properties
        state.filteredProperties = [...properties];
        
        // Re-render
        renderProperties(state.filteredProperties);
        renderOwnerDashboard();
        
        // Update tier badge to reflect new listing count
        const currentEmail = (auth.currentUser?.email || '').toLowerCase();
        updateTierBadge(state.userTier || 'starter', currentEmail);
        
        // Close modal and go to dashboard
        closeModal('deleteConfirmModal');
        window.pendingDeleteProperty = null;
        
        // If we're on the stats page for this property, go back to dashboard
        if (state.currentPropertyId === propertyId) {
            goToDashboard();
        }
        
    } catch (error) {
        console.error('Error deleting property:', error);
        alert('Failed to delete property. Please try again.');
    } finally {
        btn.disabled = false;
        btn.textContent = '🗑️ Yes, Delete';
    }
};

// ==================== COPY DASHBOARD REMINDER ====================
window.copyDashboardReminder = function(propertyId, btn) {
    const reminderText = window.dashboardReminders && window.dashboardReminders[propertyId];
    if (!reminderText) {
        alert('No reminder text found.');
        return;
    }
    
    const originalHtml = btn.innerHTML;
    
    navigator.clipboard.writeText(reminderText).then(() => {
        // Show success feedback
        btn.innerHTML = `
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            ✓ Copied!
        `;
        btn.classList.remove('from-blue-500', 'to-blue-600');
        btn.classList.add('from-green-500', 'to-emerald-500');
        
        setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.classList.remove('from-green-500', 'to-emerald-500');
            btn.classList.add('from-blue-500', 'to-blue-600');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = reminderText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            btn.innerHTML = `
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                ✓ Copied!
            `;
            btn.classList.remove('from-blue-500', 'to-blue-600');
            btn.classList.add('from-green-500', 'to-emerald-500');
            setTimeout(() => {
                btn.innerHTML = originalHtml;
                btn.classList.remove('from-green-500', 'to-emerald-500');
                btn.classList.add('from-blue-500', 'to-blue-600');
            }, 2000);
        } catch (e) {
            alert('Failed to copy. Please copy manually.');
        }
        document.body.removeChild(textArea);
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
                if (snapshot.empty) {
                    hideElement(banner);
                    container.innerHTML = '';
                    return;
                }
                
                const notifications = [];
                snapshot.forEach(doc => {
                    notifications.push({ id: doc.id, ...doc.data() });
                });
                
                // Check for upgrade-related notifications to refresh pending status
                const hasUpgradeNotification = notifications.some(n => 
                    n.type === 'upgrade_approved' || n.type === 'upgrade_denied'
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
                    const isApproval = notif.type === 'upgrade_approved';
                    const bgColor = isApproval ? 'from-green-600/20 to-emerald-600/20' : 'from-red-600/20 to-orange-600/20';
                    const borderColor = isApproval ? 'border-green-500/50' : 'border-red-500/50';
                    const icon = isApproval ? '🎉' : '❌';
                    
                    return `
                        <div id="notif-${notif.id}" class="bg-gradient-to-r ${bgColor} border ${borderColor} rounded-xl p-4 flex items-start justify-between gap-4">
                            <div class="flex items-start gap-3">
                                <span class="text-2xl">${icon}</span>
                                <div>
                                    <h4 class="text-white font-bold">${notif.title}</h4>
                                    <p class="text-gray-300 text-sm mt-1">${notif.message}</p>
                                    ${notif.createdAt?.toDate ? `<p class="text-gray-500 text-xs mt-2">${notif.createdAt.toDate().toLocaleString()}</p>` : ''}
                                </div>
                            </div>
                            <button onclick="dismissNotification('${notif.id}')" 
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
                console.log('Notification listener error (may need Firestore rules):', error.message);
                hideElement(banner);
            });
        
    } catch (error) {
        console.error('Error setting up user notifications:', error);
        hideElement(banner);
    }
};

window.dismissNotification = async function(notificationId) {
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
        console.error('Error dismissing notification:', error);
    }
};

// ==================== USER TIER REAL-TIME SYNC ====================
window.userTierUnsubscribe = null;

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
            .onSnapshot((doc) => {
                if (!doc.exists) {
                    // User document was deleted - force logout
                    console.log('[UserSync] User document deleted - forcing logout');
                    forceLogout();
                    return;
                }
                
                const data = doc.data();
                const newTier = data.tier || 'starter';
                
                // Check if tier changed
                if (state.userTier && state.userTier !== newTier) {
                    console.log('[TierSync] Tier changed from', state.userTier, 'to', newTier);
                    
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
                console.log('User tier listener error:', error.message);
                // If permission denied, user may have been deleted
                if (error.code === 'permission-denied') {
                    console.log('[UserSync] Permission denied - user may have been deleted');
                    forceLogout();
                }
            });
    } catch (error) {
        console.error('Error setting up tier listener:', error);
    }
};

// Update navbar tier display
window.updateNavTierDisplay = function(tier) {
    const navTierEl = $('navUserTier');
    if (!navTierEl) return;
    
    const tierData = TIERS[tier] || TIERS.starter;
    navTierEl.innerHTML = `${tierData.icon} ${tierData.name}`;
    
    // Update color classes
    navTierEl.className = 'text-xs';
    if (tier === 'pro') {
        navTierEl.classList.add('text-yellow-400');
    } else if (tier === 'elite') {
        navTierEl.classList.add('text-purple-400');
    } else {
        navTierEl.classList.add('text-gray-400');
    }
};
