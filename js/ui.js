// ==================== TOAST NOTIFICATIONS ====================
window.showToast = function(message, type = 'info') {
    const bgColors = {
        success: 'from-green-600 to-emerald-600',
        error: 'from-red-600 to-pink-600',
        info: 'from-blue-600 to-cyan-600',
        warning: 'from-yellow-600 to-orange-600'
    };
    
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠'
    };
    
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 bg-gradient-to-r ${bgColors[type] || bgColors.info} text-white px-6 py-3 rounded-xl shadow-2xl font-bold flex items-center gap-2 animate-pulse`;
    toast.innerHTML = `<span class="text-lg">${icons[type] || icons.info}</span> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transition = 'opacity 0.3s';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// ==================== PRICING TIERS RENDERER ====================
// Renders all pricing options with discount badges for property cards
window.renderPricingTiers = function(p, isPremium) {
    const dailyPrice = PropertyDataService.getValue(p.id, 'dailyPrice', p.dailyPrice || 0);
    const weeklyPrice = PropertyDataService.getValue(p.id, 'weeklyPrice', p.weeklyPrice || 0);
    const biweeklyPrice = PropertyDataService.getValue(p.id, 'biweeklyPrice', p.biweeklyPrice || 0);
    const monthlyPrice = PropertyDataService.getValue(p.id, 'monthlyPrice', p.monthlyPrice || 0);
    const buyPrice = PropertyDataService.getValue(p.id, 'buyPrice', p.buyPrice || 0);
    
    // Calculate discounts based on daily rate (or weekly/7 if no daily)
    const baseDaily = dailyPrice > 0 ? dailyPrice : Math.round(weeklyPrice / 7);
    
    const calcDiscount = (actualPrice, equivalentDays) => {
        if (baseDaily <= 0 || actualPrice <= 0) return 0;
        const fullPrice = baseDaily * equivalentDays;
        const discount = Math.round(((fullPrice - actualPrice) / fullPrice) * 100);
        return discount > 0 ? discount : 0;
    };
    
    const weeklyDiscount = calcDiscount(weeklyPrice, 7);
    const biweeklyDiscount = calcDiscount(biweeklyPrice, 14);
    const monthlyDiscount = calcDiscount(monthlyPrice, 30);
    
    let html = '<div class="space-y-1.5 mb-3">';
    
    // Daily
    if (dailyPrice > 0) {
        html += '<div class="flex items-center justify-between text-xs">';
        html += '<span class="text-gray-400">Daily:</span>';
        html += '<span class="text-cyan-400 font-bold">$' + dailyPrice.toLocaleString() + '</span>';
        html += '</div>';
    }
    
    // Weekly
    if (weeklyPrice > 0) {
        html += '<div class="flex items-center justify-between text-xs">';
        html += '<span class="text-gray-400">Weekly:</span>';
        html += '<div class="flex items-center gap-1.5">';
        if (weeklyDiscount > 0) {
            html += '<span class="bg-blue-500/20 text-blue-400 text-[10px] px-1.5 py-0.5 rounded font-bold">-' + weeklyDiscount + '%</span>';
        }
        html += '<span class="text-blue-400 font-bold">$' + weeklyPrice.toLocaleString() + '</span>';
        html += '</div></div>';
    }
    
    // Biweekly
    if (biweeklyPrice > 0) {
        html += '<div class="flex items-center justify-between text-xs">';
        html += '<span class="text-gray-400">Biweekly:</span>';
        html += '<div class="flex items-center gap-1.5">';
        if (biweeklyDiscount > 0) {
            html += '<span class="bg-purple-500/20 text-purple-400 text-[10px] px-1.5 py-0.5 rounded font-bold">-' + biweeklyDiscount + '%</span>';
        }
        html += '<span class="text-purple-400 font-bold">$' + biweeklyPrice.toLocaleString() + '</span>';
        html += '</div></div>';
    }
    
    // Monthly (featured - larger)
    if (monthlyPrice > 0) {
        html += '<div class="flex items-center justify-between">';
        html += '<span class="text-gray-400 text-xs">Monthly:</span>';
        html += '<div class="flex items-center gap-1.5">';
        if (monthlyDiscount > 0) {
            html += '<span class="bg-green-500/20 text-green-400 text-[10px] px-1.5 py-0.5 rounded font-bold">-' + monthlyDiscount + '%</span>';
        }
        const monthlyColor = isPremium ? 'text-amber-400' : 'text-green-400';
        html += '<span class="' + monthlyColor + ' font-black text-lg">$' + monthlyPrice.toLocaleString() + '</span>';
        html += '</div></div>';
    } else if (weeklyPrice > 0) {
        // Estimate monthly if not set
        const estimatedMonthly = Math.round(weeklyPrice * 3.5);
        html += '<div class="flex items-center justify-between">';
        html += '<span class="text-gray-400 text-xs">Monthly:</span>';
        const monthlyColor = isPremium ? 'text-amber-400' : 'text-green-400';
        html += '<span class="' + monthlyColor + ' font-black text-lg">~$' + estimatedMonthly.toLocaleString() + '</span>';
        html += '</div>';
    }
    
    // Buy Price
    if (buyPrice > 0) {
        html += '<div class="flex items-center justify-between border-t border-gray-700 pt-1.5 mt-1.5">';
        html += '<span class="text-amber-400 text-xs font-semibold">🏠 Own It:</span>';
        html += '<span class="text-amber-400 font-black text-lg">$' + buyPrice.toLocaleString() + '</span>';
        html += '</div>';
    }
    
    html += '</div>';
    return html;
};

// ==================== PRICE WARNING SYSTEM ====================
// Check if biweekly/monthly prices are suspiciously low
window.checkPriceWarning = function(weeklyEl, biweeklyEl, monthlyEl, warningEl) {
    // Handle both element IDs and elements directly
    // If called without arguments (from create listing form oninput), use default form IDs
    const weekly = weeklyEl ? (typeof weeklyEl === 'string' ? $(weeklyEl) : weeklyEl) : $('newListingWeekly');
    const biweekly = biweeklyEl ? (typeof biweeklyEl === 'string' ? $(biweeklyEl) : biweeklyEl) : $('newListingBiweekly');
    const monthly = monthlyEl ? (typeof monthlyEl === 'string' ? $(monthlyEl) : monthlyEl) : $('newListingMonthly');
    const warning = warningEl ? (typeof warningEl === 'string' ? $(warningEl) : warningEl) : $('priceWarning');
    
    if (!weekly || !warning) return;
    
    const weeklyVal = parseInt(weekly.value) || 0;
    const biweeklyVal = parseInt(biweekly?.value) || 0;
    const monthlyVal = parseInt(monthly?.value) || 0;
    
    let hasIssue = false;
    let suggestions = [];
    
    // Check if there are pricing issues
    if (biweeklyVal > 0 && biweeklyVal < weeklyVal) {
        hasIssue = true;
    }
    if (monthlyVal > 0 && (monthlyVal < weeklyVal || (biweeklyVal > 0 && monthlyVal < biweeklyVal))) {
        hasIssue = true;
    }
    
    // Generate suggested prices (longer terms = slight discount)
    if (hasIssue && weeklyVal > 0) {
        const suggestedBiweekly = Math.round(weeklyVal * 1.8 / 1000) * 1000; // ~10% discount vs 2x weekly
        const suggestedMonthly = Math.round(weeklyVal * 3.5 / 1000) * 1000;  // ~12% discount vs 4x weekly
        suggestions.push(`Weekly: $${weeklyVal.toLocaleString()}`);
        if (biweeklyVal > 0) suggestions.push(`Biweekly: $${suggestedBiweekly.toLocaleString()}`);
        if (monthlyVal > 0) suggestions.push(`Monthly: $${suggestedMonthly.toLocaleString()}`);
    }
    
    const warningText = $('priceWarningText') || warning.querySelector('p:last-child');
    
    if (hasIssue) {
        if (warningText) {
            warningText.textContent = 'Longer terms should cost more. Try: ' + suggestions.join(', ');
        }
        showElement(warning);
    } else {
        hideElement(warning);
    }
    
    return !hasIssue;
};

// Generic price warning check for any set of inputs (used in stats page edits)
window.validatePriceLogic = function(weekly, biweekly, monthly) {
    const warnings = [];
    
    if (biweekly > 0 && biweekly < weekly) {
        warnings.push(`Biweekly ($${biweekly.toLocaleString()}) < Weekly ($${weekly.toLocaleString()})`);
    }
    
    if (monthly > 0) {
        if (monthly < weekly) {
            warnings.push(`Monthly ($${monthly.toLocaleString()}) < Weekly ($${weekly.toLocaleString()})`);
        }
        if (biweekly > 0 && monthly < biweekly) {
            warnings.push(`Monthly ($${monthly.toLocaleString()}) < Biweekly ($${biweekly.toLocaleString()})`);
        }
    }
    
    return warnings;
};

// Show price warning modal (for stats page edits)
window.showPriceWarningModal = function(warnings, onConfirm, onCancel) {
    const modalHTML = `
        <div id="priceWarningModal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div class="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-orange-500">
                <div class="text-center mb-4">
                    <span class="text-5xl">⚠️</span>
                    <h3 class="text-xl font-bold text-orange-400 mt-2">Unusual Pricing Detected</h3>
                </div>
                
                <div class="bg-orange-900/30 border border-orange-600/50 rounded-xl p-4 mb-4">
                    <p class="text-orange-200 text-sm mb-2">The following pricing seems unusual:</p>
                    <ul class="text-orange-300 text-sm space-y-1">
                        ${warnings.map(w => `<li>• ${w}</li>`).join('')}
                    </ul>
                    <p class="text-orange-200/70 text-xs mt-3">Usually, longer rental terms (biweekly, monthly) cost more, not less.</p>
                </div>
                
                <div class="flex gap-3">
                    <button onclick="closePriceWarningModal(true)" 
                            class="flex-1 bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-500 transition">
                        Save Anyway
                    </button>
                    <button onclick="closePriceWarningModal(false)" 
                            class="flex-1 bg-gray-700 text-white py-3 rounded-xl font-bold hover:bg-gray-600 transition">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Store callbacks
    window._priceWarningConfirm = onConfirm;
    window._priceWarningCancel = onCancel;
    
    // Remove existing modal if any
    const existing = $('priceWarningModal');
    if (existing) existing.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

window.closePriceWarningModal = function(confirmed) {
    const modal = $('priceWarningModal');
    if (modal) modal.remove();
    
    if (confirmed && window._priceWarningConfirm) {
        window._priceWarningConfirm();
    } else if (!confirmed && window._priceWarningCancel) {
        window._priceWarningCancel();
    }
    
    window._priceWarningConfirm = null;
    window._priceWarningCancel = null;
};

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
    const navUpgradeOption = $('navUpgradeOption');
    
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
            // Hide upgrade option for Owner
            if (navUpgradeOption) navUpgradeOption.classList.add('hidden');
        } else {
            const tier = data.tier || 'starter';
            const tierData = TIERS[tier] || TIERS.starter;
            
            navUserName.textContent = username;
            navUserTier.innerHTML = `${tierData.icon} ${tierData.name}`;
            navUserTier.className = `text-xs ${tierData.color}`;
            
            // Hide upgrade option for Elite users
            if (navUpgradeOption) {
                if (tier === 'elite') {
                    navUpgradeOption.classList.add('hidden');
                } else {
                    navUpgradeOption.classList.remove('hidden');
                }
            }
        }
    } catch (error) {
        console.error('Error updating nav user display:', error);
        navUserName.textContent = user.email.split('@')[0];
        navUserTier.textContent = '🌱 Starter';
    }
}

window.updateNavUserDisplay = updateNavUserDisplay;

// User dropdown menu functions
window.toggleUserDropdown = function() {
    const dropdown = $('userDropdownMenu');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
};

window.closeUserDropdown = function() {
    const dropdown = $('userDropdownMenu');
    if (dropdown) {
        dropdown.classList.add('hidden');
    }
};

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const dropdown = $('userDropdownMenu');
    const navUserDisplay = $('navUserDisplay');
    if (dropdown && navUserDisplay && !navUserDisplay.contains(e.target)) {
        dropdown.classList.add('hidden');
    }
});

// Navigate to profile settings section
window.goToProfileSettings = function() {
    goToDashboard();
    // Scroll to profile settings after a short delay
    setTimeout(() => {
        const profileSection = document.querySelector('#ownerDashboard .glass-effect:has(#ownerUsername)');
        if (profileSection) {
            profileSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Flash highlight effect
            profileSection.style.transition = 'box-shadow 0.3s';
            profileSection.style.boxShadow = '0 0 30px rgba(168, 85, 247, 0.5)';
            setTimeout(() => {
                profileSection.style.boxShadow = '';
            }, 2000);
        }
    }, 300);
};

window.handleAuthClick = function() {
    hideElement($('mobileMenu'));
    state.currentUser === 'owner' ? logout() : openModal('loginModal');
};

window.showCreateAccountForm = function() {
    hideElement($('loginOptions'));
    hideElement($('ownerLoginForm'));
    showElement($('createAccountForm'));
    hideElement($('createAccountError'));
    
    // Clear form fields to prevent cached data
    const emailField = $('newAccountEmail');
    const passwordField = $('newAccountPassword');
    const displayNameField = $('newAccountDisplayName');
    if (emailField) emailField.value = '';
    if (passwordField) passwordField.value = '';
    if (displayNameField) displayNameField.value = '';
    
    // Reset button state
    const btn = $('createAccountBtn');
    if (btn) {
        btn.disabled = false;
        btn.textContent = '🌱 Create Starter Account';
    }
};

window.showLoginForm = function() {
    hideElement($('loginOptions'));
    hideElement($('createAccountForm'));
    showElement($('ownerLoginForm'));
    hideElement($('loginError'));
    
    // Clear form fields to prevent cached data
    const emailField = $('ownerEmail');
    const passwordField = $('ownerPassword');
    if (emailField) emailField.value = '';
    if (passwordField) passwordField.value = '';
    
    // Reset login button state
    const btn = $('loginSubmitBtn');
    if (btn) {
        btn.disabled = false;
        btn.textContent = 'Sign In';
    }
};

window.hideCreateAccountForm = function() {
    hideElement($('createAccountForm'));
    showElement($('loginOptions'));
    
    // Clear form fields
    const emailField = $('newAccountEmail');
    const passwordField = $('newAccountPassword');
    const displayNameField = $('newAccountDisplayName');
    if (emailField) emailField.value = '';
    if (passwordField) passwordField.value = '';
    if (displayNameField) displayNameField.value = '';
    
    // Reset button state
    const btn = $('createAccountBtn');
    if (btn) {
        btn.disabled = false;
        btn.textContent = '🌱 Create Starter Account';
    }
};

// Handle create account form submission
document.addEventListener('DOMContentLoaded', function() {
    // Clean up any stale state on page load
    window.isCreatingAccount = false;
    const staleToast = document.getElementById('deletedAccountToast');
    if (staleToast) staleToast.remove();
    
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
                // Set flag to prevent false "deleted account" detection
                window.isCreatingAccount = true;
                
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
                
                // CREATE ADMIN NOTIFICATION for new user signup (wrapped in try-catch to not break flow)
                try {
                    await db.collection('adminNotifications').add({
                        type: 'new_user',
                        userEmail: user.email.toLowerCase(),
                        displayName: displayName,
                        tier: 'starter',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        dismissed: false
                    });
                    console.log('[Auth] Admin notification created for new user');
                } catch (notifyError) {
                    console.warn('[Auth] Could not create admin notification (non-critical):', notifyError);
                    // Don't break the flow - account creation succeeded
                }
                
                // Clear the flag after document is created
                window.isCreatingAccount = false;
                
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
                // Clear flag on error too
                window.isCreatingAccount = false;
                
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
        
        // Load admin users if master admin
        const user = auth.currentUser;
        if (user && TierService.isMasterAdmin(user.email)) {
            resetAdminTiles(); // Reset tiles to front view
            loadAllUsers();
            
            // Re-render any pending notifications
            setTimeout(() => {
                if (typeof reRenderPendingNotifications === 'function') {
                    reRenderPendingNotifications();
                }
            }, 300);
        }
        
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
    const statsPage = $('propertyStatsPage');
    
    // Don't navigate if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    
    // Handle property detail page navigation
    if (detailPage && !detailPage.classList.contains('hidden')) {
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
    }
    
    // Handle stats page navigation
    if (statsPage && !statsPage.classList.contains('hidden')) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            navigateStats('prev');
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            navigateStats('next');
        } else if (e.key === 'Escape') {
            e.preventDefault();
            backToDashboard();
        }
    }
});

// Navigate between properties on stats page
window.navigateStats = function(direction) {
    const currentId = state.currentPropertyId;
    if (!currentId) return;
    
    // Get owner's properties (or all if admin)
    const userEmail = auth.currentUser?.email?.toLowerCase();
    const isMasterAdmin = TierService.isMasterAdmin(userEmail);
    
    let userProperties;
    if (isMasterAdmin) {
        // Admin can navigate all properties
        userProperties = properties;
    } else {
        // Regular user can only navigate their own properties
        const userPropertyIds = ownerPropertyMap[userEmail] || [];
        userProperties = userPropertyIds.map(id => properties.find(p => p.id === id)).filter(p => p);
    }
    
    if (userProperties.length === 0) return;
    
    // Find current property index
    const currentIndex = userProperties.findIndex(p => p.id === currentId);
    if (currentIndex === -1) return;
    
    let newIndex;
    if (direction === 'prev') {
        newIndex = currentIndex > 0 ? currentIndex - 1 : userProperties.length - 1;
    } else {
        newIndex = currentIndex < userProperties.length - 1 ? currentIndex + 1 : 0;
    }
    
    const newProperty = userProperties[newIndex];
    if (newProperty) {
        viewPropertyStats(newProperty.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// Update the stats navigation counter
window.updateStatsNavCounter = function() {
    const counter = $('statsNavCounter');
    const prevBtn = $('prevStatsBtn');
    const nextBtn = $('nextStatsBtn');
    
    if (!counter) return;
    
    const currentId = state.currentPropertyId;
    const userEmail = auth.currentUser?.email?.toLowerCase();
    const isMasterAdmin = TierService.isMasterAdmin(userEmail);
    
    let userProperties;
    if (isMasterAdmin) {
        userProperties = properties;
    } else {
        const userPropertyIds = ownerPropertyMap[userEmail] || [];
        userProperties = userPropertyIds.map(id => properties.find(p => p.id === id)).filter(p => p);
    }
    
    const currentIndex = userProperties.findIndex(p => p.id === currentId);
    
    if (currentIndex !== -1 && userProperties.length > 0) {
        counter.textContent = `${currentIndex + 1} of ${userProperties.length}`;
        
        // Show/hide nav buttons based on property count
        if (prevBtn) prevBtn.style.display = userProperties.length > 1 ? 'block' : 'none';
        if (nextBtn) nextBtn.style.display = userProperties.length > 1 ? 'block' : 'none';
    } else {
        counter.textContent = '';
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
    }
};

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
            resetAdminTiles(); // Reset tiles to front view
            loadPendingUpgradeRequests();
            loadAllUsers(); // Load users immediately when dashboard loads
            
            // Start real-time users listener for new user notifications
            if (typeof startAdminUsersListener === 'function') {
                startAdminUsersListener();
            }
            
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
    
    // Clear form fields to prevent cached data
    const emailField = $('ownerEmail');
    const passwordField = $('ownerPassword');
    if (emailField) emailField.value = '';
    if (passwordField) passwordField.value = '';
};

window.hideOwnerLoginForm = function() {
    showElement($('loginOptions'));
    hideElement($('ownerLoginForm'));
    
    // Clear form fields
    const emailField = $('ownerEmail');
    const passwordField = $('ownerPassword');
    if (emailField) emailField.value = '';
    if (passwordField) passwordField.value = '';
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
    // Reset account creation flag
    window.isCreatingAccount = false;
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
    // Remove any existing deleted account toast first
    const existingToast = document.getElementById('deletedAccountToast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Don't show if we're in the middle of creating an account
    if (window.isCreatingAccount) {
        console.log('[Toast] Suppressing deleted account toast during account creation');
        return;
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.id = 'deletedAccountToast';
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
            saveAvailability(p.id, false);
        }
    });
    
    $('ownerPropertiesTable').innerHTML = ownerProps.map((p, index) => {
        // Get renter and payment info
        const renterName = PropertyDataService.getValue(p.id, 'renterName', p.renterName || '');
        const paymentFrequency = PropertyDataService.getValue(p.id, 'paymentFrequency', p.paymentFrequency || 'weekly');
        const lastPaymentDate = PropertyDataService.getValue(p.id, 'lastPaymentDate', p.lastPaymentDate || '');
        const dailyPrice = PropertyDataService.getValue(p.id, 'dailyPrice', p.dailyPrice || 0);
        const weeklyPrice = PropertyDataService.getValue(p.id, 'weeklyPrice', p.weeklyPrice);
        const biweeklyPrice = PropertyDataService.getValue(p.id, 'biweeklyPrice', p.biweeklyPrice || 0);
        const monthlyPrice = PropertyDataService.getValue(p.id, 'monthlyPrice', p.monthlyPrice || 0);
        
        // Calculate next due date
        let nextDueDate = '';
        let daysUntilDue = null;
        let reminderScript = '';
        let dueDateDisplay = '';
        
        if (lastPaymentDate) {
            const lastDate = parseLocalDate(lastPaymentDate);
            const nextDate = new Date(lastDate);
            if (paymentFrequency === 'daily') {
                nextDate.setDate(nextDate.getDate() + 1);
            } else if (paymentFrequency === 'weekly') {
                nextDate.setDate(nextDate.getDate() + 7);
            } else if (paymentFrequency === 'biweekly') {
                nextDate.setDate(nextDate.getDate() + 14);
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
            
            // Generate reminder script - determine amount based on frequency
            let amountDue = weeklyPrice;
            if (paymentFrequency === 'daily' && dailyPrice > 0) {
                amountDue = dailyPrice;
            } else if (paymentFrequency === 'biweekly' && biweeklyPrice > 0) {
                amountDue = biweeklyPrice;
            } else if (paymentFrequency === 'monthly' && monthlyPrice > 0) {
                amountDue = monthlyPrice;
            } else if (paymentFrequency === 'daily') {
                amountDue = Math.round(weeklyPrice / 7);
            } else if (paymentFrequency === 'biweekly') {
                // If no biweekly price set, use weekly * 2
                amountDue = weeklyPrice * 2;
            } else if (paymentFrequency === 'monthly') {
                // If no monthly price set, use weekly * 4
                amountDue = weeklyPrice * 4;
            }
            
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
                <td class="px-4 py-4 text-gray-300 capitalize hidden md:table-cell editable-cell" onclick="startCellEdit(${p.id}, 'type', this, 'propertyType')" title="Click to edit">
                    <span class="cell-value">${PropertyDataService.getValue(p.id, 'type', p.type)}</span>
                </td>
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
    } else if (type === 'propertyType') {
        inputHTML = `
            <select class="cell-input bg-gray-800 border border-purple-500 rounded px-2 py-1 text-white text-sm w-full" 
                    onchange="saveCellEdit(this, ${propertyId}, '${field}', '${type}')"
                    onblur="setTimeout(() => cancelCellEdit(this), 150)">
                <option value="apartment" ${currentValue === 'apartment' ? 'selected' : ''}>Apartment</option>
                <option value="house" ${currentValue === 'house' ? 'selected' : ''}>House</option>
                <option value="condo" ${currentValue === 'condo' ? 'selected' : ''}>Condo</option>
                <option value="villa" ${currentValue === 'villa' ? 'selected' : ''}>Villa</option>
                <option value="hotel" ${currentValue === 'hotel' ? 'selected' : ''}>Hotel</option>
                <option value="warehouse" ${currentValue === 'warehouse' ? 'selected' : ''}>Warehouse</option>
                <option value="hideout" ${currentValue === 'hideout' ? 'selected' : ''}>Hideout</option>
            </select>
        `;
    } else if (type === 'frequency') {
        inputHTML = `
            <select class="cell-input bg-gray-800 border border-purple-500 rounded px-2 py-1 text-white text-sm" 
                    onchange="saveCellEdit(this, ${propertyId}, '${field}', '${type}')"
                    onblur="setTimeout(() => cancelCellEdit(this), 150)">
                <option value="daily" ${currentValue === 'daily' ? 'selected' : ''}>Daily</option>
                <option value="weekly" ${currentValue === 'weekly' ? 'selected' : ''}>Weekly</option>
                <option value="biweekly" ${currentValue === 'biweekly' ? 'selected' : ''}>Biweekly</option>
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
    } else if (type === 'text' || type === 'date' || type === 'frequency' || type === 'select' || type === 'propertyType') {
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
        
        // LOG PAYMENT when lastPaymentDate is updated (same as property detail page)
        if (field === 'lastPaymentDate' && newValue && typeof logPayment === 'function') {
            const p = properties.find(prop => prop.id === propertyId);
            const renterName = PropertyDataService.getValue(propertyId, 'renterName', p?.renterName || 'Unknown');
            const paymentFrequency = PropertyDataService.getValue(propertyId, 'paymentFrequency', p?.paymentFrequency || 'weekly');
            const dailyPrice = PropertyDataService.getValue(propertyId, 'dailyPrice', p?.dailyPrice || 0);
            const weeklyPrice = PropertyDataService.getValue(propertyId, 'weeklyPrice', p?.weeklyPrice || 0);
            const biweeklyPrice = PropertyDataService.getValue(propertyId, 'biweeklyPrice', p?.biweeklyPrice || 0);
            const monthlyPrice = PropertyDataService.getValue(propertyId, 'monthlyPrice', p?.monthlyPrice || 0);
            
            // Calculate payment amount based on frequency
            let paymentAmount = weeklyPrice;
            if (paymentFrequency === 'daily') {
                paymentAmount = dailyPrice > 0 ? dailyPrice : Math.round(weeklyPrice / 7);
            } else if (paymentFrequency === 'biweekly') {
                paymentAmount = biweeklyPrice > 0 ? biweeklyPrice : weeklyPrice * 2;
            } else if (paymentFrequency === 'monthly') {
                paymentAmount = monthlyPrice > 0 ? monthlyPrice : weeklyPrice * 4;
            }
            
            // Log payment to Firestore
            const logSuccess = await logPayment(propertyId, {
                paymentDate: newValue,
                recordedAt: new Date().toISOString(),
                renterName: renterName,
                frequency: paymentFrequency,
                amount: paymentAmount,
                recordedBy: auth.currentUser?.email || 'owner'
            });
            console.log(`[PaymentLog] Dashboard: Logged payment for property ${propertyId}: ${renterName} paid $${paymentAmount} for ${newValue}`);
            
            // Show toast notification for payment logged
            if (logSuccess && typeof showToast === 'function') {
                showToast(`💰 Payment logged: $${paymentAmount.toLocaleString()} from ${renterName}`, 'success');
            }
        }
        
        // Auto-flip to "rented" when setting renter name, phone, or payment date
        if ((field === 'renterName' || field === 'renterPhone' || field === 'lastPaymentDate') && newValue) {
            if (state.availability[propertyId] !== false) {
                // Property is currently available, flip to rented
                state.availability[propertyId] = false;
                await saveAvailability(propertyId, false);
            }
        }
        
        // Update filtered properties to reflect changes
        state.filteredProperties = [...properties];
        
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
    
    // Sort premium listings to the top
    const sortedList = [...list].sort((a, b) => {
        const aData = state.propertyOverrides[a.id] || {};
        const bData = state.propertyOverrides[b.id] || {};
        const aPremium = aData.isPremium || a.isPremium;
        const bPremium = bData.isPremium || b.isPremium;
        if (aPremium && !bPremium) return -1;
        if (!aPremium && bPremium) return 1;
        return 0;
    });
    
    // Placeholder for properties with no/broken images
    const imagePlaceholder = `
        <div class="w-full h-64 md:h-72 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 flex flex-col items-center justify-center">
            <span class="text-6xl mb-3">🏠</span>
            <span class="text-gray-400 font-semibold text-sm">Photos Coming Soon</span>
        </div>
    `;
    
    // Image error handler function name
    const imgErrorHandler = "this.onerror=null; this.parentElement.innerHTML=`<div class='w-full h-64 md:h-72 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 flex flex-col items-center justify-center'><span class='text-6xl mb-3'>🏠</span><span class='text-gray-400 font-semibold text-sm'>Photos Coming Soon</span></div>`;";
    
    // First render with placeholder owner - include ALL properties, even those without images
    $('propertiesGrid').innerHTML = sortedList.filter(p => p).map(p => {
        // Ensure property ID is numeric for consistent lookup
        const propId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
        const available = state.availability[propId] !== false;
        const propData = state.propertyOverrides[propId] || {};
        const isPremium = propData.isPremium || p.isPremium;
        const hasImages = p.images && Array.isArray(p.images) && p.images.length > 0 && p.images[0];
        
        // Premium styling
        const cardBorder = isPremium 
            ? 'border-2 border-amber-500 ring-2 ring-amber-500/50 shadow-amber-500/20 shadow-2xl' 
            : 'border border-gray-700';
        const premiumBadge = isPremium 
            ? `<div class="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-gray-900 text-center py-1.5 font-black text-sm tracking-wider flex items-center justify-center gap-2">
                <span>👑</span> PREMIUM LISTING <span>👑</span>
               </div>` 
            : '';
        const premiumGlow = isPremium ? 'premium-glow' : '';
        const imageMargin = isPremium ? 'mt-8' : '';
        
        // Image element - use placeholder if no images, add error handler for broken images
        const imageElement = hasImages 
            ? `<img src="${p.images[0]}" alt="${sanitize(p.title)}" class="w-full h-64 md:h-72 object-cover" loading="lazy" onerror="${imgErrorHandler}">`
            : imagePlaceholder;
        
        return `
        <article class="property-card bg-gray-800 rounded-2xl shadow-xl overflow-hidden cursor-pointer ${cardBorder} ${premiumGlow} relative" onclick="viewProperty(${p.id})">
            ${premiumBadge}
            <div class="relative ${imageMargin}">
                ${!available ? '<div class="unavailable-overlay"><div class="unavailable-text">UNAVAILABLE</div></div>' : ''}
                ${imageElement}
                ${p.videoUrl ? '<div class="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-pink-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full font-bold text-xs md:text-sm shadow-lg flex items-center space-x-1 md:space-x-2"><svg class="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"></path></svg><span>Video Tour</span></div>' : ''}
                ${isPremium ? '<div class="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 px-3 py-1 rounded-full font-bold text-xs shadow-lg">⭐ FEATURED</div>' : ''}
            </div>
            <div class="p-5 md:p-6">
                <div class="flex justify-between items-start gap-2 mb-3">
                    <h4 class="text-xl md:text-2xl font-bold ${isPremium ? 'text-amber-300' : 'text-white'} min-h-[3.5rem] md:min-h-[4rem] line-clamp-2">${sanitize(p.title)}</h4>
                    <span class="badge text-white text-xs font-bold px-2 md:px-3 py-1 rounded-full uppercase shrink-0">${PropertyDataService.getValue(p.id, 'type', p.type)}</span>
                </div>
                <p class="text-gray-300 mb-2 font-medium text-sm md:text-base">📝 ${sanitize(p.location)}</p>
                <p class="text-xs md:text-sm text-gray-400 mb-2 font-semibold">Interior: ${PropertyDataService.getValue(p.id, 'interiorType', p.interiorType)}</p>
                <p id="owner-${p.id}" class="text-xs md:text-sm text-blue-400 mb-4 font-semibold">👤 Owner: Loading...</p>
                <div class="grid grid-cols-3 gap-2 mb-3 text-xs md:text-sm text-gray-300 font-semibold">
                    <div>${PropertyDataService.getValue(p.id, 'bedrooms', p.bedrooms)} Beds</div>
                    <div>${PropertyDataService.getValue(p.id, 'bathrooms', p.bathrooms)} Baths</div>
                    <div>${PropertyDataService.getValue(p.id, 'storage', p.storage).toLocaleString()}</div>
                </div>
                
                <!-- Pricing Tiers with Discount Badges -->
                ${renderPricingTiers(p, isPremium)}
                
                <button onclick="viewProperty(${p.id})" class="w-full ${isPremium ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900' : 'gradient-bg text-white'} px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold hover:opacity-90 transition shadow-lg mb-2 text-sm md:text-base">View Details</button>
                <button onclick="event.stopPropagation(); viewPropertyAndHighlightOffers(${p.id})" class="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold hover:opacity-90 transition shadow-lg text-sm md:text-base">Make an Offer</button>
            </div>
        </article>`;
    }).join('');
    
    // Then fetch and update owner names with tier icons asynchronously
    for (const p of sortedList) {
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
    const tabs = ['users', 'requests', 'create', 'history', 'tools', 'log'];
    const tabElements = {
        users: $('adminUsersTab'),
        requests: $('adminRequestsTab'),
        create: $('adminCreateTab'),
        history: $('adminHistoryTab'),
        tools: $('adminToolsTab'),
        log: $('adminLogTab')
    };
    const tabButtons = {
        users: $('adminTabUsers'),
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
    else if (tab === 'requests') loadUpgradeRequests();
    else if (tab === 'history') loadUpgradeHistory();
    else if (tab === 'log') loadActivityLog();
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

// Approve upgrade request - show modal with trial option
window.approveUpgradeRequest = async function(requestId, userEmail, newTier, currentTier) {
    const tierData = TIERS[newTier];
    const price = newTier === 'pro' ? '$25,000' : '$50,000';
    
    // Check if this is a Pro → Elite upgrade (prorated eligible)
    const isProToElite = currentTier === 'pro' && newTier === 'elite';
    const proratedPrice = '$25,000'; // Difference between Elite ($50k) and Pro ($25k)
    
    // Show approval modal with trial and prorated options
    const modalHTML = `
        <div id="approveModal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div class="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-green-700">
                <h3 class="text-xl font-bold text-white mb-4">✓ Approve Upgrade Request</h3>
                
                <div class="bg-gray-900/50 rounded-xl p-4 mb-4">
                    <p class="text-gray-300 mb-2"><strong>User:</strong> ${userEmail}</p>
                    <p class="text-gray-300 mb-2"><strong>Current Tier:</strong> <span class="text-gray-400">${TIERS[currentTier]?.name || currentTier}</span></p>
                    <p class="text-gray-300"><strong>Requested Tier:</strong> <span class="${newTier === 'pro' ? 'text-purple-400' : 'text-yellow-400'} font-bold">${tierData?.icon || '⭐'} ${tierData?.name || newTier}</span></p>
                    <p class="text-gray-300"><strong>Standard Price:</strong> ${price}/month</p>
                </div>
                
                ${isProToElite ? `
                <!-- Prorated Upgrade Option (Pro → Elite) -->
                <div class="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-500/30 rounded-xl p-4 mb-4">
                    <label class="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" id="approveProratedCheckbox" class="w-5 h-5 rounded border-amber-500 text-amber-500 focus:ring-amber-500 cursor-pointer">
                        <div>
                            <span class="text-amber-300 font-bold">💰 Prorated Upgrade (${proratedPrice})</span>
                            <p class="text-amber-400/70 text-sm">User was already paying for Pro - only charge the $25k difference</p>
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
                notesInput.value = `Prorated upgrade from Pro to Elite - paid $25k difference`;
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
    
    // Calculate actual subscription amount
    let subscriptionAmount = newTier === 'pro' ? 25000 : 50000; // Standard prices
    if (isTrial) {
        subscriptionAmount = 0;
    } else if (isProrated && currentTier === 'pro' && newTier === 'elite') {
        subscriptionAmount = 25000; // Only the difference
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
            console.log(`[Subscription] Set for ${userEmail}: trial=${isTrial}, prorated=${isProrated}, amount=$${subscriptionAmount}`);
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
        
        setTimeout(() => {
            closeApproveModal();
            const trialMsg = isTrial ? ' as FREE TRIAL' : '';
            const proratedMsg = isProrated ? ` (Prorated: $${(subscriptionAmount/1000).toFixed(0)}k)` : '';
            showToast(`${userEmail} upgraded to ${tierData?.name || newTier}${trialMsg}${proratedMsg}!`, 'success');
            loadUpgradeRequests();
            loadAllUsers();
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
// Track dismissed notifications in this session
window.dismissedAdminNotifications = new Set();
window.pendingAdminNotifications = new Set();
window.adminNotificationsData = [];
window.knownUserIds = new Set();
window.knownPropertyIds = new Set();
window.knownSettingsPropertyIds = new Set();

// Start listening for admin notifications - uses new unified system
window.startAdminNotificationsListener = function() {
    if (!TierService.isMasterAdmin(auth.currentUser?.email)) {
        console.log('[AdminNotify] Not admin, skipping');
        return;
    }
    
    // Use new unified notification system
    if (typeof initAdminNotifications === 'function') {
        console.log('[AdminNotify] Using new unified notification system');
        initAdminNotifications();
    } else {
        console.error('[AdminNotify] Unified notification system not loaded!');
    }
};

// Real-time listener for users - detects new signups immediately AND shows missed signups
window.startAdminUsersListener = function() {
    if (!TierService.isMasterAdmin(auth.currentUser?.email)) return;
    
    if (window.adminUsersUnsubscribe) {
        window.adminUsersUnsubscribe();
    }
    
    // Get admin's last visit time from localStorage
    let lastAdminVisit = null;
    try {
        const lastVisitStr = localStorage.getItem('adminLastVisit');
        if (lastVisitStr) {
            lastAdminVisit = new Date(lastVisitStr);
        }
    } catch (e) {
        // Ignore
    }
    
    // Record current session start time (but don't save to localStorage yet!)
    window.adminSessionStartTime = new Date();
    
    // Load pending notifications from localStorage (these need to be shown again)
    try {
        const pending = localStorage.getItem('pendingUserNotifications');
        if (pending) {
            window.pendingAdminNotifications = new Set(JSON.parse(pending));
        } else {
            window.pendingAdminNotifications = new Set();
        }
    } catch (e) {
        window.pendingAdminNotifications = new Set();
    }
    
    // Load dismissed notifications from localStorage
    try {
        const dismissed = localStorage.getItem('dismissedUserNotifications');
        if (dismissed) {
            JSON.parse(dismissed).forEach(id => window.dismissedAdminNotifications.add(id));
        }
    } catch (e) {
        // Ignore
    }
    
    // Clean up: remove any pending notifications that are also in dismissed
    window.dismissedAdminNotifications.forEach(id => {
        window.pendingAdminNotifications.delete(id);
    });
    // Save cleaned pending set
    try {
        localStorage.setItem('pendingUserNotifications', JSON.stringify(Array.from(window.pendingAdminNotifications)));
    } catch (e) {}
    
    // First snapshot flag - used for catching "missed" users
    let isFirstSnapshot = true;
    
    // Track which user IDs from pending notifications actually exist
    const validPendingUserIds = new Set();
    
    // Simple listener - no orderBy to avoid index requirement
    window.adminUsersUnsubscribe = db.collection('users')
        .onSnapshot((snapshot) => {
            const users = [];
            const newUsers = [];
            const missedUsers = []; // Users created while admin was away
            
            // Build set of all current user IDs
            const currentUserIds = new Set();
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const user = { id: doc.id, ...data };
                users.push(user);
                currentUserIds.add(doc.id);
                
                const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : null;
                const notificationId = 'new-user-' + doc.id;
                
                if (isFirstSnapshot) {
                    // Check if this user has a pending (unacknowledged) notification
                    if (window.pendingAdminNotifications.has(notificationId)) {
                        if (!window.dismissedAdminNotifications.has(notificationId)) {
                            missedUsers.push(user);
                            validPendingUserIds.add(notificationId);
                            console.log('[AdminUsers] Pending notification found:', user.email);
                        }
                    }
                    // Also check for users created since last visit (new missed users)
                    else if (lastAdminVisit && createdAt && createdAt > lastAdminVisit) {
                        if (!window.dismissedAdminNotifications.has(notificationId)) {
                            missedUsers.push(user);
                            // Add to pending so it persists across refreshes
                            window.pendingAdminNotifications.add(notificationId);
                            console.log('[AdminUsers] Missed user found:', user.email, 'created:', createdAt);
                        }
                    }
                } else {
                    // Real-time: detect users created AFTER session started
                    if (!window.knownUserIds.has(doc.id)) {
                        if (createdAt && createdAt > window.adminSessionStartTime) {
                            newUsers.push(user);
                            // Add to pending notifications
                            window.pendingAdminNotifications.add(notificationId);
                            logAdminActivity('new_user', user);
                        }
                    }
                }
                
                window.knownUserIds.add(doc.id);
            });
            
            // Save pending notifications to localStorage
            try {
                localStorage.setItem('pendingUserNotifications', JSON.stringify(Array.from(window.pendingAdminNotifications)));
            } catch (e) {
                console.warn('[AdminUsers] Could not save pending notifications');
            }
            
            // Update admin data
            window.adminUsersData = users;
            
            // Show notifications for MISSED users (created while away or pending from last session)
            if (isFirstSnapshot && missedUsers.length > 0) {
                console.log('[AdminUsers] Showing notifications for', missedUsers.length, 'missed user(s)');
                
                // Show notification for each missed user (no flash for these)
                missedUsers.forEach(user => {
                    showNewUserNotification(user, true); // true = missed (not real-time)
                });
            }
            
            // Show notifications for REAL-TIME new users
            if (newUsers.length > 0) {
                console.log('[AdminUsers] New user(s) detected:', newUsers.map(u => u.email));
                
                // Flash screen for real-time only
                flashScreen();
                
                // Show notification for each new user
                newUsers.forEach(user => {
                    showNewUserNotification(user, false); // false = real-time
                });
                
                // Refresh the user list and stats
                const container = $('allUsersList');
                if (container) {
                    renderAdminUsersList(users);
                }
                updateAdminStats(users);
            }
            
            // Update notification badge
            updateNotificationBadge();
            
            // After first snapshot, mark as no longer first and clean up stale notifications
            if (isFirstSnapshot) {
                isFirstSnapshot = false;
                console.log('[AdminUsers] Initial load complete, now listening for new users');
                
                // Clean up stale pending notifications (users that were deleted)
                const staleNotifications = [];
                window.pendingAdminNotifications.forEach(id => {
                    if (id.startsWith('new-user-')) {
                        const userId = id.replace('new-user-', '');
                        if (!currentUserIds.has(userId)) {
                            staleNotifications.push(id);
                        }
                    }
                });
                
                if (staleNotifications.length > 0) {
                    console.log('[AdminUsers] Cleaning up stale notifications:', staleNotifications);
                    staleNotifications.forEach(id => {
                        window.pendingAdminNotifications.delete(id);
                        window.dismissedAdminNotifications.add(id);
                    });
                    // Save cleaned set
                    try {
                        localStorage.setItem('pendingUserNotifications', JSON.stringify(
                            Array.from(window.pendingAdminNotifications).filter(id => id.startsWith('new-user-'))
                        ));
                    } catch (e) {}
                    // Update badge after cleanup
                    updateNotificationBadge();
                }
            }
            
        }, (error) => {
            console.error('[AdminUsers] Users listener error:', error);
        });
};

// Real-time listener for properties - detects new listings AND updates admin panel data
window.startAdminPropertiesListener = function() {
    if (!TierService.isMasterAdmin(auth.currentUser?.email)) return;
    
    console.log('[AdminProperties] Starting properties listener via settings/properties');
    
    // The actual property data is stored in settings/properties document, not a 'properties' collection
    // So we just need to call the settings listener
    startSettingsPropertiesListener();
};

// Real-time listener for settings/properties document - this is where user-created properties are stored
window.startSettingsPropertiesListener = function() {
    // Always unsubscribe existing listener first (prevents orphaned listeners)
    if (window.settingsPropertiesUnsubscribe) {
        console.log('[SettingsProperties] Unsubscribing existing listener');
        window.settingsPropertiesUnsubscribe();
        window.settingsPropertiesUnsubscribe = null;
    }
    
    console.log('[SettingsProperties] Starting real-time listener');
    
    // Ensure adminSessionStartTime is set (backup if users listener hasn't set it yet)
    if (!window.adminSessionStartTime) {
        window.adminSessionStartTime = new Date();
        console.log('[SettingsProperties] Set adminSessionStartTime:', window.adminSessionStartTime);
    }
    
    // Get admin's last visit time from localStorage for missed listings detection
    let lastAdminVisit = null;
    try {
        const lastVisitStr = localStorage.getItem('adminLastVisit');
        if (lastVisitStr) {
            lastAdminVisit = new Date(lastVisitStr);
        }
    } catch (e) {}
    
    // Load pending listing notifications from localStorage
    try {
        const pending = localStorage.getItem('pendingListingNotifications');
        if (pending) {
            JSON.parse(pending).forEach(id => window.pendingAdminNotifications.add(id));
        }
    } catch (e) {}
    
    // Use GLOBAL seenPropertyIds set so it persists
    if (!window.seenPropertyIds) {
        window.seenPropertyIds = new Set();
    }
    
    // Track if this is the VERY FIRST snapshot we've ever received
    // Use a separate flag that persists
    if (window.settingsPropertiesFirstLoadDone === undefined) {
        window.settingsPropertiesFirstLoadDone = false;
    }
    
    window.settingsPropertiesUnsubscribe = db.collection('settings').doc('properties')
        .onSnapshot((doc) => {
            console.log('[SettingsProperties] === SNAPSHOT RECEIVED ===');
            
            if (!doc.exists) {
                console.log('[SettingsProperties] No properties document yet');
                return;
            }
            
            const propsData = doc.data();
            const newListings = [];
            const missedListings = [];
            const isFirstSnapshot = !window.settingsPropertiesFirstLoadDone;
            
            console.log('[SettingsProperties] Snapshot details:', {
                isFirst: isFirstSnapshot,
                propsCount: Object.keys(propsData).length,
                seenCount: window.seenPropertyIds.size,
                sessionStart: window.adminSessionStartTime?.toISOString()
            });
            
            Object.keys(propsData).forEach(key => {
                const propId = parseInt(key);
                const prop = propsData[key];
                
                // Only skip if prop is completely invalid - allow empty images arrays
                if (!prop || !prop.title) {
                    return; // Skip invalid properties (must have at least a title)
                }
                
                prop.id = propId;
                const notificationId = 'new-listing-' + propId;
                
                // Parse createdAt - handle both string and Firestore timestamp
                let createdAt = null;
                if (prop.createdAt) {
                    if (typeof prop.createdAt === 'string') {
                        createdAt = new Date(prop.createdAt);
                    } else if (prop.createdAt.toDate) {
                        createdAt = prop.createdAt.toDate();
                    }
                }
                
                // Check if this is a NEW property (not seen in any previous snapshot)
                const isNewToUs = !window.seenPropertyIds.has(propId);
                
                if (isNewToUs) {
                    console.log('[SettingsProperties] New property ID detected:', propId, prop.title, 'isFirst:', isFirstSnapshot);
                    
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
                    
                    // Determine if this is a MISSED listing (first snapshot) or REAL-TIME (subsequent)
                    if (isFirstSnapshot) {
                        // First snapshot - check if created while admin was away
                        if (window.pendingAdminNotifications.has(notificationId)) {
                            if (!window.dismissedAdminNotifications.has(notificationId)) {
                                missedListings.push(prop);
                                console.log('[SettingsProperties] Pending missed listing:', prop.title);
                            }
                        } else if (lastAdminVisit && createdAt && createdAt > lastAdminVisit) {
                            if (!window.dismissedAdminNotifications.has(notificationId)) {
                                missedListings.push(prop);
                                window.pendingAdminNotifications.add(notificationId);
                                console.log('[SettingsProperties] Missed listing (created while away):', prop.title);
                            }
                        }
                    } else {
                        // REAL-TIME - this is a new listing created while we're watching!
                        // Only notify if created after we started listening
                        if (!createdAt || createdAt > window.adminSessionStartTime) {
                            newListings.push(prop);
                            window.pendingAdminNotifications.add(notificationId);
                            console.log('[SettingsProperties] REAL-TIME new listing:', prop.title, 'by', prop.ownerEmail);
                        }
                    }
                }
                
                // Mark this property ID as seen
                window.seenPropertyIds.add(propId);
            });
            
            // Update filtered properties
            state.filteredProperties = [...properties];
            
            // Save pending notifications to localStorage
            try {
                const listingNotifs = Array.from(window.pendingAdminNotifications).filter(id => id.startsWith('new-listing-'));
                localStorage.setItem('pendingListingNotifications', JSON.stringify(listingNotifs));
            } catch (e) {}
            
            // Show notifications for MISSED listings (on first load only)
            if (isFirstSnapshot && missedListings.length > 0) {
                console.log('[SettingsProperties] Showing', missedListings.length, 'missed listing notification(s)');
                missedListings.forEach(listing => {
                    showNewListingNotification(listing, true);
                });
                updateNotificationBadge();
            }
            
            // Show notifications for REAL-TIME new listings
            if (!isFirstSnapshot && newListings.length > 0) {
                // Filter out listings created by the current admin
                const currentUserEmail = auth.currentUser?.email?.toLowerCase();
                const otherUsersListings = newListings.filter(listing => 
                    listing.ownerEmail?.toLowerCase() !== currentUserEmail
                );
                
                if (otherUsersListings.length > 0) {
                    console.log('[SettingsProperties] FLASHING SCREEN for', otherUsersListings.length, 'new listing(s)');
                    
                    // Flash screen green!
                    flashScreen('green');
                    
                    // Show notification for each
                    otherUsersListings.forEach(listing => {
                        showNewListingNotification(listing, false);
                        logAdminActivity('new_listing', listing);
                    });
                    
                    // Refresh admin panel
                    if (window.adminUsersData && window.adminUsersData.length > 0) {
                        updateAdminStats(window.adminUsersData);
                        renderAdminUsersList(window.adminUsersData);
                    }
                    
                    updateNotificationBadge();
                }
            }
            
            // Mark first snapshot as complete (use global flag)
            if (!window.settingsPropertiesFirstLoadDone) {
                window.settingsPropertiesFirstLoadDone = true;
                console.log('[SettingsProperties] Initial load complete. Seen', window.seenPropertyIds.size, 'properties. Now listening for new listings...');
            }
            
            console.log('[SettingsProperties] === SNAPSHOT PROCESSING COMPLETE ===', {
                newListings: newListings.length,
                missedListings: missedListings.length
            });
            
        }, (error) => {
            console.error('[SettingsProperties] Listener error:', error);
        });
};

// Show a notification for a new listing
window.showNewListingNotification = function(listing, isMissed = false) {
    const stack = $('adminNotificationsStack');
    if (!stack) {
        console.log('[showNewListingNotification] No notification stack found!');
        return;
    }
    
    stack.classList.remove('hidden');
    
    const notificationId = 'new-listing-' + listing.id;
    
    // Don't add if already dismissed or already showing
    if (window.dismissedAdminNotifications.has(notificationId)) {
        console.log('[showNewListingNotification] Already dismissed:', notificationId);
        return;
    }
    if ($('notification-' + notificationId)) {
        console.log('[showNewListingNotification] Already showing:', notificationId);
        return;
    }
    
    console.log('[showNewListingNotification] Creating notification for:', listing.title, 'isMissed:', isMissed, 'isPremium:', listing.isPremium);
    
    // Get owner name
    const ownerEmail = listing.ownerEmail || 'Unknown';
    const ownerName = window.ownerUsernameCache?.[ownerEmail?.toLowerCase()] || ownerEmail?.split('@')[0] || 'Unknown';
    
    // Time display - handle various timestamp formats
    let timeDisplay;
    if (isMissed) {
        let createdDate = null;
        if (listing.createdAt) {
            if (typeof listing.createdAt === 'string') {
                createdDate = new Date(listing.createdAt);
            } else if (listing.createdAt.toDate) {
                createdDate = listing.createdAt.toDate();
            }
        }
        if (createdDate) {
            timeDisplay = createdDate.toLocaleString('en-US', { 
                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
            });
        } else {
            timeDisplay = 'Recently';
        }
    } else {
        timeDisplay = new Date().toLocaleString('en-US', { 
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
        });
    }
    
    // Check if this is a premium listing
    const isPremium = listing.isPremium === true;
    const isPremiumTrial = listing.isPremiumTrial === true;
    
    // Different styling for missed vs real-time, and premium vs regular
    let gradientClass, titleText, icon, premiumBadge = '';
    
    if (isPremium && !isPremiumTrial) {
        // PAID PREMIUM - needs payment collection!
        gradientClass = 'from-amber-600 to-orange-600 border-amber-400';
        icon = '👑💰';
        titleText = isMissed ? '👑 Premium Listing (Payment Due!)' : '👑 New Premium Listing!';
        premiumBadge = `
            <div class="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded mt-2 animate-pulse">
                ⚠️ COLLECT $10,000/week PAYMENT
            </div>
        `;
    } else if (isPremium && isPremiumTrial) {
        // Premium trial - no payment needed
        gradientClass = 'from-cyan-600 to-blue-600 border-cyan-400';
        icon = '🎁';
        titleText = isMissed ? '🎁 Premium Trial Listing' : '🎁 New Premium Trial Listing';
        premiumBadge = `<div class="text-cyan-300 text-xs mt-1">Free trial - no payment needed</div>`;
    } else {
        // Regular listing
        gradientClass = isMissed 
            ? 'from-emerald-700 to-green-600 border-emerald-500' 
            : 'from-green-600 to-teal-600 border-green-500';
        icon = isMissed ? '📬' : '🏠';
        titleText = isMissed ? '🏠 Listing While You Were Away...' : '🏠 New Listing Posted!';
    }
    
    const notificationHTML = `
        <div id="notification-${notificationId}" class="bg-gradient-to-r ${gradientClass} rounded-xl p-4 border-2 shadow-lg relative admin-notification-new" 
             onclick="viewPropertyStats(${listing.id})">
            <button onclick="event.stopPropagation(); dismissNewUserNotification('${notificationId}')" 
                    class="absolute top-2 right-2 text-white/70 hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition">
                ✕
            </button>
            <div class="flex items-center gap-4 pr-8 cursor-pointer">
                <span class="text-3xl">${icon}</span>
                <div class="flex-1">
                    <div class="text-white font-bold text-lg">${titleText}</div>
                    <div class="text-white/90">${listing.title || 'New Property'}</div>
                    <div class="text-white/70 text-sm">by ${ownerName}</div>
                    ${premiumBadge}
                    <div class="text-white/60 text-xs mt-1">${timeDisplay}</div>
                </div>
            </div>
        </div>
    `;
    
    stack.insertAdjacentHTML('afterbegin', notificationHTML);
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
    
    // Also save to localStorage for persistence
    try {
        const existing = JSON.parse(localStorage.getItem('adminActivityLog') || '[]');
        existing.unshift(entry);
        localStorage.setItem('adminActivityLog', JSON.stringify(existing.slice(0, 100)));
    } catch (e) {
        console.warn('[AdminActivity] Could not save to localStorage');
    }
};

// Load and display activity log
window.loadActivityLog = function() {
    const container = $('activityLogList');
    if (!container) return;
    
    // Load from localStorage
    let entries = [];
    try {
        entries = JSON.parse(localStorage.getItem('adminActivityLog') || '[]');
    } catch (e) {
        console.warn('[AdminActivity] Could not load from localStorage');
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
                title = 'User Upgraded';
                description = `${entry.data.email} upgraded to ${entry.data.newTier}`;
                break;
            case 'payment':
                icon = '💰';
                bgColor = 'from-green-900/50 to-emerald-900/50 border-green-600/30';
                title = 'Payment Received';
                description = entry.data.description || 'Payment recorded';
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
    localStorage.removeItem('adminActivityLog');
    loadActivityLog();
};

// Show a notification for a new user
window.showNewUserNotification = function(user, isMissed = false) {
    const stack = $('adminNotificationsStack');
    if (!stack) return;
    
    stack.classList.remove('hidden');
    
    const notificationId = 'new-user-' + user.id;
    
    // Don't add if already dismissed or already showing
    if (window.dismissedAdminNotifications.has(notificationId)) return;
    if ($('notification-' + notificationId)) return;
    
    // For missed users, show actual creation time; for real-time, show now
    let timeDisplay;
    if (isMissed && user.createdAt?.toDate) {
        const createdDate = user.createdAt.toDate();
        timeDisplay = createdDate.toLocaleString('en-US', { 
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
        });
    } else {
        timeDisplay = new Date().toLocaleString('en-US', { 
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
        });
    }
    
    // Different styling for missed vs real-time notifications
    const gradientClass = isMissed 
        ? 'from-orange-600 to-amber-600 border-orange-500' 
        : 'from-cyan-600 to-blue-600 border-cyan-500';
    
    const titleText = isMissed 
        ? '📬 While You Were Away...' 
        : '👤 New User Registered!';
    
    const notificationHTML = `
        <div id="notification-${notificationId}" class="bg-gradient-to-r ${gradientClass} rounded-xl p-4 border-2 shadow-lg relative admin-notification-new" 
             onclick="handleNewUserNotificationClick('${user.id}')">
            <button onclick="event.stopPropagation(); dismissNewUserNotification('${notificationId}')" 
                    class="absolute top-2 right-2 text-white/70 hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition">
                ✕
            </button>
            <div class="flex items-center gap-4 pr-8 cursor-pointer">
                <span class="text-3xl">${isMissed ? '📬' : '👤'}</span>
                <div class="flex-1">
                    <div class="text-white font-bold text-lg">${titleText}</div>
                    <div class="text-white/90">${user.username || user.email?.split('@')[0] || 'Unknown'} created a Starter account</div>
                    <div class="text-white/60 text-xs mt-1">${timeDisplay}</div>
                </div>
            </div>
        </div>
    `;
    
    stack.insertAdjacentHTML('afterbegin', notificationHTML);
};

// Handle click on new user notification
window.handleNewUserNotificationClick = function(userId) {
    switchAdminTab('users');
};

// Dismiss new user notification
window.dismissNewUserNotification = function(notificationId) {
    window.dismissedAdminNotifications.add(notificationId);
    
    // Remove from pending notifications
    window.pendingAdminNotifications.delete(notificationId);
    
    // Save to localStorage for persistence across sessions
    try {
        const dismissed = Array.from(window.dismissedAdminNotifications);
        localStorage.setItem('dismissedUserNotifications', JSON.stringify(dismissed));
        
        const pending = Array.from(window.pendingAdminNotifications);
        localStorage.setItem('pendingUserNotifications', JSON.stringify(pending));
        
        // If all notifications are dismissed, update lastVisit time
        if (window.pendingAdminNotifications.size === 0) {
            localStorage.setItem('adminLastVisit', new Date().toISOString());
            console.log('[AdminNotify] All notifications dismissed, updated lastVisit');
        }
    } catch (e) {
        console.warn('[AdminNotify] Could not save dismissed state');
    }
    
    const notification = $('notification-' + notificationId);
    if (notification) {
        notification.style.animation = 'slideUp 0.3s ease-out forwards';
        setTimeout(() => notification.remove(), 300);
    }
    
    // Update the notification badge
    updateNotificationBadge();
    
    // Hide stack if empty
    const stack = $('adminNotificationsStack');
    if (stack && stack.children.length <= 1) {
        setTimeout(() => {
            if (stack.children.length === 0) {
                stack.classList.add('hidden');
            }
        }, 350);
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
window.showNewUserNotifications = function(event) {
    event.stopPropagation();
    // Navigate to dashboard and switch to users tab
    goToDashboard();
    
    // Re-render pending notifications from the users list
    setTimeout(() => {
        reRenderPendingNotifications();
        switchAdminTab('users');
    }, 100);
};

// Show new listing notifications popup
window.showNewListingNotifications = function(event) {
    event.stopPropagation();
    // Navigate to dashboard - listings are shown in the notifications stack
    goToDashboard();
    
    // Re-render pending notifications
    setTimeout(() => {
        reRenderPendingNotifications();
    }, 100);
};

// Show new premium notifications popup
window.showNewPremiumNotifications = function(event) {
    event.stopPropagation();
    // Navigate to dashboard - premium notifications are shown in the stack
    goToDashboard();
    
    // Re-render pending notifications
    setTimeout(() => {
        reRenderPendingNotifications();
    }, 100);
};

// Re-render all pending notifications that might not be showing
window.reRenderPendingNotifications = function() {
    const stack = $('adminNotificationsStack');
    if (!stack) return;
    
    console.log('[ReRenderNotifications] Checking for pending notifications...');
    console.log('[ReRenderNotifications] Pending set:', Array.from(window.pendingAdminNotifications));
    
    // Go through all pending notifications and re-render any that aren't showing
    window.pendingAdminNotifications.forEach(notificationId => {
        // Skip if already dismissed
        if (window.dismissedAdminNotifications.has(notificationId)) {
            window.pendingAdminNotifications.delete(notificationId);
            return;
        }
        
        // Skip if already showing
        if ($('notification-' + notificationId)) {
            return;
        }
        
        console.log('[ReRenderNotifications] Re-rendering:', notificationId);
        
        // Parse the notification ID to determine type
        if (notificationId.startsWith('new-user-')) {
            const userId = notificationId.replace('new-user-', '');
            const user = window.adminUsersData?.find(u => u.id === userId);
            if (user) {
                showNewUserNotification(user, true);
            }
        } else if (notificationId.startsWith('new-listing-')) {
            const listingId = parseInt(notificationId.replace('new-listing-', ''));
            const listing = properties.find(p => p.id === listingId);
            if (listing) {
                showNewListingNotification(listing, true);
            }
        }
    });
    
    // Make sure stack is visible if there are notifications
    if (stack.querySelectorAll('[id^="notification-"]').length > 0) {
        stack.classList.remove('hidden');
    }
    
    updateNotificationBadge();
};

// Show a notification for a new premium activation
window.showNewPremiumNotification = function(property, ownerEmail, isMissed = false) {
    const stack = $('adminNotificationsStack');
    if (!stack) {
        console.log('[showNewPremiumNotification] No notification stack found!');
        return;
    }
    
    stack.classList.remove('hidden');
    
    const notificationId = 'new-premium-' + property.id + '-' + Date.now();
    
    // Don't add if already dismissed
    if (window.dismissedAdminNotifications.has(notificationId)) return;
    
    console.log('[showNewPremiumNotification] Creating notification for:', property.title);
    
    // Get owner name
    const ownerName = window.ownerUsernameCache?.[ownerEmail?.toLowerCase()] || ownerEmail?.split('@')[0] || 'Unknown';
    
    const timeDisplay = new Date().toLocaleString('en-US', { 
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
    });
    
    const gradientClass = isMissed 
        ? 'from-amber-700 to-orange-600 border-amber-500' 
        : 'from-amber-600 to-yellow-500 border-amber-400';
    
    const titleText = isMissed 
        ? '👑 Premium Request While Away...' 
        : '👑 New Premium Activation!';
    
    const notificationHTML = `
        <div id="notification-${notificationId}" class="bg-gradient-to-r ${gradientClass} rounded-xl p-4 border-2 shadow-lg relative admin-notification-new">
            <button onclick="event.stopPropagation(); dismissAdminNotification('${notificationId}')" 
                    class="absolute top-2 right-2 text-white/70 hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition">
                ✕
            </button>
            <div class="flex items-center gap-4 pr-8">
                <span class="text-3xl">👑</span>
                <div class="flex-1">
                    <div class="text-white font-bold text-lg">${titleText}</div>
                    <div class="text-white/90 font-semibold">${property.title || 'Property'}</div>
                    <div class="text-white/70 text-sm">by ${ownerName} • $10k/week fee</div>
                    <div class="text-white/50 text-xs mt-1">${timeDisplay}</div>
                </div>
            </div>
        </div>
    `;
    
    stack.insertAdjacentHTML('afterbegin', notificationHTML);
    
    // Add to pending
    window.pendingAdminNotifications.add(notificationId);
    updateNotificationBadge();
};

// Render the persistent admin notification stack
window.renderAdminNotificationStack = function(notifications, hasNew = false) {
    const stack = $('adminNotificationsStack');
    if (!stack) return;
    
    // Filter out dismissed ones
    const activeNotifications = notifications.filter(n => 
        !window.dismissedAdminNotifications.has(n.id)
    );
    
    if (activeNotifications.length === 0) {
        stack.classList.add('hidden');
        stack.innerHTML = '';
        return;
    }
    
    stack.classList.remove('hidden');
    
    // Flash the entire screen if there are new notifications
    if (hasNew) {
        flashScreen();
    }
    
    stack.innerHTML = activeNotifications.map(n => {
        const time = n.createdAt?.toDate ? n.createdAt.toDate() : new Date();
        const timeStr = time.toLocaleString('en-US', { 
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
        });
        
        let icon, bgGradient, borderColor, title, message;
        
        switch(n.type) {
            case 'new_user':
                icon = '👤';
                bgGradient = 'from-cyan-600 to-blue-600';
                borderColor = 'border-cyan-500';
                title = 'New User Registered!';
                message = `${n.displayName || n.userEmail?.split('@')[0]} created a Starter account`;
                break;
            case 'upgrade_request':
                icon = '💰';
                bgGradient = 'from-purple-600 to-pink-600';
                borderColor = 'border-purple-500';
                title = 'Upgrade Request';
                message = `${n.displayName || n.userEmail} wants ${TIERS[n.requestedTier]?.name || 'upgrade'}`;
                break;
            case 'premium_request':
                icon = '👑';
                bgGradient = 'from-amber-600 to-yellow-500';
                borderColor = 'border-amber-400';
                title = 'Premium Listing Activated!';
                message = n.message || `${n.propertyTitle || 'Property'} enabled premium - collect $10k/week`;
                // Add to pending premium notifications for badge count
                if (!window.pendingAdminNotifications.has('new-premium-' + n.id)) {
                    window.pendingAdminNotifications.add('new-premium-' + n.id);
                }
                break;
            default:
                icon = '🔔';
                bgGradient = 'from-purple-600 to-pink-600';
                borderColor = 'border-purple-500';
                title = 'Notification';
                message = n.message || 'New notification';
        }
        
        return `
            <div class="bg-gradient-to-r ${bgGradient} rounded-xl p-4 border-2 ${borderColor} shadow-lg relative admin-notification-new" 
                 onclick="handleAdminNotificationClick('${n.id}', '${n.type}')">
                <button onclick="event.stopPropagation(); dismissAdminNotification('${n.id}')" 
                        class="absolute top-2 right-2 text-white/70 hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition">
                    ✕
                </button>
                <div class="flex items-center gap-4 pr-8 cursor-pointer">
                    <span class="text-3xl">${icon}</span>
                    <div class="flex-1">
                        <div class="text-white font-bold text-lg">${title}</div>
                        <div class="text-white/80">${message}</div>
                        <div class="text-white/50 text-xs mt-1">${timeStr}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
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
    console.log('[AdminNotify] Clearing all notifications');
    
    const stack = $('adminNotificationsStack');
    if (!stack) return;
    
    // Get all notification IDs
    const notifications = stack.querySelectorAll('[id^="notification-"]');
    notifications.forEach(notif => {
        const id = notif.id.replace('notification-', '');
        window.dismissedAdminNotifications.add(id);
        window.pendingAdminNotifications.delete(id);
    });
    
    // Clear all visual notifications
    notifications.forEach(notif => notif.remove());
    
    // Hide the stack and clear button
    stack.classList.add('hidden');
    const clearBtn = $('clearAllNotificationsBtn');
    if (clearBtn) clearBtn.classList.add('hidden');
    
    // Save to localStorage
    try {
        localStorage.setItem('dismissedUserNotifications', JSON.stringify(Array.from(window.dismissedAdminNotifications)));
        localStorage.setItem('pendingUserNotifications', JSON.stringify(Array.from(window.pendingAdminNotifications)));
        localStorage.setItem('adminLastVisit', new Date().toISOString());
    } catch (e) {}
    
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
    const proUsers = users.filter(u => u.tier === 'pro');
    const eliteUsers = users.filter(u => u.tier === 'elite');
    // Exclude master admin from starter count
    const starterUsers = users.filter(u => !TierService.isMasterAdmin(u.email) && (u.tier === 'starter' || !u.tier));
    const adminUsers = users.filter(u => TierService.isMasterAdmin(u.email));
    
    // Separate trial users from paid users
    const proTrialUsers = proUsers.filter(u => u.isFreeTrial === true);
    const proPaidUsers = proUsers.filter(u => u.isFreeTrial !== true);
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
    
    // Calculate PAID revenue only (excluding trials)
    // Use actual subscriptionAmount when available (for prorated upgrades)
    let proRevenue = 0;
    let eliteRevenue = 0;
    let proratedCount = 0;
    
    proPaidUsers.forEach(u => {
        // Use stored subscriptionAmount if available, otherwise default
        const amount = u.subscriptionAmount !== undefined ? u.subscriptionAmount : 25000;
        proRevenue += amount;
    });
    
    elitePaidUsers.forEach(u => {
        // Use stored subscriptionAmount if available, otherwise default
        const amount = u.subscriptionAmount !== undefined ? u.subscriptionAmount : 50000;
        eliteRevenue += amount;
        if (u.isProratedUpgrade) proratedCount++;
    });
    
    // Calculate Premium Ad Fees (weekly fees from premium listings)
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
    
    // Calculate monthly premium revenue (weekly * 4)
    const premiumMonthlyRevenue = premiumFeeTotal * 4;
    
    // Total revenue
    const totalRevenue = proRevenue + eliteRevenue + premiumMonthlyRevenue;
    
    // Helper function to get user listing count
    const getUserListings = (user) => {
        const userEmail = user.email?.toLowerCase();
        const userProps = ownerPropertyMap[userEmail] || [];
        return userProps.length;
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
    
    // Pro Users Tile
    const statPro = $('adminStatPro');
    const statProBreakdown = $('adminStatProBreakdown');
    if (statPro) statPro.textContent = proUsers.length;
    if (statProBreakdown) {
        if (proUsers.length > 0) {
            statProBreakdown.textContent = `(${proPaidUsers.length} paid, ${proTrialUsers.length} trial)`;
        } else {
            statProBreakdown.textContent = '';
        }
    }
    
    const proDetail = $('adminStatProDetail');
    if (proDetail) {
        const allProUsersList = proUsers.map(u => {
            const listings = getUserListings(u);
            const isTrial = u.isFreeTrial === true;
            const trialTag = isTrial ? '<span class="text-cyan-400">🎁</span>' : '<span class="text-green-400">💰</span>';
            return `<div class="truncate">${trialTag} ${u.username || u.email.split('@')[0]} <span class="text-gray-500">${listings}/3</span></div>`;
        }).join('');
        proDetail.innerHTML = allProUsersList || '<div class="text-gray-500">No Pro users</div>';
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
            <div>⭐ Pro: ${proUsers.length} ${proTrialUsers.length > 0 ? `<span class="text-cyan-400">(${proTrialUsers.length} trial)</span>` : ''}</div>
            <div>👑 Elite: ${eliteUsers.length} ${eliteTrialUsers.length > 0 ? `<span class="text-cyan-400">(${eliteTrialUsers.length} trial)</span>` : ''}</div>
        `;
    }
    
    // ==================== ROW 2: REVENUE ====================
    
    // Pro Revenue Tile
    const statProRevenue = $('adminStatProRevenue');
    const statProRevenueSub = $('adminStatProRevenueSub');
    if (statProRevenue) statProRevenue.textContent = `$${(proRevenue / 1000).toFixed(0)}k`;
    if (statProRevenueSub) statProRevenueSub.textContent = `${proPaidUsers.length} paid × $25k`;
    
    const proRevenueDetail = $('adminStatProRevenueDetail');
    if (proRevenueDetail) {
        const paidList = proPaidUsers.map(u => 
            `<div class="truncate">💰 ${u.username || u.email.split('@')[0]} - $25k</div>`
        ).join('');
        proRevenueDetail.innerHTML = `
            <div class="mb-1 text-yellow-400 font-bold">$${proRevenue.toLocaleString()}/mo</div>
            ${paidList || '<div class="text-gray-500">No paid Pro users</div>'}
            ${proTrialUsers.length > 0 ? `<div class="text-cyan-400 mt-1">🎁 ${proTrialUsers.length} on free trial</div>` : ''}
        `;
    }
    
    // Elite Revenue Tile
    const statEliteRevenue = $('adminStatEliteRevenue');
    const statEliteRevenueSub = $('adminStatEliteRevenueSub');
    if (statEliteRevenue) statEliteRevenue.textContent = `$${(eliteRevenue / 1000).toFixed(0)}k`;
    if (statEliteRevenueSub) {
        if (proratedCount > 0) {
            statEliteRevenueSub.textContent = `${elitePaidUsers.length} paid (${proratedCount} prorated)`;
        } else {
            statEliteRevenueSub.textContent = `${elitePaidUsers.length} paid × $50k`;
        }
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
    if (statPremium) statPremium.textContent = `$${(premiumMonthlyRevenue / 1000).toFixed(0)}k`;
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
            <div class="mb-1 text-amber-400 font-bold">$${premiumMonthlyRevenue.toLocaleString()}/mo</div>
            <div class="text-gray-400 text-xs mb-1">${premiumPaidCount} × $10k/wk × 4</div>
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
        const totalTrials = proTrialUsers.length + eliteTrialUsers.length;
        statTotalRevenueSub.textContent = totalTrials > 0 ? `${totalTrials} on free trial` : 'Monthly income';
    }
    
    const totalRevenueDetail = $('adminStatTotalRevenueDetail');
    if (totalRevenueDetail) {
        const totalTrials = proTrialUsers.length + eliteTrialUsers.length;
        totalRevenueDetail.innerHTML = `
            <div class="text-green-400 font-bold mb-2">$${totalRevenue.toLocaleString()}/mo</div>
            <div class="space-y-1 text-xs">
                <div>⭐ Pro: $${proRevenue.toLocaleString()}</div>
                <div>👑 Elite: $${eliteRevenue.toLocaleString()}</div>
                <div>🏆 Premium: $${premiumMonthlyRevenue.toLocaleString()}</div>
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
        
        // Ensure base properties (1-14) are synced to admin
        if (typeof ensureBasePropertiesSynced === 'function') {
            ensureBasePropertiesSynced();
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
    
    // Sort users into tier groups
    const tierOrder = { 'owner': 0, 'elite': 1, 'pro': 2, 'starter': 3 };
    const sortedUsers = [...users].sort((a, b) => {
        const aIsAdmin = TierService.isMasterAdmin(a.email);
        const bIsAdmin = TierService.isMasterAdmin(b.email);
        const aTier = aIsAdmin ? 'owner' : (a.tier || 'starter');
        const bTier = bIsAdmin ? 'owner' : (b.tier || 'starter');
        
        // First sort by tier
        if (tierOrder[aTier] !== tierOrder[bTier]) {
            return tierOrder[aTier] - tierOrder[bTier];
        }
        // Then by name
        return (a.username || a.email).localeCompare(b.username || b.email);
    });
    
    // Group users by tier
    const groups = {
        owner: sortedUsers.filter(u => TierService.isMasterAdmin(u.email)),
        elite: sortedUsers.filter(u => !TierService.isMasterAdmin(u.email) && u.tier === 'elite'),
        pro: sortedUsers.filter(u => !TierService.isMasterAdmin(u.email) && u.tier === 'pro'),
        starter: sortedUsers.filter(u => !TierService.isMasterAdmin(u.email) && (!u.tier || u.tier === 'starter'))
    };
    
    // Render function for individual user card
    const renderUserCard = (user) => {
        const isUserMasterAdmin = TierService.isMasterAdmin(user.email);
        const hasPendingRequest = pendingEmails.includes(user.email?.toLowerCase());
        const pendingRequest = pending.find(r => r.userEmail?.toLowerCase() === user.email?.toLowerCase());
        
        const tierData = isUserMasterAdmin 
            ? { icon: '👑', name: 'Owner', bgColor: 'bg-red-600', maxListings: Infinity }
            : (TIERS[user.tier] || TIERS.starter);
        
        const userPropertyIds = ownerPropertyMap[user.email?.toLowerCase()] || [];
        const userProperties = userPropertyIds.map(id => properties.find(p => p.id === id)).filter(p => p);
        const listingCount = userProperties.length;
        const maxListings = (isUserMasterAdmin || tierData.maxListings === Infinity) ? '∞' : tierData.maxListings;
        const escapedEmail = user.email.replace(/'/g, "\\'");
        const escapedId = user.id;
        const displayName = user.username || user.email.split('@')[0];
        
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
        const typeIcons = { house: '🏠', apartment: '🏢', condo: '🏨', villa: '🏡', hotel: '🏩', warehouse: '🏭', hideout: '🏚️' };
        
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
                return `
                    <div class="flex items-center justify-between py-1.5 border-b border-gray-700/50 last:border-0 user-property-item" data-type="${p.type || ''}" data-interior="${p.interiorType || ''}">
                        <span class="text-gray-300 text-xs flex items-center gap-1">
                            <span class="text-gray-500">${index + 1}.</span>
                            <span title="${(p.type || 'unknown').charAt(0).toUpperCase() + (p.type || 'unknown').slice(1)}">${typeIcon}</span>
                            <span title="${p.interiorType || 'Unknown'}" class="text-gray-600">${interiorIcon}</span>
                            <a onclick="viewPropertyStats(${p.id})" class="hover:text-cyan-400 cursor-pointer hover:underline transition">${title}</a>
                        </span>
                        <span class="text-xs ${isAvailable ? 'text-green-400' : 'text-red-400'}">${isAvailable ? '🟢' : '🔴'}</span>
                    </div>
                `;
            }).join('')
            : '<p class="text-gray-500 text-xs italic">No properties listed</p>';
        
        const pendingBadge = hasPendingRequest ? `
            <span class="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse ml-2">
                💰 WANTS ${(TIERS[pendingRequest?.requestedTier]?.name || 'Upgrade').toUpperCase()}
            </span>
        ` : '';
        
        // Subscription tracking HTML for Pro/Elite
        let subscriptionHTML = '';
        if (!isUserMasterAdmin && (user.tier === 'pro' || user.tier === 'elite')) {
            const subLastPaid = user.subscriptionLastPaid || '';
            // Use actual subscription amount if set (for prorated upgrades), otherwise default
            const defaultPrice = user.tier === 'pro' ? 25000 : 50000;
            const actualAmount = user.subscriptionAmount !== undefined ? user.subscriptionAmount : defaultPrice;
            const tierPrice = '$' + actualAmount.toLocaleString();
            const tierName = user.tier === 'pro' ? 'Pro ⭐' : 'Elite 👑';
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
            
            subscriptionHTML = `
                <div class="mt-3 p-3 rounded-lg border ${statusBg}">
                    <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div class="flex items-center gap-2">
                            <span class="text-lg">${statusIcon}</span>
                            <span class="text-white font-bold text-sm">${subscriptionLabel}</span>
                            ${trialBadge}
                            ${proratedBadge}
                        </div>
                        <div class="flex items-center gap-2">
                            ${toggleTrialBtn}
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
        
        // Build action buttons based on current tier
        let actionButtonsHTML = '';
        if (!isUserMasterAdmin) {
            const buttons = [];
            
            if (user.tier === 'starter') {
                // Starter can upgrade to Pro or Elite
                buttons.push(`<button onclick="adminUpgradeUser('${escapedEmail}', 'pro', '${user.tier}')" 
                    class="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-3 py-2 rounded-lg font-bold text-xs hover:opacity-90 transition">
                    ⭐ Upgrade to Pro
                </button>`);
                buttons.push(`<button onclick="adminUpgradeUser('${escapedEmail}', 'elite', '${user.tier}')" 
                    class="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-2 rounded-lg font-bold text-xs hover:opacity-90 transition">
                    👑 Upgrade to Elite
                </button>`);
            } else if (user.tier === 'pro') {
                // Pro can upgrade to Elite or downgrade to Starter
                buttons.push(`<button onclick="adminUpgradeUser('${escapedEmail}', 'elite', '${user.tier}')" 
                    class="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-2 rounded-lg font-bold text-xs hover:opacity-90 transition">
                    👑 Upgrade to Elite
                </button>`);
                buttons.push(`<button onclick="adminDowngradeUser('${escapedEmail}', '${user.tier}', 'starter')" 
                    class="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-3 py-2 rounded-lg font-bold text-xs hover:opacity-90 transition">
                    🌱 Downgrade
                </button>`);
            } else if (user.tier === 'elite') {
                // Elite can downgrade to Pro or Starter
                buttons.push(`<button onclick="adminDowngradeUser('${escapedEmail}', '${user.tier}', 'pro')" 
                    class="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-3 py-2 rounded-lg font-bold text-xs hover:opacity-90 transition">
                    ⭐ Downgrade to Pro
                </button>`);
                buttons.push(`<button onclick="adminDowngradeUser('${escapedEmail}', '${user.tier}', 'starter')" 
                    class="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-3 py-2 rounded-lg font-bold text-xs hover:opacity-90 transition">
                    🌱 Downgrade to Starter
                </button>`);
            }
            
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
                                    <span class="text-white font-bold">${displayName}</span>
                                    ${pendingBadge}
                                </div>
                                <div class="text-gray-500 text-xs truncate">${user.email}</div>
                            </div>
                        </div>
                        <!-- Row 2: Tier badge, Phone, Listings, Properties toggle -->
                        <div class="flex flex-wrap items-center gap-2 text-xs mb-2">
                            <span class="px-2 py-0.5 rounded ${tierData.bgColor} text-white font-bold">${tierData.name}</span>
                            ${user.phone ? `<span class="text-gray-400 flex items-center gap-1">
                                📱 ${user.phone}
                                <button onclick="event.stopPropagation(); copyPhoneNumber('${(user.phone || '').replace(/[^0-9]/g, '')}')" 
                                        class="text-cyan-400 hover:text-cyan-300" title="Copy phone number">📋</button>
                            </span>` : ''}
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
                    </div>
                    ${actionButtons}
                </div>
            </div>
        `;
    };
    
    // Render grouped sections
    let html = '';
    
    // Owner/Admin section (collapsed by default)
    if (groups.owner.length > 0) {
        html += `
            <div class="mb-6">
                <div class="flex items-center gap-2 mb-3 pb-2 border-b border-red-600/50 cursor-pointer hover:opacity-80 transition" onclick="toggleUserGroup('ownerGroup')">
                    <span id="ownerGroupToggle" class="text-gray-400 transition">▶</span>
                    <span class="text-xl">👑</span>
                    <h5 class="text-red-400 font-bold">Owner / Admin</h5>
                    <span class="text-gray-500 text-sm">(${groups.owner.length})</span>
                </div>
                <div id="ownerGroup" class="space-y-3 hidden">
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
    
    // Pro section (expanded by default)
    if (groups.pro.length > 0) {
        html += `
            <div class="mb-6">
                <div class="flex items-center gap-2 mb-3 pb-2 border-b border-purple-600/50 cursor-pointer hover:opacity-80 transition" onclick="toggleUserGroup('proGroup')">
                    <span id="proGroupToggle" class="text-gray-400 transition">▼</span>
                    <span class="text-xl">⭐</span>
                    <h5 class="text-purple-400 font-bold">Pro Members</h5>
                    <span class="text-gray-500 text-sm">(${groups.pro.length}) • $25k/mo each</span>
                </div>
                <div id="proGroup" class="space-y-3">
                    ${groups.pro.map(renderUserCard).join('')}
                </div>
            </div>
        `;
    }
    
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
    const typeIcons = { house: '🏠', apartment: '🏢', condo: '🏨', villa: '🏡', hotel: '🏩', warehouse: '🏭', hideout: '🏚️' };
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

// ==================== SUBSCRIPTION TRACKING ====================

// Edit subscription last paid date - opens inline date picker
window.editSubscriptionDate = function(userId, email, currentDate) {
    // Find the user card and subscription section
    const userCard = document.querySelector(`[data-userid="${userId}"]`);
    if (!userCard) return;
    
    const lastPaidSpan = userCard.querySelector('.sub-last-paid');
    if (!lastPaidSpan) return;
    
    // Create inline date picker
    const today = new Date().toISOString().split('T')[0];
    const escapedEmail = email.replace(/'/g, "\\'");
    lastPaidSpan.innerHTML = `
        <input type="date" 
               id="subDatePicker_${userId}" 
               value="${currentDate || today}"
               max="${today}"
               class="bg-gray-700 text-white px-2 py-1 rounded border border-cyan-500 text-xs">
        <button onclick="confirmSubscriptionDate('${userId}', '${escapedEmail}')" 
                class="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs ml-1">✓</button>
        <button onclick="loadAllUsers()" 
                class="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs">✗</button>
    `;
    
    // Focus the date picker
    const input = $(`subDatePicker_${userId}`);
    if (input) {
        input.focus();
        input.showPicker?.(); // Opens the native date picker if supported
    }
};

// Confirm and save the subscription date
window.confirmSubscriptionDate = async function(userId, email) {
    const input = $(`subDatePicker_${userId}`);
    if (!input) return;
    
    const date = input.value;
    await saveSubscriptionDate(userId, email, date);
};

// Save subscription date to Firestore
window.saveSubscriptionDate = async function(userId, email, date) {
    try {
        console.log(`[Subscription] Attempting to save for userId: ${userId}, email: ${email}, date: ${date}`);
        
        await db.collection('users').doc(userId).update({
            subscriptionLastPaid: date || '',
            subscriptionUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`[Subscription] Successfully updated last paid for ${email}: ${date}`);
        
        // Show success toast
        const toast = document.createElement('div');
        toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl z-[60] flex items-center gap-2';
        toast.innerHTML = `<span class="text-lg">✅</span> Payment date saved for ${email.split('@')[0]}!`;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.transition = 'opacity 0.3s';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
        
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
        // Show error toast
        const toast = document.createElement('div');
        toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-xl shadow-2xl z-[60] flex items-center gap-2';
        toast.innerHTML = `<span class="text-lg">❌</span> Failed to save: ${error.message}`;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.transition = 'opacity 0.3s';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Open subscription reminder modal with editable text
window.openSubscriptionReminderModal = function(userId, email, displayName, tier, price, daysUntilDue) {
    const tierName = tier === 'pro' ? 'Pro ⭐' : 'Elite 👑';
    const tierEmoji = tier === 'pro' ? '⭐' : '👑';
    const benefits = tier === 'pro' ? '3 property listings' : 'Unlimited property listings';
    
    // Determine reminder type based on days until due
    let reminderType, reminderTitle, reminderBg;
    
    if (daysUntilDue === null || daysUntilDue === undefined) {
        reminderType = 'never_paid';
        reminderTitle = '🚨 NEVER PAID - First Payment Needed';
        reminderBg = 'bg-red-900/50 border-red-500';
    } else if (daysUntilDue < 0) {
        reminderType = 'overdue';
        reminderTitle = `🚨 OVERDUE by ${Math.abs(daysUntilDue)} days`;
        reminderBg = 'bg-red-900/50 border-red-500';
    } else if (daysUntilDue === 0) {
        reminderType = 'due_today';
        reminderTitle = '⚠️ DUE TODAY';
        reminderBg = 'bg-orange-900/50 border-orange-500';
    } else if (daysUntilDue <= 3) {
        reminderType = 'due_soon';
        reminderTitle = `⚠️ Due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`;
        reminderBg = 'bg-orange-900/50 border-orange-500';
    } else if (daysUntilDue <= 7) {
        reminderType = 'upcoming';
        reminderTitle = `📆 Due in ${daysUntilDue} days`;
        reminderBg = 'bg-yellow-900/30 border-yellow-600';
    } else {
        reminderType = 'normal';
        reminderTitle = `✅ ${daysUntilDue} days until due`;
        reminderBg = 'bg-green-900/30 border-green-600';
    }
    
    // Generate contextual payment reminder - TEXT MESSAGE FRIENDLY (no formatting)
    let paymentScript = '';
    if (daysUntilDue === null || daysUntilDue === undefined) {
        // Never paid
        paymentScript = `Hey ${displayName}! 👋 Welcome to PaulysProperties.com ${tierName}! We're excited to have you on board. Just a quick note - we haven't received your first subscription payment yet. 💰 ${price} for the ${tierName} plan which gives you ${benefits}. Let's meet up whenever you're free to get this sorted out. Looking forward to helping you grow your rental business! 🏠✨`;
    } else if (daysUntilDue < 0) {
        // Overdue
        paymentScript = `Hey ${displayName}, hope you're doing well! Just wanted to reach out - your PaulysProperties.com subscription is ${Math.abs(daysUntilDue)} days past due. 💰 Amount: ${price} for your ${tierName} plan. I want to make sure your listings stay active and visible to renters. Can we meet up soon to get this sorted? Let me know what works for you! 🙏`;
    } else if (daysUntilDue === 0) {
        // Due today
        paymentScript = `Hey ${displayName}! 👋 Quick reminder - your PaulysProperties.com ${tierName} subscription is due today! 💰 ${price} for the month. Are you free to meet up later? Let me know what time works and we can get this taken care of. Thanks for being a valued member! 🙏`;
    } else if (daysUntilDue <= 7) {
        // Due soon (1-7 days)
        paymentScript = `Hey ${displayName}! 👋 Just a friendly heads up - your PaulysProperties.com ${tierName} subscription payment is coming up in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}! 💰 ${price} for the month. No rush - just wanted to give you a heads up so we can plan to meet up. Let me know when you're available! 😊`;
    } else {
        // Not due yet (8+ days)
        paymentScript = `Hey ${displayName}! 👋 Just checking in! Your PaulysProperties.com ${tierName} subscription is all good - next payment isn't due for another ${daysUntilDue} days. 💰 ${price} | ${tierEmoji} ${tierName} | 📅 ${daysUntilDue} days left. No action needed right now. Just wanted to say thanks for being part of the platform! 🏠✨`;
    }
    
    // Generate upsell script - TEXT MESSAGE FRIENDLY
    let upsellScript = '';
    if (tier === 'pro') {
        upsellScript = `Hey ${displayName}! 🌟 I wanted to share something with you - I've noticed you're doing great with your ${benefits} on the Pro plan! Have you considered upgrading to Elite? Here's what you'd get: 👑 ELITE TIER - $50,000/month ✨ UNLIMITED property listings (no cap!) 🎯 Priority placement in search results 🏆 Elite badge on all your listings 💼 Perfect for scaling your rental empire. You're already at 2/3 listings on Pro. With Elite, you could list ALL your properties and really dominate the market here. The extra $25k/month pays for itself when you think about the additional rental income from more listings! Want to chat about upgrading? I can switch you over anytime. 🚀`;
    } else {
        // Already Elite - thank them instead
        upsellScript = `Hey ${displayName}! 👑 Just wanted to say THANK YOU for being an Elite member! You're one of our top property owners on PaulysProperties.com, and we really appreciate your business. 🏆 Elite Status with Unlimited Listings and Priority Placement - your properties are getting maximum visibility, and renters love what you're offering. If there's anything we can do to help you succeed even more, just let me know. We're here for you! Keep crushing it! 💪🏠`;
    }
    
    // Generate referral script - TEXT MESSAGE FRIENDLY
    const referralScript = `Hey ${displayName}! 🤝 Quick question - do you know any other property owners who might benefit from PaulysProperties.com? Here's the deal: 🎁 For every owner you refer who signs up for Pro or Elite, I'll give you a $5,000 credit toward your next subscription payment! It's a win-win - your friend gets a great platform for their rentals, you save money on your subscription, and more properties means more options for renters. Just have them mention your name when they sign up, and I'll apply the credit to your account. Know anyone who might be interested? 🏠💰`;
    
    // Create modal HTML with larger text areas
    const modalHTML = `
        <div id="subscriptionReminderModal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onclick="if(event.target === this) closeModal('subscriptionReminderModal')">
            <div class="bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto border ${reminderBg}">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h2 class="text-xl font-bold text-white">${tierEmoji} ${displayName}</h2>
                            <p class="text-gray-400 text-sm">${email}</p>
                            <p class="text-lg font-bold mt-2 ${daysUntilDue !== null && daysUntilDue < 0 ? 'text-red-400' : daysUntilDue !== null && daysUntilDue <= 3 ? 'text-orange-400' : 'text-green-400'}">${reminderTitle}</p>
                        </div>
                        <button onclick="closeModal('subscriptionReminderModal')" class="text-gray-400 hover:text-white text-2xl">&times;</button>
                    </div>
                    
                    <div class="space-y-4">
                        <!-- Payment Reminder -->
                        <div class="bg-gray-700/50 rounded-xl p-4">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-cyan-400 font-bold">💰 Payment Reminder</span>
                                <button onclick="copySubscriptionScript('payment', '${displayName}')" class="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-1.5 rounded font-bold">📋 Copy</button>
                            </div>
                            <textarea id="subScript_payment" class="w-full bg-gray-900 text-gray-300 text-sm p-4 rounded-lg border border-gray-600 resize-none" rows="5">${paymentScript}</textarea>
                        </div>
                        
                        <!-- Upsell / Thank You -->
                        <div class="bg-gray-700/50 rounded-xl p-4">
                            <div class="flex justify-between items-center mb-2">
                                <span class="${tier === 'pro' ? 'text-purple-400' : 'text-yellow-400'} font-bold">${tier === 'pro' ? '🚀 Upgrade to Elite' : '👑 VIP Thank You'}</span>
                                <button onclick="copySubscriptionScript('upsell', '${displayName}')" class="${tier === 'pro' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white px-4 py-1.5 rounded font-bold">📋 Copy</button>
                            </div>
                            <textarea id="subScript_upsell" class="w-full bg-gray-900 text-gray-300 text-sm p-4 rounded-lg border border-gray-600 resize-none" rows="5">${upsellScript}</textarea>
                        </div>
                        
                        <!-- Referral Program -->
                        <div class="bg-gray-700/50 rounded-xl p-4">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-green-400 font-bold">🤝 Referral Bonus</span>
                                <button onclick="copySubscriptionScript('referral', '${displayName}')" class="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded font-bold">📋 Copy</button>
                            </div>
                            <textarea id="subScript_referral" class="w-full bg-gray-900 text-gray-300 text-sm p-4 rounded-lg border border-gray-600 resize-none" rows="5">${referralScript}</textarea>
                        </div>
                    </div>
                    
                    <div class="mt-6 flex justify-end">
                        <button onclick="closeModal('subscriptionReminderModal')" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-xl font-bold">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = $('subscriptionReminderModal');
    if (existingModal) existingModal.remove();
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

// Copy subscription script from modal
window.copySubscriptionScript = function(scriptType, displayName) {
    const textarea = $(`subScript_${scriptType}`);
    if (!textarea) return;
    
    const scriptLabels = {
        payment: '💰 Payment Reminder',
        upsell: '🚀 Upgrade/VIP Message',
        referral: '🤝 Referral Bonus'
    };
    
    navigator.clipboard.writeText(textarea.value).then(() => {
        // Show success toast
        const toast = document.createElement('div');
        toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl z-[60] flex items-center gap-2';
        toast.innerHTML = `<span class="text-lg">✅</span> ${scriptLabels[scriptType] || 'Message'} copied!`;
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
    if (!window.adminUsersData) return { overdue: [], dueSoon: [], neverPaid: [] };
    
    const overdueUsers = [];
    const dueSoonUsers = [];
    const neverPaidUsers = [];
    
    window.adminUsersData.forEach(user => {
        if (user.tier !== 'pro' && user.tier !== 'elite') return;
        if (TierService.isMasterAdmin(user.email)) return;
        
        const subLastPaid = user.subscriptionLastPaid;
        if (!subLastPaid) {
            // Never paid - track separately (don't trigger urgent alert)
            neverPaidUsers.push({
                name: user.username || user.email.split('@')[0],
                email: user.email,
                tier: user.tier
            });
            return;
        }
        
        // Parse date parts to avoid timezone shift
        const [year, month, day] = subLastPaid.split('-').map(Number);
        const lastDate = new Date(year, month - 1, day);
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + 30); // 30 days from last payment
        
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
    window.neverPaidSubscriptions = neverPaidUsers;
    
    // Update subscription alert badge (include never-paid in count for attention)
    const attentionNeeded = overdueUsers.length + neverPaidUsers.length;
    updateSubscriptionAlertBadge(attentionNeeded, dueSoonUsers.length);
    
    return { overdue: overdueUsers, dueSoon: dueSoonUsers, neverPaid: neverPaidUsers };
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

// Show global subscription alert if there are overdue subscriptions (not just never-paid)
window.showSubscriptionAlert = function() {
    const { overdue, dueSoon, neverPaid } = checkSubscriptionAlerts();
    
    // Only show global alert for users who are actually past their due date
    // (not for never-paid users - those just show in the badge)
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
        // Get property title before deletion for notification
        const prop = properties.find(p => p.id === propertyId);
        const propertyTitle = prop?.title || `Property ${propertyId}`;
        
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
            
            // CREATE DELETION NOTIFICATION on owner's user document
            // This triggers their existing user document listener for real-time sync
            const ownerSnapshot = await db.collection('users')
                .where('email', '==', lowerEmail)
                .get();
            
            if (!ownerSnapshot.empty) {
                const ownerDoc = ownerSnapshot.docs[0];
                await db.collection('users').doc(ownerDoc.id).update({
                    deletedProperty: {
                        propertyId: propertyId,
                        propertyTitle: propertyTitle,
                        deletedBy: auth.currentUser?.email || 'admin',
                        deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        acknowledged: false
                    }
                });
                console.log(`[Admin] Set deletion notification on user document for ${lowerEmail}`);
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
                const isTrialEntry = entry.isFreeTrial === true;
                const trialBadge = isTrialEntry ? '<span class="px-2 py-0.5 rounded bg-cyan-600 text-white text-xs font-bold">🎁 TRIAL</span>' : '';
                newTierDisplay = `<span class="px-2 py-1 rounded bg-gray-700 ${newTierData.color}">${newTierData.icon} ${newTierData.name}</span> ${trialBadge}`;
                priceDisplay = isTrialEntry 
                    ? '<span class="text-cyan-400 font-bold">$0 <span class="text-xs">(trial)</span></span>' 
                    : (entry.price ? `<span class="text-green-400 font-bold">$${entry.price.toLocaleString()}</span>` : '<span class="text-gray-500">-</span>');
                
                // Different border for trials
                if (isTrialEntry) borderColor = 'border-cyan-700/50';
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
    
    // Show upgrade modal with trial option
    showUpgradeModal(email, newTier, currentTier, tierData, price);
};

// Show upgrade modal with trial checkbox
function showUpgradeModal(email, newTier, currentTier, tierData, price) {
    // Check if this is an upgrade from Pro to Elite (prorated eligible)
    const isProToElite = currentTier === 'pro' && newTier === 'elite';
    const proratedPrice = '$25,000'; // Difference between Elite ($50k) and Pro ($25k)
    
    // Create modal overlay
    const modalHTML = `
        <div id="upgradeModal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onclick="if(event.target.id === 'upgradeModal') closeUpgradeModal()">
            <div class="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-700" onclick="event.stopPropagation()">
                <h3 class="text-xl font-bold text-white mb-4">⬆️ Upgrade User</h3>
                
                <div class="bg-gray-900/50 rounded-xl p-4 mb-4">
                    <p class="text-gray-300 mb-2"><strong>User:</strong> ${email}</p>
                    <p class="text-gray-300 mb-2"><strong>Current Tier:</strong> <span class="text-gray-400">${TIERS[currentTier]?.name || currentTier}</span></p>
                    <p class="text-gray-300"><strong>New Tier:</strong> <span class="${newTier === 'pro' ? 'text-purple-400' : 'text-yellow-400'} font-bold">${tierData.icon} ${tierData.name}</span></p>
                    <p class="text-gray-300"><strong>Standard Price:</strong> ${price}/month</p>
                </div>
                
                ${isProToElite ? `
                <!-- Prorated Upgrade Option (Pro → Elite) -->
                <div class="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-500/30 rounded-xl p-4 mb-4">
                    <label class="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" id="upgradeProratedCheckbox" class="w-5 h-5 rounded border-amber-500 text-amber-500 focus:ring-amber-500 cursor-pointer">
                        <div>
                            <span class="text-amber-300 font-bold">💰 Prorated Upgrade (${proratedPrice})</span>
                            <p class="text-amber-400/70 text-sm">User was already paying for Pro - only charge the $25k difference</p>
                        </div>
                    </label>
                </div>
                ` : ''}
                
                <!-- Free Trial Checkbox -->
                <div class="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-xl p-4 mb-4">
                    <label class="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" id="upgradeTrialCheckbox" class="w-5 h-5 rounded border-cyan-500 text-cyan-500 focus:ring-cyan-500 cursor-pointer">
                        <div>
                            <span class="text-cyan-300 font-bold">🎁 Free 1-Month Trial</span>
                            <p class="text-cyan-400/70 text-sm">Check this if this is a promotional trial upgrade (won't count as revenue)</p>
                        </div>
                    </label>
                </div>
                
                <!-- Notes Field -->
                <div class="mb-4">
                    <label class="block text-gray-400 text-sm mb-2">Payment/Notes:</label>
                    <input type="text" id="upgradeNotes" 
                           class="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                           placeholder="Payment confirmation or notes...">
                </div>
                
                <!-- Amount Display -->
                <div id="upgradeAmountDisplay" class="bg-gray-900/50 rounded-lg p-3 mb-4 text-center">
                    <span class="text-gray-400">Amount to collect: </span>
                    <span id="upgradeAmountValue" class="text-green-400 font-bold text-xl">${price}</span>
                </div>
                
                <!-- Buttons -->
                <div class="flex gap-3">
                    <button id="upgradeConfirmBtn" onclick="confirmUpgrade('${email}', '${newTier}', '${currentTier}')" 
                            class="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold hover:opacity-90 transition">
                        ✓ Confirm Upgrade
                    </button>
                    <button id="upgradeCancelBtn" onclick="closeUpgradeModal()" 
                            class="flex-1 bg-gray-700 text-white py-3 rounded-xl font-bold hover:bg-gray-600 transition">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add event listeners
    const trialCheckbox = $('upgradeTrialCheckbox');
    const proratedCheckbox = $('upgradeProratedCheckbox');
    const notesInput = $('upgradeNotes');
    const amountValue = $('upgradeAmountValue');
    
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
            
            if (this.checked) {
                const tierName = newTier === 'pro' ? 'Pro' : 'Elite';
                notesInput.value = `Enjoy a 30 day free trial of ${tierName} Membership on Pauly!`;
            } else {
                if (notesInput.value.includes('free trial')) {
                    notesInput.value = '';
                }
            }
            updateAmountDisplay();
        });
    }
    
    if (proratedCheckbox) {
        proratedCheckbox.addEventListener('change', function() {
            // Uncheck trial if prorated is checked
            if (this.checked && trialCheckbox) {
                trialCheckbox.checked = false;
                if (notesInput.value.includes('free trial')) {
                    notesInput.value = '';
                }
            }
            
            if (this.checked) {
                notesInput.value = `Prorated upgrade from Pro to Elite - paid $25k difference`;
            } else {
                if (notesInput.value.includes('Prorated')) {
                    notesInput.value = '';
                }
            }
            updateAmountDisplay();
        });
    }
}

window.closeUpgradeModal = function() {
    const modal = $('upgradeModal');
    if (modal) modal.remove();
};

window.confirmUpgrade = async function(email, newTier, currentTier) {
    const isTrial = $('upgradeTrialCheckbox')?.checked || false;
    const isProrated = $('upgradeProratedCheckbox')?.checked || false;
    const notes = $('upgradeNotes')?.value || '';
    const tierData = TIERS[newTier];
    
    // Calculate actual subscription amount
    let subscriptionAmount = newTier === 'pro' ? 25000 : 50000; // Standard prices
    if (isTrial) {
        subscriptionAmount = 0;
    } else if (isProrated && currentTier === 'pro' && newTier === 'elite') {
        subscriptionAmount = 25000; // Only the difference
    }
    
    // Show loading state on button
    const confirmBtn = $('upgradeConfirmBtn');
    const cancelBtn = $('upgradeCancelBtn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span class="animate-pulse">⏳ Upgrading...</span>';
        confirmBtn.classList.add('opacity-70', 'cursor-not-allowed');
    }
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
    }
    
    try {
        await TierService.setUserTier(email, newTier, currentTier, notes, isTrial);
        
        // Set subscription data including trial status and actual amount
        const snapshot = await db.collection('users').where('email', '==', email).get();
        if (!snapshot.empty) {
            const userId = snapshot.docs[0].id;
            const today = new Date().toISOString().split('T')[0];
            
            // Calculate trial end date (30 days from now)
            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + 30);
            
            const updateData = {
                subscriptionLastPaid: today,
                subscriptionUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                isFreeTrial: isTrial,
                trialStartDate: isTrial ? today : null,
                trialEndDate: isTrial ? trialEndDate.toISOString().split('T')[0] : null,
                trialNotes: isTrial ? (notes || 'Free trial upgrade') : null,
                // NEW: Track actual subscription amount for prorated upgrades
                subscriptionAmount: subscriptionAmount,
                isProratedUpgrade: isProrated,
                proratedFrom: isProrated ? currentTier : null,
                upgradeNotes: notes || null
            };
            
            await db.collection('users').doc(userId).update(updateData);
            console.log(`[Subscription] Set for ${email}: trial=${isTrial}, prorated=${isProrated}, amount=$${subscriptionAmount}`);
        }
        
        // Show success briefly then close
        if (confirmBtn) {
            confirmBtn.innerHTML = '✓ Success!';
            confirmBtn.classList.remove('from-purple-600', 'to-pink-600');
            confirmBtn.classList.add('from-green-600', 'to-emerald-600');
        }
        
        // Close modal and refresh after brief delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Force close modal
        const modal = $('upgradeModal');
        if (modal) {
            modal.remove();
            console.log('[Upgrade] Modal closed');
        }
        
        // Show toast and refresh users
        const trialMsg = isTrial ? ' (Trial)' : '';
        const proratedMsg = isProrated ? ` (Prorated: $${(subscriptionAmount/1000).toFixed(0)}k)` : '';
        showToast(`${email} upgraded to ${tierData.name}!${trialMsg}${proratedMsg}`, 'success');
        
        // Refresh users list
        if (typeof loadAllUsers === 'function') {
            loadAllUsers();
        }
        
    } catch (error) {
        console.error('Error upgrading user:', error);
        if (confirmBtn) {
            confirmBtn.innerHTML = '❌ Error - Try Again';
            confirmBtn.disabled = false;
            confirmBtn.classList.remove('opacity-70', 'cursor-not-allowed');
        }
        if (cancelBtn) {
            cancelBtn.style.display = 'block';
        }
        alert('Error upgrading user: ' + error.message);
    }
};

// Convert a trial user to paid subscription
window.convertTrialToPaid = async function(userId, email) {
    if (!confirm(`Convert ${email} from FREE TRIAL to PAID subscription?\n\nThis will mark them as a paying customer and reset their subscription date to today.`)) return;
    
    const paymentNote = prompt('Enter payment confirmation details:');
    if (paymentNote === null) return;
    
    try {
        const today = new Date().toISOString().split('T')[0];
        
        await db.collection('users').doc(userId).update({
            isFreeTrial: false,
            trialStartDate: null,
            trialEndDate: null,
            trialNotes: null,
            subscriptionLastPaid: today,
            subscriptionUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            convertedFromTrial: true,
            trialConvertedAt: firebase.firestore.FieldValue.serverTimestamp(),
            trialConversionNotes: paymentNote || 'Converted to paid'
        });
        
        alert(`✓ ${email} is now a PAID subscriber!\n\nSubscription date set to today.`);
        loadAllUsers();
    } catch (error) {
        console.error('Error converting trial:', error);
        alert('Error: ' + error.message);
    }
};

// Mark a paid user as trial (for corrections/adjustments)
window.markAsTrial = async function(userId, email) {
    if (!confirm(`Mark ${email} as FREE TRIAL?\n\nThis will remove them from revenue calculations.`)) return;
    
    const reason = prompt('Reason for marking as trial (optional):');
    if (reason === null) return;
    
    try {
        const today = new Date().toISOString().split('T')[0];
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 30);
        
        await db.collection('users').doc(userId).update({
            isFreeTrial: true,
            trialStartDate: today,
            trialEndDate: trialEndDate.toISOString().split('T')[0],
            trialNotes: reason || 'Marked as trial by admin',
            subscriptionUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast(`${email} marked as FREE TRIAL`, 'success');
        loadAllUsers();
    } catch (error) {
        console.error('Error marking as trial:', error);
        alert('Error: ' + error.message);
    }
};

window.adminDowngradeUser = async function(email, currentTier, targetTier = 'starter') {
    const tierName = targetTier === 'pro' ? 'Pro' : 'Starter';
    const confirmMsg = targetTier === 'starter' 
        ? `Are you sure you want to reset ${email} to Starter tier?\n\nThis will also clear their subscription payment history and trial status.`
        : `Are you sure you want to downgrade ${email} to Pro tier?\n\nTheir subscription will be adjusted to $25,000/mo.`;
    
    if (!confirm(confirmMsg)) return;
    
    const reason = prompt('Reason for downgrade (optional):');
    if (reason === null) return;
    
    try {
        await TierService.setUserTier(email, targetTier, currentTier, `Downgraded to ${tierName}: ${reason || 'No reason given'}`);
        
        const snapshot = await db.collection('users').where('email', '==', email).get();
        if (!snapshot.empty) {
            const userId = snapshot.docs[0].id;
            
            if (targetTier === 'starter') {
                // Clear subscription data AND trial data when downgrading to starter
                await db.collection('users').doc(userId).update({
                    subscriptionLastPaid: '',
                    subscriptionUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    subscriptionAmount: null,
                    isProratedUpgrade: false,
                    proratedFrom: null,
                    isFreeTrial: false,
                    trialStartDate: null,
                    trialEndDate: null,
                    trialNotes: null
                });
            } else if (targetTier === 'pro') {
                // Downgrading from Elite to Pro - keep subscription but adjust amount
                const today = new Date().toISOString().split('T')[0];
                await db.collection('users').doc(userId).update({
                    subscriptionUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    subscriptionAmount: 25000, // Pro price
                    isProratedUpgrade: false,
                    proratedFrom: null,
                    isFreeTrial: false,
                    trialStartDate: null,
                    trialEndDate: null,
                    trialNotes: null
                });
            }
        }
        
        alert(`${email} downgraded to ${tierName} tier.`);
        loadAllUsers();
    } catch (error) {
        console.error('Error downgrading user:', error);
        alert('Error: ' + error.message);
    }
};

// Admin Tools Functions
window.syncBasePropertiesToAdmin = async function() {
    const adminEmail = 'richard2019201900@gmail.com';
    const adminEmailLower = adminEmail.toLowerCase();
    
    // Base property IDs from data.js (1-14)
    const basePropertyIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    
    // Get current mapping from Firestore
    const ownerMapDoc = await db.collection('settings').doc('ownerPropertyMap').get();
    let currentMap = ownerMapDoc.exists ? ownerMapDoc.data() : {};
    
    // Ensure admin has all base properties
    if (!currentMap[adminEmail]) {
        currentMap[adminEmail] = [];
    }
    
    let added = 0;
    basePropertyIds.forEach(propId => {
        if (!currentMap[adminEmail].includes(propId)) {
            currentMap[adminEmail].push(propId);
            added++;
        }
        // Also update local mapping
        if (!ownerPropertyMap[adminEmailLower]) {
            ownerPropertyMap[adminEmailLower] = [];
        }
        if (!ownerPropertyMap[adminEmailLower].includes(propId)) {
            ownerPropertyMap[adminEmailLower].push(propId);
        }
        propertyOwnerEmail[propId] = adminEmailLower;
    });
    
    // Save to Firestore
    if (added > 0) {
        await db.collection('settings').doc('ownerPropertyMap').set(currentMap, { merge: true });
        console.log(`[syncBasePropertiesToAdmin] Added ${added} properties to admin mapping`);
        
        // Refresh the admin panel
        if (window.adminUsersData && window.adminUsersData.length > 0) {
            renderAdminUsersList(window.adminUsersData);
            updateAdminStats(window.adminUsersData);
        }
        
        showToast(`✓ Synced ${added} properties to admin`, 'success');
    } else {
        console.log('[syncBasePropertiesToAdmin] All base properties already mapped');
        showToast('All base properties already synced', 'info');
    }
    
    return added;
};

// Auto-sync base properties on admin panel load
window.ensureBasePropertiesSynced = function() {
    const adminEmail = 'richard2019201900@gmail.com'.toLowerCase();
    const currentMapping = ownerPropertyMap[adminEmail] || [];
    
    // Check if property 13 (Villa) is missing
    if (!currentMapping.includes(13)) {
        console.log('[ensureBasePropertiesSynced] Property 13 (Villa) missing, syncing...');
        syncBasePropertiesToAdmin();
    }
};

window.copyBulkEmailList = function() {
    const emails = window.adminUsersData.map(u => u.email).join(', ');
    navigator.clipboard.writeText(emails).then(() => {
        alert(`Copied ${window.adminUsersData.length} emails to clipboard!`);
    });
};

// Copy phone number (digits only, no formatting)
window.copyPhoneNumber = function(phone) {
    // Strip all non-numeric characters
    const digitsOnly = (phone || '').replace(/[^0-9]/g, '');
    navigator.clipboard.writeText(digitsOnly).then(() => {
        showToast('📱 Phone copied: ' + digitsOnly, 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = digitsOnly;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('📱 Phone copied: ' + digitsOnly, 'success');
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
            const biweeklyPrice = parseInt($('newListingBiweekly').value) || 0;
            const monthlyPrice = parseInt($('newListingMonthly').value) || 0;
            const imagesText = $('newListingImages').value.trim();
            const isPremium = $('newListingPremium')?.checked || false;
            
            // Debug logging
            console.log('[CreateListing] Form values:', {
                title, type, location, bedrooms, bathrooms, storage, 
                interiorType, weeklyPrice, biweeklyPrice, monthlyPrice, isPremium
            });
            
            // Parse images - empty array will trigger the card's built-in placeholder
            const images = imagesText 
                ? imagesText.split('\n').map(url => url.trim()).filter(url => url)
                : [];
            
            // Validate - only weekly price is required
            if (!title || !type || !location || !bedrooms || !bathrooms || !weeklyPrice) {
                errorDiv.textContent = 'Please fill in all required fields (Weekly Price is required).';
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
                    biweeklyPrice: biweeklyPrice,
                    monthlyPrice: monthlyPrice,
                    images: images,
                    videoUrl: null,
                    features: false,
                    ownerEmail: ownerEmail,
                    isPremium: isPremium,
                    premiumRequestedAt: isPremium ? new Date().toISOString() : null,
                    createdAt: new Date().toISOString(),
                    createdAtTimestamp: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                // CRITICAL: Clear any stale property overrides for this ID FIRST
                // This must happen BEFORE adding to local state or saving to Firestore
                console.log('[CreateListing] Clearing overrides for property', newId);
                console.log('[CreateListing] Current state.propertyOverrides[' + newId + ']:', state.propertyOverrides[newId]);
                delete state.propertyOverrides[newId];
                
                // Get all fields that need to be deleted (all possible override fields)
                const overrideFields = ['bedrooms', 'bathrooms', 'storage', 'weeklyPrice', 'biweeklyPrice', 'monthlyPrice', 
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
                
                // Track last property posted time for this user
                try {
                    const user = auth.currentUser;
                    if (user) {
                        await db.collection('users').doc(user.uid).set({
                            lastPropertyPostedAt: new Date().toISOString(),
                            lastPropertyPosted: firebase.firestore.FieldValue.serverTimestamp()
                        }, { merge: true });
                        console.log('[CreateListing] Updated lastPropertyPosted time');
                    }
                } catch (e) {
                    console.warn('[CreateListing] Could not update lastPropertyPosted:', e);
                }
                
                // Log premium listing fee if premium was selected
                if (isPremium && typeof logPayment === 'function') {
                    try {
                        await logPayment(newId, {
                            paymentDate: new Date().toISOString().split('T')[0],
                            amount: 10000,
                            frequency: 'premium',
                            renterName: '👑 Premium Listing Fee',
                            type: 'premium_fee',
                            notes: 'Premium listing activation - weekly fee',
                            recordedAt: new Date().toISOString()
                        });
                        console.log('[CreateListing] Premium listing fee logged: $10,000');
                    } catch (e) {
                        console.warn('[CreateListing] Could not log premium fee:', e);
                    }
                }
                
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
    const propertyTitle = window.pendingDeleteProperty.title;
    const btn = $('confirmDeleteBtn');
    
    btn.disabled = true;
    btn.textContent = 'Deleting...';
    
    try {
        // Get the ACTUAL property owner's email (not the current user - could be admin)
        const actualOwnerEmail = (propertyOwnerEmail[propertyId] || '').toLowerCase();
        const currentUserEmail = (auth.currentUser?.email || '').toLowerCase();
        const isAdminDeleting = currentUserEmail !== actualOwnerEmail && actualOwnerEmail !== '';
        
        console.log('[Delete] Property:', propertyId, 'Owner:', actualOwnerEmail, 'Deleted by:', currentUserEmail, 'Admin?', isAdminDeleting);
        
        // Remove from local properties array
        const propIndex = properties.findIndex(p => p.id === propertyId);
        if (propIndex !== -1) {
            properties.splice(propIndex, 1);
        }
        
        // Remove from owner map (use actual owner's email)
        const ownerForMap = actualOwnerEmail || currentUserEmail;
        if (ownerPropertyMap[ownerForMap]) {
            const idx = ownerPropertyMap[ownerForMap].indexOf(propertyId);
            if (idx !== -1) {
                ownerPropertyMap[ownerForMap].splice(idx, 1);
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
            [ownerForMap]: ownerPropertyMap[ownerForMap] || []
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
        
        // CREATE DELETION NOTIFICATION for the property owner (if admin is deleting someone else's property)
        if (isAdminDeleting && actualOwnerEmail) {
            // Find the owner's user document and set deletedProperty field
            // This triggers their existing user document listener
            const ownerSnapshot = await db.collection('users')
                .where('email', '==', actualOwnerEmail)
                .get();
            
            if (!ownerSnapshot.empty) {
                const ownerDoc = ownerSnapshot.docs[0];
                await db.collection('users').doc(ownerDoc.id).update({
                    deletedProperty: {
                        propertyId: propertyId,
                        propertyTitle: propertyTitle,
                        deletedBy: currentUserEmail,
                        deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        acknowledged: false
                    }
                });
                console.log('[Delete] Set deletion notification on user document:', actualOwnerEmail);
            }
        }
        
        // Update filtered properties
        state.filteredProperties = [...properties];
        
        // Re-render
        renderProperties(state.filteredProperties);
        renderOwnerDashboard();
        
        // Update tier badge to reflect new listing count
        updateTierBadge(state.userTier || 'starter', currentUserEmail);
        
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
                
                if (snapshot.empty) {
                    hideElement(banner);
                    container.innerHTML = '';
                    // Hide header badge
                    if (userBadge) hideElement(userBadge);
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
                const userBadge = $('userNotificationBadge');
                if (userBadge) hideElement(userBadge);
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
                        console.log('[UserSync] Document not found but account is being created - ignoring');
                        return;
                    }
                    // User document was deleted - force logout
                    console.log('[UserSync] User document deleted - forcing logout');
                    forceLogout();
                    return;
                }
                
                const data = doc.data();
                const newTier = data.tier || 'starter';
                
                // CHECK FOR PROPERTY DELETION NOTIFICATION
                if (data.deletedProperty && !data.deletedProperty.acknowledged) {
                    console.log('[PropertySync] Property deletion detected:', data.deletedProperty);
                    
                    const deletedProp = data.deletedProperty;
                    
                    // Remove from local properties array
                    const index = properties.findIndex(p => 
                        p.id === deletedProp.propertyId || String(p.id) === String(deletedProp.propertyId)
                    );
                    if (index !== -1) {
                        properties.splice(index, 1);
                        console.log('[PropertySync] Removed property from local array');
                    }
                    
                    // Remove from owner map
                    const lowerEmail = user.email.toLowerCase();
                    if (ownerPropertyMap[lowerEmail]) {
                        ownerPropertyMap[lowerEmail] = ownerPropertyMap[lowerEmail].filter(
                            id => id !== deletedProp.propertyId && String(id) !== String(deletedProp.propertyId)
                        );
                    }
                    
                    // Remove from state
                    delete state.availability[deletedProp.propertyId];
                    delete state.propertyOverrides[deletedProp.propertyId];
                    
                    // Show notification modal
                    showPropertyDeletedModal(deletedProp.propertyTitle || 'Your property');
                    
                    // Mark as acknowledged
                    await db.collection('users').doc(user.uid).update({
                        'deletedProperty.acknowledged': true
                    });
                }
                
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
