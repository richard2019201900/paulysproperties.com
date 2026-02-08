/**
 * ============================================================================
 * UI PROPERTY MANAGEMENT - Property creation, deletion, and management
 * ============================================================================
 * 
 * CONTENTS:
 * - Create listing modal
 * - Delete property
 * - Copy dashboard reminder
 * 
 * DEPENDENCIES: TierService, PropertyDataService, OwnershipService
 * ============================================================================
 */

// ==================== CREATE LISTING ====================
window.openCreateListingModal = async function() {
    hideElement($('mobileMenu'));
    
    // Check tier limits before opening
    const user = auth.currentUser;
    if (!user) {
        // Not logged in - open login modal and show create account form
        openModal('loginModal');
        setTimeout(function() {
            if (typeof showCreateAccountForm === 'function') {
                showCreateAccountForm();
            }
        }, 100);
        showToast('Please sign up or log in to list a property', 'info');
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
                    'newListingBiweekly', 'newListingMonthly', 'newListingBuyPrice', 'newListingImages'];
    inputs.forEach(id => {
        const el = $(id);
        if (el) el.value = '';
    });
    
    // Reset selects to first option
    const typeSelect = $('newListingType');
    if (typeSelect) typeSelect.selectedIndex = 0;
    const interiorSelect = $('newListingInterior');
    if (interiorSelect) interiorSelect.selectedIndex = 0;
    
    // Reset buy price warning and hint
    hideElement($('buyPriceWarning'));
    const hintDiv = $('buyPriceHint');
    if (hintDiv) hintDiv.textContent = 'Enter a price if this property is available for purchase';
    
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
    hideElement($('priceWarning'));
    
    // Show/hide admin-only free trial option
    const trialOption = $('newListingTrialOption');
    if (trialOption) {
        const isAdmin = typeof TierService !== 'undefined' && TierService.isMasterAdmin(auth.currentUser?.email);
        if (!isAdmin) {
            trialOption.classList.add('hidden');
            trialOption.style.display = 'none'; // Extra insurance
        } else {
            trialOption.style.display = ''; // Allow CSS toggle to work
        }
    }
    // Reset trial checkbox
    const trialCheck = $('newListingPremiumTrial');
    if (trialCheck) trialCheck.checked = false;
    
    openModal('createListingModal');
};

// Handle create listing form submission
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners for fields that affect buy price validation
    const buyPriceAffectingFields = ['newListingType', 'newListingInterior', 'newListingStorage', 'newListingTitle'];
    buyPriceAffectingFields.forEach(id => {
        const el = $(id);
        if (el) {
            el.addEventListener('change', validateBuyPrice);
            el.addEventListener('input', validateBuyPrice);
        }
    });
    
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
            const bedrooms = parseInt($('newListingBedrooms').value) || 0;
            const bathrooms = parseInt($('newListingBathrooms').value) || 0;
            const storage = parseInt($('newListingStorage').value) || 0;
            const interiorType = $('newListingInterior').value;
            const weeklyPrice = parseInt($('newListingWeekly').value) || 0;
            const biweeklyPrice = parseInt($('newListingBiweekly').value) || 0;
            const monthlyPrice = parseInt($('newListingMonthly').value) || 0;
            const buyPrice = parseInt($('newListingBuyPrice')?.value) || 0;
            const imagesText = $('newListingImages').value.trim();
            const isPremium = $('newListingPremium')?.checked || false;
            const isPremiumTrial = isPremium && ($('newListingPremiumTrial')?.checked || false);
            const warningDiv = $('createListingWarning');
            
            // Hide warning div if it exists
            if (warningDiv) hideElement(warningDiv);
            
            // Debug logging
            // Parse images - empty array will trigger the card's built-in placeholder
            const images = imagesText 
                ? imagesText.split('\n').map(url => url.trim()).filter(url => url)
                : [];
            
            // Validate required fields: Address, Type, Storage, Interior
            if (!title || !type || !storage || !interiorType) {
                errorDiv.textContent = 'Please fill in all required fields (Address, Type, Storage, and Interior).';
                showElement(errorDiv);
                return;
            }
            
            // Validate image URLs if provided
            if (images.length > 0) {
                // Check for local file paths (block completely)
                const localFilePaths = images.filter(url => url.startsWith('file:///') || url.match(/^[A-Za-z]:\\/));
                if (localFilePaths.length > 0) {
                    errorDiv.innerHTML = `<strong>❌ Local file paths don't work!</strong><br>
                        Files on your computer (like <code class="text-red-300">C:\\Users\\...</code>) can't be seen by other users.<br>
                        <span class="text-cyan-400">Please upload to <a href="https://fivemanage.com" target="_blank" class="underline">fivemanage.com</a> first, then paste the link here.</span>`;
                    showElement(errorDiv);
                    return;
                }
                
                // Check for invalid URLs
                const invalidUrls = images.filter(url => !url.startsWith('http://') && !url.startsWith('https://'));
                if (invalidUrls.length > 0) {
                    errorDiv.textContent = `Invalid URL(s): ${invalidUrls.slice(0, 2).join(', ')}${invalidUrls.length > 2 ? '...' : ''}. URLs must start with http:// or https://`;
                    showElement(errorDiv);
                    return;
                }
                
                // Check for Discord links (warning, not error)
                const discordUrls = images.filter(url => url.includes('cdn.discordapp.com') || url.includes('media.discordapp.net'));
                if (discordUrls.length > 0 && warningDiv && !window.createListingDiscordWarningAcknowledged) {
                    warningDiv.innerHTML = `<div class="flex items-start gap-2">
                        <span class="text-yellow-400">⚠️</span>
                        <div>
                            <strong class="text-yellow-300">Warning: Discord links expire!</strong><br>
                            <span class="text-gray-300">Discord image links stop working after a few weeks. Your property photos will break.</span><br>
                            <span class="text-cyan-400">We recommend using <a href="https://fivemanage.com" target="_blank" class="underline font-semibold">fivemanage.com</a> instead (it's free!).</span>
                        </div>
                    </div>
                    <div class="mt-2 flex gap-2">
                        <button type="button" onclick="window.createListingDiscordWarningAcknowledged=true; document.getElementById('createListingWarning').classList.add('hidden'); document.getElementById('createListingBtn').click();" class="bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1 rounded text-sm font-bold">Create Anyway</button>
                        <button type="button" onclick="document.getElementById('createListingWarning').classList.add('hidden');" class="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm font-bold">Let Me Fix It</button>
                    </div>`;
                    showElement(warningDiv);
                    return;
                }
            }
            
            // Reset Discord warning flag for next time
            window.createListingDiscordWarningAcknowledged = false;
            
            // Validate buy price against government minimum (HARD BLOCK)
            if (buyPrice > 0) {
                const minInfo = getMinimumBuyPriceForForm();
                if (buyPrice < minInfo.min) {
                    errorDiv.innerHTML = `
                        <strong>🚫 Government Minimum Violation</strong><br>
                        ${minInfo.category} requires minimum <strong>$${minInfo.min.toLocaleString()}</strong>.<br>
                        Your price: $${buyPrice.toLocaleString()} (Short by $${(minInfo.min - buyPrice).toLocaleString()})
                    `;
                    showElement(errorDiv);
                    // Highlight the buy price field
                    const buyPriceInput = $('newListingBuyPrice');
                    if (buyPriceInput) {
                        buyPriceInput.classList.add('border-red-500', 'ring-2', 'ring-red-500');
                        buyPriceInput.focus();
                    }
                    return;
                }
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
                
                // Fetch owner's contact info for public visibility
                // Uses same display name hierarchy as data.js resolveDisplayName()
                let ownerContactPhone = null;
                let ownerDisplayName = null;
                try {
                    const user = auth.currentUser;
                    if (user) {
                        const userDoc = await db.collection('users').doc(user.uid).get();
                        if (userDoc.exists) {
                            const userData = userDoc.data();
                            ownerContactPhone = userData.phone ? userData.phone.replace(/\D/g, '') : null;
                            
                            // Display name hierarchy (matches data.js resolveDisplayName):
                            // displayName (with space) > firstName+lastName > firstName > displayName > username > email prefix
                            if (userData.displayName && userData.displayName.includes(' ')) {
                                ownerDisplayName = userData.displayName;
                            } else if (userData.firstName && userData.lastName) {
                                ownerDisplayName = userData.firstName + ' ' + userData.lastName;
                            } else if (userData.firstName) {
                                ownerDisplayName = userData.firstName;
                            } else if (userData.displayName) {
                                ownerDisplayName = userData.displayName;
                            } else if (userData.username) {
                                ownerDisplayName = userData.username;
                            } else {
                                ownerDisplayName = ownerEmail.split('@')[0];
                            }
                        }
                    }
                } catch (phoneErr) {
                    console.warn('[CreateListing] Could not fetch owner info:', phoneErr);
                }
                
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
                    buyPrice: buyPrice, // Buy It Now Price (0 if not for sale)
                    images: images,
                    videoUrl: null,
                    features: false,
                    ownerEmail: ownerEmail,
                    ownerContactPhone: ownerContactPhone, // Public contact phone (synced from profile)
                    ownerDisplayName: ownerDisplayName,   // Public display name (synced from profile)
                    isPremium: isPremium,
                    isPremiumTrial: isPremiumTrial,
                    premiumRequestedAt: isPremium ? new Date().toISOString() : null,
                    premiumTrialStartDate: isPremiumTrial ? new Date().toISOString().split('T')[0] : null,
                    premiumTrialEnds: isPremiumTrial ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
                    createdAt: new Date().toISOString(),
                    createdAtTimestamp: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                // Add to local properties array
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
                
                // Save property to Firestore (ownerEmail field is the source of truth)
                await db.collection('settings').doc('properties').set({
                    [newId]: newProperty
                }, { merge: true });
                
                // Track last property posted time for this user
                try {
                    const user = auth.currentUser;
                    if (user) {
                        await db.collection('users').doc(user.uid).set({
                            lastPropertyPostedAt: new Date().toISOString(),
                            lastPropertyPosted: firebase.firestore.FieldValue.serverTimestamp()
                        }, { merge: true });
                    }
                } catch (e) {
                    console.warn('[CreateListing] Could not update lastPropertyPosted:', e);
                }
                
                // Log premium listing fee if premium was selected (skip for free trials)
                if (isPremium && !isPremiumTrial && typeof logPayment === 'function') {
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
                
                // Award XP for new listing (gamification)
                if (typeof GamificationService !== 'undefined') {
                    const user = auth.currentUser;
                    if (user) {
                        // Check if this is their first listing
                        const currentListingCount = OwnershipService.getListingCount(ownerEmail);
                        if (currentListingCount === 1) {
                            // First listing - award 500 XP
                            GamificationService.awardAchievement(user.uid, 'first_listing', 500, {
                                statUpdate: { propertiesPosted: 1 }
                            }).then(result => {
                                if (result && !result.alreadyEarned) {
                                }
                            }).catch(err => console.error('[Gamification] Error:', err));
                        } else {
                            // Additional listing - award 250 XP
                            GamificationService.awardXP(user.uid, 250, 'additional_listing').then(() => {
                                // Update stats
                                db.collection('users').doc(user.uid).update({
                                    'gamification.stats.propertiesPosted': firebase.firestore.FieldValue.increment(1)
                                }).catch(e => console.warn('[Gamification] Could not update stats:', e));
                            }).catch(err => console.error('[Gamification] Error:', err));
                        }
                        
                        // If premium was selected, award premium XP
                        if (isPremium) {
                            GamificationService.awardAchievement(user.uid, 'premium_listing', 200).then(result => {
                                if (result && !result.alreadyEarned) {
                                }
                            }).catch(err => console.error('[Gamification] Error:', err));
                        }
                    }
                }
                
                // Change button to show success
                btn.textContent = '✓ Created!';
                btn.classList.remove('from-amber-500', 'to-yellow-500');
                btn.classList.add('from-green-500', 'to-emerald-500');
                
                // Show managed services prompt after a short delay
                setTimeout(() => {
                    showManagedServicesPrompt(newId);
                }, 800);
                
                // Close modal after delay (longer to allow prompt to be seen)
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
        
        // Remove from Firestore - properties doc (single source of truth)
        await db.collection('settings').doc('properties').update({
            [propertyId]: firebase.firestore.FieldValue.delete()
        });
        
        // Remove availability
        await db.collection('settings').doc('propertyAvailability').update({
            [propertyId]: firebase.firestore.FieldValue.delete()
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
            }
        }
        
        // Update filtered properties
        state.filteredProperties = [...properties];
        
        // Re-render
        renderProperties(state.filteredProperties);
        renderOwnerDashboard();
        
        // Refresh notification panels (subscription alerts, premium alerts, etc.)
        if (typeof NotificationManager !== 'undefined' && NotificationManager.refreshUI) {
            NotificationManager.refreshUI();
        } else {
            // Fallback: directly refresh premium alerts panel
            if (typeof window.renderPremiumAlertsPanel === 'function') {
                window.renderPremiumAlertsPanel();
            }
            if (typeof window.renderSubscriptionAlertsPanel === 'function') {
                window.renderSubscriptionAlertsPanel();
            }
        }
        
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

// ==================== COPY LISTING FEATURE ====================

/**
 * Open the copy listing modal
 * Allows duplicating a property with options to modify storage and management
 */
window.openCopyListingModal = function(propertyId) {
    const p = properties.find(prop => prop.id === propertyId);
    if (!p) {
        alert('Property not found');
        return;
    }
    
    const currentUserEmail = (auth.currentUser?.email || '').toLowerCase();
    const isAdmin = TierService.isMasterAdmin(currentUserEmail);
    const propertyOwner = (p.ownerEmail || '').toLowerCase();
    
    // Check if user can copy this listing (owner or admin)
    if (!isAdmin && propertyOwner !== currentUserEmail) {
        alert('You can only copy your own listings.');
        return;
    }
    
    // Get current values
    const currentStorage = PropertyDataService.getValue(propertyId, 'storage', p.storage || 0);
    const currentTitle = p.title || 'Untitled Property';
    const hasAgent = p.agentEmail && p.agentEmail !== propertyOwner;
    
    // Build admin-only owner assignment section
    let ownerAssignmentHTML = '';
    let agentDropdownHTML = '';
    
    if (isAdmin) {
        // Admin gets owner assignment dropdown
        ownerAssignmentHTML = `
            <div class="bg-gray-900/50 rounded-xl p-4 border border-red-500/30">
                <label class="block text-red-400 font-bold mb-2">👑 Assign Owner <span class="text-xs text-gray-500">(Admin Only)</span></label>
                <select id="copyListingOwner" 
                        class="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-600 focus:border-red-400 focus:ring-2 focus:ring-red-500/20 transition">
                    <option value="">Loading users...</option>
                </select>
                <p class="text-gray-500 text-xs mt-2">Select which user will own this property</p>
            </div>
        `;
        
        // Agent dropdown for admin
        agentDropdownHTML = `
            <div class="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                <label class="block text-purple-400 font-bold mb-2">🏠 Managing Agent</label>
                <select id="copyListingAgent" 
                        class="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition">
                    <option value="">No Agent (Owner Self-Manages)</option>
                    <option value="loading">Loading agents...</option>
                </select>
                <p class="text-gray-500 text-xs mt-2">Select an agent to manage this property, or leave empty for self-management</p>
            </div>
        `;
    }
    
    // Non-admin management options (original radio buttons)
    const nonAdminManagementHTML = !isAdmin ? `
        <div class="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
            <label class="block text-purple-400 font-bold mb-3">🏠 Property Management</label>
            <div class="space-y-2">
                <label class="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-800/50 transition">
                    <input type="radio" name="copyManagement" value="self" checked
                           class="w-5 h-5 text-purple-500 border-gray-600 focus:ring-purple-500 bg-gray-800">
                    <div>
                        <span class="text-white font-medium">Self-Manage</span>
                        <p class="text-gray-400 text-xs">I'll handle this property myself</p>
                    </div>
                </label>
                <label class="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-800/50 transition">
                    <input type="radio" name="copyManagement" value="agent"
                           class="w-5 h-5 text-purple-500 border-gray-600 focus:ring-purple-500 bg-gray-800">
                    <div>
                        <span class="text-white font-medium">Assign Agent</span>
                        <p class="text-gray-400 text-xs">Pauly Amato will manage this property</p>
                    </div>
                </label>
            </div>
        </div>
    ` : '';
    
    const modalHTML = `
        <div id="copyListingModal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div class="bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full border border-cyan-500/50 max-h-[90vh] overflow-y-auto">
                <div class="p-6">
                    <!-- Header -->
                    <div class="flex justify-between items-start mb-6">
                        <div>
                            <h2 class="text-xl font-bold text-white flex items-center gap-2">
                                <span class="text-2xl">📋</span> Copy Listing
                            </h2>
                            <p class="text-gray-400 text-sm mt-1">Duplicate "${currentTitle}"</p>
                        </div>
                        <button onclick="closeCopyListingModal()" class="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
                    </div>
                    
                    <!-- Copy Options -->
                    <div class="space-y-4">
                        <!-- New Title -->
                        <div class="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                            <label class="block text-cyan-400 font-bold mb-2">📝 New Listing Title</label>
                            <input type="text" 
                                   id="copyListingTitle" 
                                   value="${currentTitle} (Copy)"
                                   class="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition"
                                   placeholder="Enter title for the copy">
                            <p class="text-gray-500 text-xs mt-2">Tip: Change "Apt 105" to "Apt 106", etc.</p>
                        </div>
                        
                        <!-- Storage Amount -->
                        <div class="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                            <label class="block text-amber-400 font-bold mb-2">📦 Storage Space</label>
                            <div class="flex items-center gap-3">
                                <input type="number" 
                                       id="copyListingStorage" 
                                       value="${currentStorage}"
                                       min="0"
                                       class="flex-1 bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition"
                                       placeholder="Storage amount">
                                <span class="text-gray-400 whitespace-nowrap">Current: ${currentStorage}</span>
                            </div>
                            <p class="text-gray-500 text-xs mt-2">Adjust if the new unit has different storage capacity</p>
                        </div>
                        
                        <!-- Admin-only Owner Assignment -->
                        ${ownerAssignmentHTML}
                        
                        <!-- Agent Selection (Admin) or Management Option (Non-Admin) -->
                        ${isAdmin ? agentDropdownHTML : nonAdminManagementHTML}
                        
                        <!-- What Gets Copied -->
                        <div class="bg-cyan-900/20 rounded-xl p-4 border border-cyan-500/30">
                            <p class="text-cyan-300 font-bold text-sm mb-2">✓ What will be copied:</p>
                            <ul class="text-cyan-200/80 text-xs space-y-1">
                                <li>• All property details (beds, baths, type, interior)</li>
                                <li>• All pricing (daily, weekly, biweekly, monthly, buy price)</li>
                                <li>• All images</li>
                                <li>• Description</li>
                            </ul>
                            <p class="text-gray-400 text-xs mt-2">❌ NOT copied: Renter info, payment history, premium status</p>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="flex gap-3 mt-6">
                        <button onclick="closeCopyListingModal()" 
                                class="flex-1 bg-gray-700 text-white py-3 rounded-xl font-bold hover:bg-gray-600 transition">
                            Cancel
                        </button>
                        <button onclick="executeCopyListing(${propertyId})" 
                                class="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-xl font-bold hover:opacity-90 transition flex items-center justify-center gap-2">
                            <span>📋</span> Create Copy
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existing = $('copyListingModal');
    if (existing) existing.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Load users into dropdowns for admin
    if (isAdmin) {
        loadCopyListingDropdowns(propertyOwner);
    }
};

window.closeCopyListingModal = function() {
    const modal = $('copyListingModal');
    if (modal) modal.remove();
};

/**
 * Load users into owner and agent dropdowns for admin copy listing
 */
window.loadCopyListingDropdowns = async function(currentOwnerEmail) {
    const ownerSelect = $('copyListingOwner');
    const agentSelect = $('copyListingAgent');
    
    try {
        // Fetch all users
        const snapshot = await db.collection('users').get();
        const allUsers = [];
        const agents = [];
        
        snapshot.forEach(doc => {
            const user = doc.data();
            if (user.email) {
                // Get display name using same hierarchy as everywhere else
                let displayName;
                if (user.displayName && user.displayName.includes(' ')) {
                    displayName = user.displayName;
                } else if (user.firstName && user.lastName) {
                    displayName = user.firstName + ' ' + user.lastName;
                } else if (user.firstName) {
                    displayName = user.firstName;
                } else if (user.displayName) {
                    displayName = user.displayName;
                } else if (user.username) {
                    displayName = user.username;
                } else {
                    displayName = user.email.split('@')[0];
                }
                
                const tierData = TIERS[user.tier] || TIERS.starter;
                const isMasterAdmin = TierService.isMasterAdmin(user.email);
                
                const userObj = {
                    email: user.email.toLowerCase(),
                    displayName: displayName,
                    tier: user.tier || 'starter',
                    tierIcon: isMasterAdmin ? '👑' : tierData.icon,
                    tierName: isMasterAdmin ? 'Owner' : tierData.name,
                    isMasterAdmin: isMasterAdmin,
                    isAgent: user.isAgent === true
                };
                
                // Add to all users list (for owner dropdown)
                allUsers.push(userObj);
                
                // Add to agents list only if they are a real estate agent OR master admin
                if (user.isAgent === true || isMasterAdmin) {
                    agents.push(userObj);
                }
            }
        });
        
        // Sort all users: Admin first, then by tier, then alphabetically
        allUsers.sort((a, b) => {
            if (a.isMasterAdmin && !b.isMasterAdmin) return -1;
            if (!a.isMasterAdmin && b.isMasterAdmin) return 1;
            if (a.tier === 'elite' && b.tier !== 'elite') return -1;
            if (a.tier !== 'elite' && b.tier === 'elite') return 1;
            return a.displayName.localeCompare(b.displayName);
        });
        
        // Sort agents: Admin first, then alphabetically
        agents.sort((a, b) => {
            if (a.isMasterAdmin && !b.isMasterAdmin) return -1;
            if (!a.isMasterAdmin && b.isMasterAdmin) return 1;
            return a.displayName.localeCompare(b.displayName);
        });
        
        // Populate owner dropdown (all users)
        if (ownerSelect) {
            ownerSelect.innerHTML = '<option value="">-- Select Owner --</option>';
            allUsers.forEach(user => {
                const option = document.createElement('option');
                option.value = user.email;
                option.textContent = `${user.tierIcon} ${user.displayName} (${user.email})`;
                // Pre-select current owner
                if (user.email === currentOwnerEmail) {
                    option.selected = true;
                }
                ownerSelect.appendChild(option);
            });
        }
        
        // Populate agent dropdown (only real estate agents)
        if (agentSelect) {
            agentSelect.innerHTML = '<option value="">No Agent (Owner Self-Manages)</option>';
            agents.forEach(user => {
                const option = document.createElement('option');
                option.value = user.email;
                option.textContent = `${user.tierIcon} ${user.displayName}`;
                agentSelect.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('[CopyListing] Error loading users:', error);
        if (ownerSelect) {
            ownerSelect.innerHTML = '<option value="">Error loading users</option>';
        }
        if (agentSelect) {
            agentSelect.innerHTML = '<option value="">Error loading agents</option>';
        }
    }
};

/**
 * Execute the copy listing operation
 */
window.executeCopyListing = async function(sourcePropertyId) {
    const sourceProperty = properties.find(p => p.id === sourcePropertyId);
    if (!sourceProperty) {
        alert('Source property not found');
        return;
    }
    
    // Get values from modal
    const newTitle = $('copyListingTitle')?.value?.trim();
    const newStorage = parseInt($('copyListingStorage')?.value) || 0;
    
    if (!newTitle) {
        alert('Please enter a title for the new listing');
        return;
    }
    
    // Check for duplicate title
    const existingWithTitle = properties.find(p => p.title?.toLowerCase() === newTitle.toLowerCase());
    if (existingWithTitle) {
        if (!confirm(`A property with the title "${newTitle}" already exists. Create anyway?`)) {
            return;
        }
    }
    
    const currentUserEmail = (auth.currentUser?.email || '').toLowerCase();
    const isAdmin = TierService.isMasterAdmin(currentUserEmail);
    
    // Check listing limits for non-admin
    if (!isAdmin) {
        const userTier = state.userTier || 'starter';
        const userListings = properties.filter(p => 
            (p.ownerEmail || '').toLowerCase() === currentUserEmail
        ).length;
        
        const limits = { starter: 3, elite: Infinity };
        const maxListings = limits[userTier] || 3;
        
        if (userListings >= maxListings) {
            alert(`You've reached your listing limit (${maxListings} for ${userTier} tier). Upgrade to Elite for unlimited listings.`);
            return;
        }
    }
    
    // Show loading state
    const createBtn = document.querySelector('#copyListingModal button:last-child');
    if (createBtn) {
        createBtn.disabled = true;
        createBtn.innerHTML = '<span class="animate-pulse">Creating...</span>';
    }
    
    try {
        // Generate new property ID
        const existingIds = properties.map(p => typeof p.id === 'number' ? p.id : parseInt(p.id) || 0);
        const maxId = Math.max(0, ...existingIds);
        const newId = maxId + 1;
        
        // Determine owner and agent based on admin dropdowns or non-admin radio buttons
        let newOwnerEmail = '';
        let newAgentEmail = '';
        
        const adminEmail = 'richard2019201900@gmail.com';
        const sourceOwner = (sourceProperty.ownerEmail || '').toLowerCase();
        
        if (isAdmin) {
            // Admin uses dropdowns
            const selectedOwner = $('copyListingOwner')?.value;
            const selectedAgent = $('copyListingAgent')?.value;
            
            if (!selectedOwner) {
                alert('Please select an owner for this property');
                if (createBtn) {
                    createBtn.disabled = false;
                    createBtn.innerHTML = '<span>📋</span> Create Copy';
                }
                return;
            }
            
            newOwnerEmail = selectedOwner.toLowerCase();
            newAgentEmail = selectedAgent ? selectedAgent.toLowerCase() : '';
            
            // Don't set agent if owner IS the agent (self-managing)
            if (newAgentEmail === newOwnerEmail) {
                newAgentEmail = '';
            }
        } else {
            // Non-admin uses radio buttons
            const managementOption = document.querySelector('input[name="copyManagement"]:checked')?.value || 'self';
            
            if (managementOption === 'agent') {
                // Non-admin copying with agent = they own it, admin manages
                newOwnerEmail = currentUserEmail;
                newAgentEmail = adminEmail;
            } else {
                // Non-admin self-managing = they own it, no agent
                newOwnerEmail = currentUserEmail;
                newAgentEmail = '';
            }
        }
        
        // Fetch owner's contact info for public visibility
        // Uses same display name hierarchy as data.js resolveDisplayName()
        let ownerContactPhone = null;
        let ownerDisplayName = null;
        try {
            // Look up the new owner's user doc to get their info
            const usersSnapshot = await db.collection('users')
                .where('email', '==', newOwnerEmail.toLowerCase())
                .limit(1)
                .get();
            
            if (!usersSnapshot.empty) {
                const userData = usersSnapshot.docs[0].data();
                ownerContactPhone = userData.phone ? userData.phone.replace(/\D/g, '') : null;
                
                // Display name hierarchy (matches data.js resolveDisplayName):
                // displayName (with space) > firstName+lastName > firstName > displayName > username > email prefix
                if (userData.displayName && userData.displayName.includes(' ')) {
                    ownerDisplayName = userData.displayName;
                } else if (userData.firstName && userData.lastName) {
                    ownerDisplayName = userData.firstName + ' ' + userData.lastName;
                } else if (userData.firstName) {
                    ownerDisplayName = userData.firstName;
                } else if (userData.displayName) {
                    ownerDisplayName = userData.displayName;
                } else if (userData.username) {
                    ownerDisplayName = userData.username;
                } else {
                    ownerDisplayName = newOwnerEmail.split('@')[0];
                }
            }
        } catch (phoneErr) {
            console.warn('[CopyListing] Could not fetch owner info:', phoneErr);
        }
        
        // Build agent data if agent is selected
        let agentsArray = [];
        let agentDisplayNames = {};
        let agentPhones = {};
        
        if (newAgentEmail) {
            agentsArray = [newAgentEmail];
            
            // Get agent display name and phone
            let agentDisplayName = 'Agent';
            let agentPhone = '2057028233'; // Default to Pauly's number
            
            if (newAgentEmail === 'richard2019201900@gmail.com') {
                agentDisplayName = 'Pauly Amato';
                agentPhone = '2057028233';
            } else {
                // Try to get from agentsCache or users collection
                try {
                    if (typeof loadAgents === 'function') {
                        await loadAgents();
                    }
                    if (typeof agentsCache !== 'undefined' && Array.isArray(agentsCache)) {
                        const agent = agentsCache.find(a => a.email.toLowerCase() === newAgentEmail);
                        if (agent) {
                            agentDisplayName = agent.displayName || agent.username || newAgentEmail.split('@')[0];
                            agentPhone = agent.phone || '2057028233';
                        }
                    }
                } catch (agentErr) {
                    console.warn('[CopyListing] Could not fetch agent info:', agentErr);
                }
            }
            
            agentDisplayNames[newAgentEmail] = agentDisplayName;
            agentPhones[newAgentEmail] = agentPhone;
        }
        
        // Build the new property object (copy relevant fields)
        const newProperty = {
            id: newId,
            title: newTitle,
            description: sourceProperty.description || '',
            type: sourceProperty.type || 'house',
            interiorType: PropertyDataService.getValue(sourcePropertyId, 'interiorType', sourceProperty.interiorType || 'Instance'),
            bedrooms: PropertyDataService.getValue(sourcePropertyId, 'bedrooms', sourceProperty.bedrooms || 1),
            bathrooms: PropertyDataService.getValue(sourcePropertyId, 'bathrooms', sourceProperty.bathrooms || 1),
            storage: newStorage,
            
            // Pricing
            dailyPrice: PropertyDataService.getValue(sourcePropertyId, 'dailyPrice', sourceProperty.dailyPrice || 0),
            weeklyPrice: PropertyDataService.getValue(sourcePropertyId, 'weeklyPrice', sourceProperty.weeklyPrice || 0),
            biweeklyPrice: PropertyDataService.getValue(sourcePropertyId, 'biweeklyPrice', sourceProperty.biweeklyPrice || 0),
            monthlyPrice: PropertyDataService.getValue(sourcePropertyId, 'monthlyPrice', sourceProperty.monthlyPrice || 0),
            buyPrice: PropertyDataService.getValue(sourcePropertyId, 'buyPrice', sourceProperty.buyPrice || 0),
            
            // Images (copy all)
            images: [...(sourceProperty.images || [])],
            
            // Ownership
            ownerEmail: newOwnerEmail,
            ownerContactPhone: ownerContactPhone, // Public contact phone (synced from profile)
            ownerDisplayName: ownerDisplayName,   // Public display name (synced from profile)
            
            // Agent assignment (proper structure)
            agents: agentsArray,
            agentDisplayNames: agentDisplayNames,
            agentPhones: agentPhones,
            
            // Metadata
            createdAt: new Date().toISOString(),
            copiedFrom: sourcePropertyId,
            
            // Reset these fields (don't copy)
            renterName: '',
            renterPhone: '',
            renterNotes: '',
            lastPaymentDate: '',
            paymentFrequency: '',
            isPremium: false,
            isPremiumTrial: false,
            isSold: false
        };
        
        // Save to Firestore
        await db.collection('settings').doc('properties').set({
            [newId]: newProperty
        }, { merge: true });
        
        // Set initial availability (available)
        await db.collection('settings').doc('propertyAvailability').set({
            [newId]: true
        }, { merge: true });
        
        // Update local state
        properties.push(newProperty);
        state.availability[newId] = true;
        
        // Update owner property map
        if (!ownerPropertyMap[newOwnerEmail]) {
            ownerPropertyMap[newOwnerEmail] = [];
        }
        ownerPropertyMap[newOwnerEmail].push(newId);
        propertyOwnerEmail[newId] = newOwnerEmail;
        
        // Close modal
        closeCopyListingModal();
        
        // Show success message
        if (typeof showToast === 'function') {
            showToast(`Listing copied successfully! "${newTitle}"`, 'success');
        }
        
        // Refresh UI
        state.filteredProperties = [...properties];
        renderProperties(state.filteredProperties);
        renderOwnerDashboard();
        
        // Navigate to the new property after data has time to propagate
        setTimeout(() => {
            viewPropertyStats(newId);
        }, 800);
        
    } catch (error) {
        console.error('Error copying listing:', error);
        alert('Failed to copy listing: ' + error.message);
        
        // Reset button
        if (createBtn) {
            createBtn.disabled = false;
            createBtn.innerHTML = '<span>📋</span> Create Copy';
        }
    }
};

