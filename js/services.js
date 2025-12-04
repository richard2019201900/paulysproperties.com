// ==================== TIER SYSTEM ====================
/**
 * User Tiers Configuration
 * - Starter (free): 1 listing
 * - Pro: 3 listings  
 * - Elite: Unlimited listings
 */
const TIERS = {
    starter: { 
        maxListings: 1, 
        icon: '🌱', 
        name: 'Starter',
        color: 'text-gray-400',
        bgColor: 'bg-gray-600'
    },
    pro: { 
        maxListings: 3, 
        icon: '⭐', 
        name: 'Pro',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-600'
    },
    elite: { 
        maxListings: Infinity, 
        icon: '👑', 
        name: 'Elite',
        color: 'text-purple-400',
        bgColor: 'bg-purple-600'
    }
};

// Master admin email
const MASTER_ADMIN_EMAIL = 'richard2019201900@gmail.com';

/**
 * TierService - Handles user tier operations
 */
const TierService = {
    /**
     * Get user's tier info
     * @param {string} email - User email
     * @returns {Promise<Object>} - Tier info {tier, tierData, listingCount}
     */
    async getUserTier(email) {
        if (!email) return { tier: 'starter', tierData: TIERS.starter, listingCount: 0 };
        
        try {
            const normalizedEmail = email.toLowerCase();
            const snapshot = await db.collection('users').where('email', '==', normalizedEmail).get();
            
            let tier = 'starter';
            if (!snapshot.empty) {
                const userData = snapshot.docs[0].data();
                tier = userData.tier || 'starter';
            }
            
            // Count user's listings
            const listingCount = (ownerPropertyMap[normalizedEmail] || []).length;
            
            return {
                tier,
                tierData: TIERS[tier] || TIERS.starter,
                listingCount
            };
        } catch (error) {
            console.error('[TierService] Error getting user tier:', error);
            return { tier: 'starter', tierData: TIERS.starter, listingCount: 0 };
        }
    },
    
    /**
     * Check if user can create more listings
     * @param {string} email - User email
     * @returns {Promise<{canCreate: boolean, reason: string, tierInfo: Object}>}
     */
    async canCreateListing(email) {
        const tierInfo = await this.getUserTier(email);
        const { tier, tierData, listingCount } = tierInfo;
        
        // Master admin always can create
        if (email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
            return { canCreate: true, reason: '', tierInfo };
        }
        
        if (listingCount >= tierData.maxListings) {
            return {
                canCreate: false,
                reason: `Your ${tierData.name} plan allows ${tierData.maxListings} listing${tierData.maxListings > 1 ? 's' : ''}. You currently have ${listingCount}.`,
                tierInfo
            };
        }
        
        return { canCreate: true, reason: '', tierInfo };
    },
    
    /**
     * Set user's tier (admin only) - tracks history
     * @param {string} userEmail - Target user email
     * @param {string} newTier - New tier: 'starter', 'pro', 'elite'
     * @param {string} previousTier - Previous tier for history
     * @param {string} paymentNote - Optional payment/note info
     */
    async setUserTier(userEmail, newTier, previousTier = null, paymentNote = '') {
        if (!TIERS[newTier]) {
            throw new Error('Invalid tier');
        }
        
        const normalizedEmail = userEmail.toLowerCase();
        const snapshot = await db.collection('users').where('email', '==', normalizedEmail).get();
        
        if (snapshot.empty) {
            throw new Error('User not found');
        }
        
        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        const oldTier = previousTier || userData.tier || 'starter';
        
        // Update user tier
        await userDoc.ref.update({
            tier: newTier,
            tierUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            tierUpdatedBy: auth.currentUser?.email || 'system'
        });
        
        // Add to upgrade history
        await db.collection('upgradeHistory').add({
            userEmail: normalizedEmail,
            previousTier: oldTier,
            newTier: newTier,
            upgradedAt: firebase.firestore.FieldValue.serverTimestamp(),
            upgradedBy: auth.currentUser?.email || 'system',
            paymentNote: paymentNote,
            price: newTier === 'pro' ? 25000 : (newTier === 'elite' ? 50000 : 0)
        });
        
        console.log(`[TierService] Updated ${userEmail} from ${oldTier} to ${newTier} tier`);
    },
    
    /**
     * Get all users with their tier info
     */
    async getAllUsers() {
        const snapshot = await db.collection('users').orderBy('email').get();
        
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                email: data.email,
                username: data.username || data.email?.split('@')[0],
                tier: data.tier || 'starter',
                tierUpdatedAt: data.tierUpdatedAt,
                tierUpdatedBy: data.tierUpdatedBy,
                createdAt: data.createdAt
            };
        });
    },
    
    /**
     * Get upgrade history
     */
    async getUpgradeHistory() {
        const snapshot = await db.collection('upgradeHistory')
            .orderBy('upgradedAt', 'desc')
            .limit(50)
            .get();
        
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    
    /**
     * Submit upgrade request
     * @param {string} userEmail - Requesting user's email
     * @param {string} currentTier - Current tier
     * @param {string} requestedTier - Desired tier
     * @param {string} message - Optional message
     */
    async submitUpgradeRequest(userEmail, currentTier, requestedTier, message = '') {
        const request = {
            userEmail: userEmail.toLowerCase(),
            currentTier,
            requestedTier,
            message,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('upgradeRequests').add(request);
        console.log('[TierService] Upgrade request submitted:', request);
    },
    
    /**
     * Get pending upgrade requests (admin only)
     */
    async getPendingRequests() {
        const snapshot = await db.collection('upgradeRequests')
            .where('status', '==', 'pending')
            .orderBy('createdAt', 'desc')
            .get();
        
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    
    /**
     * Approve upgrade request (admin only)
     */
    async approveRequest(requestId) {
        const requestDoc = await db.collection('upgradeRequests').doc(requestId).get();
        if (!requestDoc.exists) throw new Error('Request not found');
        
        const request = requestDoc.data();
        
        // Update user's tier
        await this.setUserTier(request.userEmail, request.requestedTier);
        
        // Update request status
        await db.collection('upgradeRequests').doc(requestId).update({
            status: 'approved',
            processedAt: firebase.firestore.FieldValue.serverTimestamp(),
            processedBy: auth.currentUser?.email
        });
    },
    
    /**
     * Deny upgrade request (admin only)
     */
    async denyRequest(requestId, reason = '') {
        await db.collection('upgradeRequests').doc(requestId).update({
            status: 'denied',
            denyReason: reason,
            processedAt: firebase.firestore.FieldValue.serverTimestamp(),
            processedBy: auth.currentUser?.email
        });
    },
    
    /**
     * Check if user is master admin
     */
    isMasterAdmin(email) {
        return email && email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
    },
    
    /**
     * Get tier display HTML
     * @param {string} tier - Tier name
     * @returns {string} - HTML with icon and badge
     */
    getTierBadge(tier) {
        const t = TIERS[tier] || TIERS.starter;
        return `<span class="inline-flex items-center gap-1 ${t.color}" title="${t.name} Member">${t.icon}</span>`;
    }
};

// Make available globally
window.TierService = TierService;
window.TIERS = TIERS;
window.MASTER_ADMIN_EMAIL = MASTER_ADMIN_EMAIL;

// ==================== PROPERTY DATA SERVICE ====================
/**
 * PropertyDataService - Handles all read/write operations to Firestore
 * Uses the 'settings' collection which already has proper security rules
 * Document: settings/propertyOverrides stores all property custom data
 * 
 * CRITICAL: Always reads fresh data before writing to prevent stale overwrites
 * Real-time listeners ensure all subscribers get updates immediately
 */
const PropertyDataService = {
    // Use settings collection (already has write permissions)
    collectionName: 'settings',
    docName: 'propertyOverrides',
    
    // Active listener for cleanup
    unsubscribeListener: null,
    
    /**
     * READ: Fetch fresh property data from Firestore
     * For user-created properties: reads from settings/properties
     * For static properties: reads from propertyOverrides
     * @param {number} propertyId - The property ID to read
     * @returns {Promise<Object>} - Fresh property data for this property
     */
    async read(propertyId) {
        console.log(`[PropertyDataService] READ property ${propertyId}`);
        
        // Check if this is a user-created property
        const prop = properties.find(p => p.id === propertyId);
        const isUserCreated = prop && prop.ownerEmail;
        
        try {
            if (isUserCreated) {
                // User-created property: read from settings/properties
                const doc = await db.collection('settings').doc('properties').get();
                if (doc.exists) {
                    const allData = doc.data();
                    const propertyData = allData[String(propertyId)] || null;
                    console.log(`[PropertyDataService] READ user property ${propertyId}:`, propertyData);
                    
                    // Update local property object with fresh data
                    if (propertyData && prop) {
                        Object.assign(prop, propertyData);
                    }
                    
                    return { exists: propertyData !== null, data: propertyData };
                }
                return { exists: false, data: null };
            } else {
                // Static property: read from propertyOverrides
                const doc = await db.collection(this.collectionName).doc(this.docName).get();
                if (doc.exists) {
                    const allData = doc.data();
                    const propertyData = allData[String(propertyId)] || null;
                    console.log(`[PropertyDataService] READ static property ${propertyId}:`, propertyData);
                    return { exists: propertyData !== null, data: propertyData };
                }
                console.log(`[PropertyDataService] READ: No overrides document exists yet`);
                return { exists: false, data: null };
            }
        } catch (error) {
            console.error(`[PropertyDataService] READ error:`, error);
            throw error;
        }
    },
    
    /**
     * READ ALL: Fetch all property overrides
     * @returns {Promise<Object>} - All property overrides
     */
    async readAll() {
        console.log(`[PropertyDataService] READ ALL`);
        try {
            const doc = await db.collection(this.collectionName).doc(this.docName).get();
            if (doc.exists) {
                const data = doc.data();
                console.log(`[PropertyDataService] READ ALL success:`, data);
                return data;
            }
            return {};
        } catch (error) {
            console.error(`[PropertyDataService] READ ALL error:`, error);
            return {};
        }
    },
    
    /**
     * WRITE: Update property data in Firestore
     * CRITICAL: Always reads fresh data first to prevent overwriting newer values
     * @param {number} propertyId - The property ID to update
     * @param {string} field - The field name to update
     * @param {any} value - The new value
     * @returns {Promise<boolean>} - Success status
     */
    async write(propertyId, field, value) {
        console.log(`[PropertyDataService] WRITE property ${propertyId}, field: ${field}, value: ${value}`);
        
        // Check if this is a user-created property (has ownerEmail in properties array)
        const prop = properties.find(p => p.id === propertyId);
        const isUserCreated = prop && prop.ownerEmail;
        
        console.log(`[PropertyDataService] Property ${propertyId} isUserCreated: ${isUserCreated}`);
        
        try {
            if (isUserCreated) {
                // USER-CREATED PROPERTY: Write directly to settings/properties
                // Use update() with dot notation for proper nested field updates
                const updateData = {
                    [`${propertyId}.${field}`]: value,
                    [`${propertyId}.updatedAt`]: firebase.firestore.FieldValue.serverTimestamp(),
                    [`${propertyId}.updatedBy`]: auth.currentUser?.email || 'unknown'
                };
                
                // Use update() - it properly interprets dot notation as field paths
                await db.collection('settings').doc('properties').update(updateData);
                console.log(`[PropertyDataService] WRITE to properties doc success`);
                
                // Update local property object directly
                if (prop) {
                    prop[field] = value;
                    console.log(`[PropertyDataService] Local prop updated: ${field} = ${value}`);
                }
            } else {
                // STATIC PROPERTY: Write to propertyOverrides (existing behavior)
                const updatePath = `${propertyId}.${field}`;
                const updateData = {
                    [updatePath]: value,
                    [`${propertyId}.updatedAt`]: firebase.firestore.FieldValue.serverTimestamp(),
                    [`${propertyId}.updatedBy`]: auth.currentUser?.email || 'unknown'
                };
                
                await db.collection(this.collectionName).doc(this.docName).set(updateData, { merge: true });
                console.log(`[PropertyDataService] WRITE to overrides success`);
                
                // Update local state cache for immediate UI consistency
                if (!state.propertyOverrides[propertyId]) {
                    state.propertyOverrides[propertyId] = {};
                }
                state.propertyOverrides[propertyId][field] = value;
            }
            
            return true;
        } catch (error) {
            console.error(`[PropertyDataService] WRITE error:`, error);
            throw error;
        }
    },
    
    /**
     * Subscribe to real-time updates for ALL property overrides
     * Ensures all components stay in sync with the canonical datastore
     * @param {Function} callback - Called when any data changes
     * @returns {Function} - Unsubscribe function
     */
    subscribeAll(callback) {
        console.log(`[PropertyDataService] SUBSCRIBE to all property overrides`);
        
        // Cleanup existing listener
        if (this.unsubscribeListener) {
            this.unsubscribeListener();
        }
        
        // Set up real-time listener on the overrides document
        this.unsubscribeListener = db.collection(this.collectionName).doc(this.docName)
            .onSnapshot(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    console.log(`[PropertyDataService] REALTIME UPDATE:`, data);
                    
                    // Update local state for all properties
                    Object.keys(data).forEach(propId => {
                        if (!isNaN(parseInt(propId))) {
                            state.propertyOverrides[propId] = data[propId];
                        }
                    });
                    
                    // Notify callback
                    if (callback) callback(data);
                }
            }, error => {
                console.error(`[PropertyDataService] SUBSCRIBE error:`, error);
            });
        
        return this.unsubscribeListener;
    },
    
    /**
     * Get the effective value for a property field
     * For static properties: Checks overrides first, then falls back to base property data
     * For user-created properties: Uses property data directly (no overrides)
     * @param {number} propertyId - The property ID
     * @param {string} field - The field name
     * @param {any} defaultValue - Default value if not found
     */
    getValue(propertyId, field, defaultValue) {
        const prop = properties.find(p => p.id === propertyId);
        
        // User-created properties: Use property data directly (single source of truth)
        if (prop && prop.ownerEmail) {
            return prop?.[field] ?? defaultValue;
        }
        
        // Static properties: Check overrides first, then property data
        const override = state.propertyOverrides[propertyId]?.[field];
        if (override !== undefined) {
            return override;
        }
        return prop?.[field] ?? defaultValue;
    },
    
    /**
     * Unsubscribe from listener
     */
    cleanup() {
        if (this.unsubscribeListener) {
            this.unsubscribeListener();
            this.unsubscribeListener = null;
        }
    }
};

// ==================== FIRESTORE SYNC ====================
function setupRealtimeListener() {
    db.collection('settings').doc('propertyAvailability')
        .onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                properties.forEach(p => {
                    if (data[p.id] !== undefined) {
                        state.availability[p.id] = data[p.id];
                    }
                });
            }
            renderProperties(state.filteredProperties);
            if (state.currentUser === 'owner') renderOwnerDashboard();
        }, error => {
            console.error('Firestore error:', error);
            const stored = localStorage.getItem('propertyAvailability');
            if (stored) {
                state.availability = JSON.parse(stored);
                renderProperties(state.filteredProperties);
            }
        });
    
    // Also listen for property overrides changes
    db.collection('settings').doc('propertyOverrides')
        .onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                // CRITICAL: Reset state before re-parsing to remove deleted fields
                state.propertyOverrides = {};
                // Parse flat structure: "1.bedrooms" -> state.propertyOverrides[1].bedrooms
                Object.keys(data).forEach(key => {
                    const parts = key.split('.');
                    if (parts.length === 2) {
                        const propId = parts[0];
                        const field = parts[1];
                        if (!isNaN(parseInt(propId))) {
                            if (!state.propertyOverrides[propId]) {
                                state.propertyOverrides[propId] = {};
                            }
                            state.propertyOverrides[propId][field] = data[key];
                        }
                    }
                });
                console.log('[Realtime] PropertyOverrides updated:', state.propertyOverrides);
                renderProperties(state.filteredProperties);
                if (state.currentUser === 'owner') renderOwnerDashboard();
            } else {
                // Document doesn't exist, clear all overrides
                state.propertyOverrides = {};
            }
        });
    
    // Listen for new user-created properties AND updates to existing ones
    db.collection('settings').doc('properties')
        .onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                let hasChanges = false;
                Object.keys(data).forEach(key => {
                    const propId = parseInt(key);
                    const propData = data[key];
                    
                    // Ensure propData has the correct numeric ID
                    propData.id = propId;
                    
                    // Validate property has required fields
                    if (!propData || !propData.images || !Array.isArray(propData.images) || propData.images.length === 0) {
                        console.warn('[Realtime] Skipping invalid property:', key, propData);
                        return;
                    }
                    
                    const existingIndex = properties.findIndex(p => p.id === propId);
                    if (existingIndex === -1) {
                        // New property - add it
                        properties.push(propData);
                        state.availability[propId] = true;
                        hasChanges = true;
                        console.log('[Realtime] Added new property:', propData.title, 'with id:', propId);
                        
                        // Set up owner mapping
                        if (propData.ownerEmail) {
                            const email = propData.ownerEmail.toLowerCase();
                            if (!ownerPropertyMap[email]) {
                                ownerPropertyMap[email] = [];
                            }
                            if (!ownerPropertyMap[email].includes(propId)) {
                                ownerPropertyMap[email].push(propId);
                            }
                            propertyOwnerEmail[propId] = email;
                            console.log('[Realtime] Set owner for property', propId, ':', email);
                        }
                    } else {
                        // Existing property - update all fields from Firestore
                        const existingProp = properties[existingIndex];
                        // Only update if this is a user-created property
                        if (existingProp.ownerEmail) {
                            Object.keys(propData).forEach(field => {
                                if (existingProp[field] !== propData[field]) {
                                    existingProp[field] = propData[field];
                                    hasChanges = true;
                                }
                            });
                            if (hasChanges) {
                                console.log('[Realtime] Updated property:', propData.title);
                            }
                        }
                    }
                });
                if (hasChanges) {
                    state.filteredProperties = [...properties];
                    renderProperties(state.filteredProperties);
                    if (state.currentUser === 'owner') renderOwnerDashboard();
                }
            }
        });
    
    // Listen for owner property map changes
    db.collection('settings').doc('ownerPropertyMap')
        .onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                Object.keys(data).forEach(email => {
                    const lowerEmail = email.toLowerCase();
                    if (!ownerPropertyMap[lowerEmail]) {
                        ownerPropertyMap[lowerEmail] = [];
                    }
                    data[email].forEach(propId => {
                        if (!ownerPropertyMap[lowerEmail].includes(propId)) {
                            ownerPropertyMap[lowerEmail].push(propId);
                            propertyOwnerEmail[propId] = lowerEmail;
                        }
                    });
                });
                if (state.currentUser === 'owner') renderOwnerDashboard();
            }
        });
}

async function saveAvailability(id, isAvailable) {
    try {
        await db.collection('settings').doc('propertyAvailability').set({ [id]: isAvailable }, { merge: true });
        localStorage.setItem('propertyAvailability', JSON.stringify(state.availability));
        return true;
    } catch (error) {
        console.error('Save error:', error);
        localStorage.setItem('propertyAvailability', JSON.stringify(state.availability));
        return false;
    }
}

window.toggleAvailability = async function(id) {
    const currentlyRented = state.availability[id] === false;
    
    // If trying to mark as Available, check if renter info exists
    if (currentlyRented) {
        const renterName = PropertyDataService.getValue(id, 'renterName', '');
        const renterPhone = PropertyDataService.getValue(id, 'renterPhone', '');
        
        if (renterName || renterPhone) {
            alert('⚠️ Cannot mark as Available\n\nThis property has renter information set:\n' + 
                  (renterName ? `• Renter Name: ${renterName}\n` : '') +
                  (renterPhone ? `• Renter Phone: ${renterPhone}\n` : '') +
                  '\nTo mark this property as Available, first clear the renter name and phone fields on the property stats page.');
            return;
        }
    }
    
    state.availability[id] = !state.availability[id];
    renderOwnerDashboard();
    renderProperties(state.filteredProperties);
    
    const success = await saveAvailability(id, state.availability[id]);
    if (!success) {
        const status = $('syncStatus');
        status.textContent = '!! Sync error - saved locally';
        status.className = 'text-yellow-400 mt-2 font-medium';
        setTimeout(() => {
            status.textContent = 'Real-time sync enabled';
            status.className = 'text-green-400 mt-2 font-medium';
        }, 3000);
    }
};

async function initFirestore() {
    try {
        const doc = await db.collection('settings').doc('propertyAvailability').get();
        const data = doc.exists ? doc.data() : {};
        const updates = {};
        let needsUpdate = false;
        
        properties.forEach(p => {
            if (data[p.id] === undefined) {
                updates[p.id] = true;
                needsUpdate = true;
            } else {
                state.availability[p.id] = data[p.id];
            }
        });
        
        if (needsUpdate || !doc.exists) {
            await db.collection('settings').doc('propertyAvailability').set(updates, { merge: true });
        }
        
        // Load user-created properties
        console.log('[initFirestore] Loading user-created properties...');
        const propsDoc = await db.collection('settings').doc('properties').get();
        if (propsDoc.exists) {
            const propsData = propsDoc.data();
            console.log('[initFirestore] User properties data:', propsData);
            Object.keys(propsData).forEach(key => {
                const propId = parseInt(key);
                const prop = propsData[key];
                
                // Ensure prop has the correct numeric ID
                prop.id = propId;
                
                // Validate property has required fields
                if (!prop || !prop.images || !Array.isArray(prop.images) || prop.images.length === 0) {
                    console.warn('[initFirestore] Skipping invalid property:', key, prop);
                    return;
                }
                
                // Check if this property already exists in the static array
                const existingIndex = properties.findIndex(p => p.id === propId);
                if (existingIndex === -1) {
                    // New user-created property - add to array
                    properties.push(prop);
                    console.log('[initFirestore] Added user property:', prop.title, 'with id:', propId);
                    
                    // Set availability from Firestore
                    if (data[propId] !== undefined) {
                        state.availability[propId] = data[propId];
                    } else {
                        state.availability[propId] = true;
                    }
                    
                    // Also set up owner mapping from stored ownerEmail
                    if (prop.ownerEmail) {
                        const email = prop.ownerEmail.toLowerCase();
                        if (!ownerPropertyMap[email]) {
                            ownerPropertyMap[email] = [];
                        }
                        if (!ownerPropertyMap[email].includes(propId)) {
                            ownerPropertyMap[email].push(propId);
                        }
                        propertyOwnerEmail[propId] = email;
                        console.log('[initFirestore] Set owner for property', propId, ':', email);
                    }
                }
            });
            // Update filtered properties
            state.filteredProperties = [...properties];
        }
        
        // Load owner property mappings for user-created properties
        const ownerMapDoc = await db.collection('settings').doc('ownerPropertyMap').get();
        if (ownerMapDoc.exists) {
            const ownerMapData = ownerMapDoc.data();
            console.log('[initFirestore] Owner map data:', ownerMapData);
            Object.keys(ownerMapData).forEach(email => {
                const lowerEmail = email.toLowerCase();
                if (!ownerPropertyMap[lowerEmail]) {
                    ownerPropertyMap[lowerEmail] = [];
                }
                ownerMapData[email].forEach(propId => {
                    if (!ownerPropertyMap[lowerEmail].includes(propId)) {
                        ownerPropertyMap[lowerEmail].push(propId);
                        propertyOwnerEmail[propId] = lowerEmail;
                    }
                });
            });
        }
        
        // Load property overrides
        console.log('[initFirestore] Loading property overrides...');
        const overridesDoc = await db.collection('settings').doc('propertyOverrides').get();
        console.log('[initFirestore] Overrides doc exists:', overridesDoc.exists);
        if (overridesDoc.exists) {
            const overridesData = overridesDoc.data();
            console.log('[initFirestore] Overrides data:', overridesData);
            // Parse flat structure: "1.bedrooms" -> state.propertyOverrides[1].bedrooms
            Object.keys(overridesData).forEach(key => {
                const parts = key.split('.');
                if (parts.length === 2) {
                    const propId = parts[0];
                    const field = parts[1];
                    if (!isNaN(parseInt(propId))) {
                        if (!state.propertyOverrides[propId]) {
                            state.propertyOverrides[propId] = {};
                        }
                        state.propertyOverrides[propId][field] = overridesData[key];
                    }
                }
            });
            console.log('[initFirestore] State after loading:', state.propertyOverrides);
        }
        
        // Preload owner usernames in background for faster display
        preloadOwnerUsernames().catch(err => console.warn('[initFirestore] Username preload failed:', err));
    } catch (error) {
        console.error('Init error:', error);
    }
}
