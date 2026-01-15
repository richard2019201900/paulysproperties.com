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

/**
 * Extract first name from full name for friendly messages
 * - Keeps titles (Dr., Mr., Mrs., Ms., etc.)
 * - Keeps both words for names like "DJ Mike", "Big Tony", "Lil Wayne"
 * - Otherwise returns just the first name
 */
const getFirstName = (fullName) => {
    if (!fullName || typeof fullName !== 'string') return fullName || '';
    
    const name = fullName.trim();
    const parts = name.split(/\s+/);
    
    if (parts.length <= 1) return name;
    
    // Check for titles - keep title + first name
    const titles = ['dr.', 'dr', 'mr.', 'mr', 'mrs.', 'mrs', 'ms.', 'ms', 'prof.', 'prof', 'rev.', 'rev'];
    if (titles.includes(parts[0].toLowerCase())) {
        return parts.slice(0, 2).join(' ');
    }
    
    // Check for prefixes that should keep both words
    const prefixes = ['dj', 'big', 'lil', 'lil\'', 'young', 'old', 'king', 'queen', 'sir', 'lady', 'mc', 'el', 'la'];
    if (prefixes.includes(parts[0].toLowerCase())) {
        return parts.slice(0, 2).join(' ');
    }
    
    // Default: return first name only
    return parts[0];
};

// Make it globally available
window.getFirstName = getFirstName;

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
    
    // If opening contact modal, prefill the message
    if (id === 'contactModal') {
        const modalMessage = $('modalMessage');
        if (modalMessage && !modalMessage.value.trim()) {
            modalMessage.value = "Hey Pauly, I'm interested in learning more about some of your properties. Please contact me when you get a chance. Thanks!";
        }
    }
    
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
    const defaultPhone = '2057028233'; // Pauly's number as fallback
    let usedFallback = false; // Track if we had to use fallback
    
    $('modalTitle').textContent = isRent ? 'Rent This Property' : 'Purchase This Property';
    $('modalTitle').className = `text-3xl font-black bg-gradient-to-r from-${colors[0]}-500 to-${colors[1]}-600 bg-clip-text text-transparent mb-4 text-center`;
    $('modalPropertyName').textContent = (isRent ? 'Rent: ' : 'Purchase: ') + propertyTitle;
    $('modalMessage').value = isRent 
        ? `Hello! I came across your listing for ${propertyTitle} on PaulysProperties.com and I'm interested in renting it. Please contact me ASAP to discuss availability and next steps.`
        : `Hello! I came across your listing for ${propertyTitle} on PaulysProperties.com and I'm interested in purchasing it. Please contact me ASAP to discuss further.`;
    
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
    usedFallback = true; // Assume fallback until we find a better contact
    
    // Check for assigned agents first (for BOTH rent and purchase offers)
    let agentContacts = [];
    if (typeof getAgentContactsForProperty === 'function') {
        try {
            agentContacts = await getAgentContactsForProperty(propertyId);
        } catch (e) {
        }
    }
    
    // If agents are assigned, show their contact info
    if (agentContacts.length > 0) {
        usedFallback = false;
        if (agentContacts.length === 1) {
            // Single agent
            $('modalPhone').value = agentContacts[0].phone.replace(/\D/g, '');
        } else {
            // Multiple agents - show all phones
            const phonesHtml = agentContacts.map(a => 
                `<div class="bg-gray-700 rounded-lg p-2 text-center">
                    <div class="text-white font-bold">${a.username}</div>
                    <div class="text-cyan-400 font-mono text-lg">${a.phone}</div>
                </div>`
            ).join('');
            
            // Update the accent section to show multiple contacts
            accent.innerHTML = `
                <div class="text-gray-300 text-sm mb-3">
                    <strong>🏢 Multiple Real Estate Agents</strong><br>
                    This property has ${agentContacts.length} agents. Text <strong>ALL</strong> of them for the quickest response!
                </div>
                <div class="grid grid-cols-${Math.min(agentContacts.length, 3)} gap-2">
                    ${phonesHtml}
                </div>
            `;
            
            // Set the first agent's phone in the input
            $('modalPhone').value = agentContacts[0].phone.replace(/\D/g, '');
        }
    } else {
        // No agents - use owner contact (existing behavior)
        try {
            if (propertyId && typeof db !== 'undefined') {
                // Get property data to find owner contact info
                const propsDoc = await db.collection('settings').doc('properties').get();
                if (propsDoc.exists) {
                    const properties = propsDoc.data();
                    const property = properties[propertyId] || properties[String(propertyId)];
                    
                    if (property) {
                        // Check ownerContactPhone first (synced from user profile)
                        if (property.ownerContactPhone) {
                            $('modalPhone').value = property.ownerContactPhone.replace(/\D/g, '');
                            usedFallback = false;
                        }
                        // Then check legacy ownerPhone field
                        else if (property.ownerPhone) {
                            $('modalPhone').value = property.ownerPhone.replace(/\D/g, '');
                            usedFallback = false;
                        }
                        // Finally try user doc (may fail for non-admins due to permissions)
                        else if (property.ownerEmail) {
                            try {
                                const usersSnapshot = await db.collection('users')
                                    .where('email', '==', property.ownerEmail.toLowerCase())
                                    .limit(1)
                                    .get();
                                
                                if (!usersSnapshot.empty) {
                                    const userData = usersSnapshot.docs[0].data();
                                    if (userData.phone) {
                                        $('modalPhone').value = userData.phone.replace(/\D/g, '');
                                        usedFallback = false;
                                    }
                                }
                            } catch (permError) {
                                // Permission denied - expected for non-admins
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('[Contact] Could not fetch owner phone, using default:', error);
        }
    }
    
    // If we used the fallback, notify admin via activity log
    if (usedFallback) {
        console.warn('[Contact] FALLBACK USED: Property', propertyId, '(' + propertyTitle + ') - Missing owner contact info');
        
        // Log to activity log if admin is logged in
        if (typeof logActivity === 'function' && auth.currentUser) {
            logActivity('contact_fallback', 'Fallback phone used for: ' + propertyTitle + ' (ID: ' + propertyId + ') - Owner contact info missing');
        }
        
        // Also create an admin notification in Firestore
        try {
            if (typeof db !== 'undefined') {
                await db.collection('adminNotifications').add({
                    type: 'missing_contact',
                    propertyId: propertyId,
                    propertyTitle: propertyTitle,
                    message: 'Property is using fallback contact number - owner phone/agent not configured',
                    timestamp: new Date().toISOString(),
                    resolved: false
                });
            }
        } catch (notifError) {
            // Non-critical, just log it
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
    
    // Reset package selection
    window.selectedPhotoPackage = null;
    
    // All option elements
    const options = {
        single: {
            el: document.getElementById('photoOptionSingle'),
            check: document.getElementById('photoSingleCheck'),
            borderSelected: ['border-green-500', 'ring-2', 'ring-green-500/50'],
            borderDefault: ['border-gray-600']
        },
        bundle: {
            el: document.getElementById('photoOptionBundle'),
            check: document.getElementById('photoBundleCheck'),
            borderSelected: ['border-amber-400', 'ring-2', 'ring-amber-500/50'],
            borderDefault: ['border-amber-500']
        },
        rental: {
            el: document.getElementById('managedOptionRental'),
            check: document.getElementById('managedRentalCheck'),
            borderSelected: ['border-purple-500', 'ring-2', 'ring-purple-500/50'],
            borderDefault: ['border-gray-600']
        },
        sale: {
            el: document.getElementById('managedOptionSale'),
            check: document.getElementById('managedSaleCheck'),
            borderSelected: ['border-pink-500', 'ring-2', 'ring-pink-500/50'],
            borderDefault: ['border-gray-600']
        }
    };
    
    // Reset all options to default state
    Object.keys(options).forEach(key => {
        const opt = options[key];
        if (!opt.el) return;
        opt.borderSelected.forEach(cls => opt.el.classList.remove(cls));
        opt.borderDefault.forEach(cls => opt.el.classList.add(cls));
        if (opt.check) opt.check.classList.add('hidden');
    });
    
    // Reset the copy button state
    const btnText = document.getElementById('photoServicesBtnText');
    const btn = document.getElementById('photoServicesCopyBtn');
    if (btnText) {
        btnText.textContent = 'Select an option above';
    }
    if (btn) {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
};

// Initialize photo package click handlers using event delegation
(function initPhotoPackageHandlers() {
    function setupDelegation() {
        // Use event delegation on document to catch clicks on photo package options
        document.addEventListener('click', function(e) {
            // Check if clicked element or its parent is a photo option
            const singleOption = e.target.closest('#photoOptionSingle');
            const bundleOption = e.target.closest('#photoOptionBundle');
            
            if (singleOption) {
                e.preventDefault();
                e.stopPropagation();
                window.selectPhotoPackage('single');
            } else if (bundleOption) {
                e.preventDefault();
                e.stopPropagation();
                window.selectPhotoPackage('bundle');
            }
        });
    }
    
    // Run immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupDelegation);
    } else {
        setupDelegation();
    }
})();

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

// Track selected photo package
window.selectedPhotoPackage = null;

// Select a photo/service option (mutually exclusive)
window.selectPhotoServiceOption = function(optionType) {
    window.selectedPhotoPackage = optionType;
    
    // All option elements
    const options = {
        single: {
            el: document.getElementById('photoOptionSingle'),
            check: document.getElementById('photoSingleCheck'),
            borderSelected: ['border-green-500', 'ring-2', 'ring-green-500/50'],
            borderDefault: ['border-gray-600']
        },
        bundle: {
            el: document.getElementById('photoOptionBundle'),
            check: document.getElementById('photoBundleCheck'),
            borderSelected: ['border-amber-400', 'ring-2', 'ring-amber-500/50'],
            borderDefault: ['border-amber-500']
        },
        rental: {
            el: document.getElementById('managedOptionRental'),
            check: document.getElementById('managedRentalCheck'),
            borderSelected: ['border-purple-500', 'ring-2', 'ring-purple-500/50'],
            borderDefault: ['border-gray-600']
        },
        sale: {
            el: document.getElementById('managedOptionSale'),
            check: document.getElementById('managedSaleCheck'),
            borderSelected: ['border-pink-500', 'ring-2', 'ring-pink-500/50'],
            borderDefault: ['border-gray-600']
        }
    };
    
    const btnText = document.getElementById('photoServicesBtnText');
    
    // Button text for each option (no prices for managed - they see it on the card)
    const buttonInfo = {
        single: { text: 'Copy & Notify: Per Photo', emoji: '📷', name: 'Per Photo ($5k min 10)' },
        bundle: { text: 'Copy & Notify: Premium Bundle', emoji: '🎬', name: 'Premium Bundle ($75k)' },
        rental: { text: 'Copy & Notify: Managed Rental', emoji: '🏘️', name: 'Managed Rental ($25k + 10%)' },
        sale: { text: 'Copy & Notify: Managed Sale', emoji: '🏆', name: 'Managed Sale ($50k + 10%)' }
    };
    
    // Reset all options, then select the chosen one
    Object.keys(options).forEach(key => {
        const opt = options[key];
        if (!opt.el) return;
        
        if (key === optionType) {
            // Select this option
            opt.borderDefault.forEach(cls => opt.el.classList.remove(cls));
            opt.borderSelected.forEach(cls => opt.el.classList.add(cls));
            if (opt.check) opt.check.classList.remove('hidden');
        } else {
            // Deselect this option
            opt.borderSelected.forEach(cls => opt.el.classList.remove(cls));
            opt.borderDefault.forEach(cls => opt.el.classList.add(cls));
            if (opt.check) opt.check.classList.add('hidden');
        }
    });
    
    // Update button text
    if (btnText && buttonInfo[optionType]) {
        btnText.textContent = buttonInfo[optionType].text;
    }
};

// Legacy alias for old click handlers
window.selectPhotoPackage = window.selectPhotoServiceOption;

window.copyAndNotifyPhotoServices = async function() {
    const user = auth.currentUser;
    const btnText = document.getElementById('photoServicesBtnText');
    const btn = document.getElementById('photoServicesCopyBtn');
    
    // Check if package is selected
    if (!window.selectedPhotoPackage) {
        showToast('⚠️ Please select an option first', 'warning');
        return;
    }
    
    const packageType = window.selectedPhotoPackage;
    
    // Package info for all options
    const packageInfo = {
        single: { name: 'Per Photo ($5k min 10)', emoji: '📷', type: 'photo_inquiry' },
        bundle: { name: 'Premium Bundle ($75k)', emoji: '🎬', type: 'photo_inquiry' },
        rental: { name: 'Managed Rental ($25k + 10%)', emoji: '🏘️', type: 'managed_rental' },
        sale: { name: 'Managed Sale ($50k + 10%)', emoji: '🏆', type: 'managed_sale' }
    };
    
    const info = packageInfo[packageType] || packageInfo.single;
    
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
            type: info.type,
            packageType: packageType,
            packageName: info.name,
            status: 'pending',
            viewed: false
        });
        
        // Update button to show success
        if (btnText) {
            btnText.textContent = `✅ ${info.emoji} ${info.name} - Team Notified!`;
        }
        if (btn) {
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
        }
        
        showToast(`${info.emoji} Phone copied! Our team has been notified you're interested in ${info.name}!`, 'success');
        
    } catch (error) {
        console.error('[PhotoServices] Error creating notification:', error);
        // Still show success for copy even if notification failed
        showToast('📱 Phone number copied!', 'success');
        if (btnText) {
            btnText.textContent = '✅ Copied!';
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

// ==================== MANAGED SERVICES PROMPT ====================

/**
 * Show a prompt after listing creation asking if user wants managed services
 */
window.showManagedServicesPrompt = function(propertyId) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('managedServicesPromptModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'managedServicesPromptModal';
        modal.className = 'fixed inset-0 bg-black/80 z-[60] flex items-center justify-center hidden';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.innerHTML = `
            <div class="glass-effect rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 border border-purple-500/50 animate-fade-in">
                <div class="text-center mb-4">
                    <div class="text-5xl mb-3">🎉</div>
                    <h2 class="text-xl font-bold text-white mb-2">Listing Created!</h2>
                    <p class="text-gray-300 text-sm">Want us to handle the rest?</p>
                </div>
                
                <div class="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-4 border border-purple-500/30 mb-4">
                    <h3 class="text-purple-400 font-bold mb-2 flex items-center gap-2">
                        <span>🏠</span> Turn-Key Property Management
                    </h3>
                    <p class="text-gray-300 text-sm mb-3">Let Pauly handle everything — professional photos, premium listing, tours, tenant screening, and more!</p>
                    <ul class="text-xs text-gray-400 space-y-1">
                        <li class="flex items-center gap-2"><span class="text-purple-400">✓</span> Professional photos & video included</li>
                        <li class="flex items-center gap-2"><span class="text-purple-400">✓</span> Premium listing placement</li>
                        <li class="flex items-center gap-2"><span class="text-purple-400">✓</span> Tenant/buyer screening & tours</li>
                        <li class="flex items-center gap-2"><span class="text-purple-400">✓</span> Just hand over the keys!</li>
                    </ul>
                </div>
                
                <div class="flex gap-3">
                    <button onclick="closeManagedServicesPrompt(); openPhotoServicesModal();" class="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-xl font-bold hover:opacity-90 transition">
                        📸 Tell Me More
                    </button>
                    <button onclick="closeManagedServicesPrompt();" class="flex-1 bg-gray-700 text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-600 transition">
                        I'll Do It Myself
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Store property ID for reference
    modal.dataset.propertyId = propertyId;
    
    // Show modal
    modal.classList.remove('hidden');
};

/**
 * Close the managed services prompt
 */
window.closeManagedServicesPrompt = function() {
    const modal = document.getElementById('managedServicesPromptModal');
    if (modal) {
        modal.classList.add('hidden');
    }
};
