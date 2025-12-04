// ==================== PROPERTY DATA ====================
const properties = [
    { id: 1, title: "Eclipse Towers, Apt 105", type: "apartment", interiorType: "Instance", location: "Eclipse Blvd, LS", weeklyPrice: 35000, monthlyPrice: 110000, storage: 600, bedrooms: 1, bathrooms: 1, videoUrl: "https://r2.fivemanage.com/zcu3v941VVMaPFLkCJ69T/EclipseTowersApt105-1080pwithsound.mp4", images: ["images/eclipse-towers-1.png", "images/eclipse-towers-2.png", "images/eclipse-towers-3.png", "images/eclipse-towers-4.png"] },
    { id: 2, title: "Ray Low, Apt C", type: "apartment", interiorType: "Instance", location: "Southside, LS", weeklyPrice: 40000, monthlyPrice: 125000, storage: 900, bedrooms: 1, bathrooms: 1, images: ["images/ray-low-c-1.png", "images/ray-low-c-2.png", "images/ray-low-c-3.png", "images/ray-low-c-4.png", "images/ray-low-c-5.png", "images/ray-low-c-6.png"] },
    { id: 3, title: "Ray Low, Apt D", type: "apartment", interiorType: "Instance", location: "Southside, LS", weeklyPrice: 40000, monthlyPrice: 125000, storage: 900, bedrooms: 1, bathrooms: 1, images: ["images/ray-low-d-1.png", "images/ray-low-d-2.png", "images/ray-low-d-3.png", "images/ray-low-d-4.png"] },
    { id: 4, title: "1010 Barbareno Rd", type: "condo", interiorType: "Instance", location: "South Chumash, LS", weeklyPrice: 50000, monthlyPrice: 155000, storage: 1200, bedrooms: 1, bathrooms: 1, images: ["images/barbareno-1.png", "images/barbareno-2.png", "images/barbareno-3.png", "images/barbareno-4.png", "images/barbareno-5.png", "images/barbareno-6.png", "images/barbareno-7.png"] },
    { id: 5, title: "Del Perro Heights, Apt 3", type: "apartment", interiorType: "Instance", location: "Del Perro Blvd, LS", weeklyPrice: 55000, monthlyPrice: 170000, storage: 1050, bedrooms: 1, bathrooms: 1, images: ["images/del-perro-1.png", "images/del-perro-2.png", "images/del-perro-3.png", "images/del-perro-4.png"] },
    { id: 6, title: "1032 Chumash Way", type: "house", interiorType: "Instance", location: "South Chumash, LS", weeklyPrice: 65000, monthlyPrice: 200000, storage: 1350, bedrooms: 1, bathrooms: 1, images: ["images/chumash-1032-1.png", "images/chumash-1032-2.png", "images/chumash-1032-3.png", "images/chumash-1032-4.png"] },
    { id: 7, title: "1234 Chumash Way", type: "house", interiorType: "Instance", location: "South Chumash, LS", weeklyPrice: 65000, monthlyPrice: 200000, storage: 1350, bedrooms: 1, bathrooms: 1, images: ["images/chumash-1234-1.png", "images/chumash-1234-2.png", "images/chumash-1234-3.png", "images/chumash-1234-4.png", "images/chumash-1234-5.png"] },
    { id: 8, title: "2024 Chumash Way", type: "house", interiorType: "Instance", location: "South Chumash, LS", weeklyPrice: 65000, monthlyPrice: 200000, storage: 1350, bedrooms: 1, bathrooms: 1, images: ["images/chumash-2024-1.png", "images/chumash-2024-2.png", "images/chumash-2024-3.png", "images/chumash-2024-4.png", "images/chumash-2024-5.png"] },
    { id: 9, title: "4568 Chumash Way", type: "condo", interiorType: "Instance", location: "South Chumash, LS", weeklyPrice: 65000, monthlyPrice: 200000, storage: 1350, bedrooms: 1, bathrooms: 1, images: ["images/chumash-4568-1.png", "images/chumash-4568-2.png", "images/chumash-4568-3.png", "images/chumash-4568-4.png", "images/chumash-4568-5.png"] },
    { id: 10, title: "5426 Chumash Way", type: "condo", interiorType: "Instance", location: "South Chumash, LS", weeklyPrice: 65000, monthlyPrice: 200000, storage: 1350, bedrooms: 1, bathrooms: 1, images: ["images/chumash-5426-1.png", "images/chumash-5426-2.png", "images/chumash-5426-3.png", "images/chumash-5426-4.png", "images/chumash-5426-5.png"] },
    { id: 11, title: "6502 Chumash Way", type: "house", interiorType: "Instance", location: "South Chumash, LS", weeklyPrice: 75000, monthlyPrice: 230000, storage: 1350, bedrooms: 1, bathrooms: 1, images: ["images/chumash-6502-1.png", "images/chumash-6502-2.png", "images/chumash-6502-3.png", "images/chumash-6502-4.png", "images/chumash-6502-5.png"] },
    { id: 12, title: "7896 Chumash Way", type: "house", interiorType: "Instance", location: "South Chumash, LS", weeklyPrice: 75000, monthlyPrice: 230000, storage: 1350, bedrooms: 1, bathrooms: 1, images: ["images/chumash-7896-1.png", "images/chumash-7896-2.png", "images/chumash-7896-3.png", "images/chumash-7896-4.png", "images/chumash-7896-5.png"] },
    { id: 13, title: "Oasis Villa 1", type: "villa", interiorType: "Walk-in", location: "Oasis Resort, LS", weeklyPrice: 150000, monthlyPrice: 455000, storage: 1650, bedrooms: 1, bathrooms: 1, images: ["images/oasis-villa-1.png", "images/oasis-villa-2.png", "images/oasis-villa-3.png", "images/oasis-villa-4.png"] },
    { id: 14, title: "6908 Great Ocean Highway", type: "house", interiorType: "Walk-in", location: "Chumash, LS", weeklyPrice: 250000, monthlyPrice: 755000, storage: 1800, bedrooms: 2, bathrooms: 2, features: true, images: ["images/great-ocean-1.png", "images/great-ocean-2.png", "images/great-ocean-3.png", "images/great-ocean-4.png"] }
];

// ==================== OWNER PROPERTY ASSIGNMENTS ====================
// Maps owner emails to their property IDs
const ownerPropertyMap = {
    'richard2019201900@gmail.com': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], // All properties
    'test@test.com': [] // No properties
    // Add more owners here: 'email@example.com': [1, 2, 3]
};

// Create reverse map: propertyId -> ownerEmail
const propertyOwnerEmail = {};
Object.keys(ownerPropertyMap).forEach(email => {
    ownerPropertyMap[email].forEach(propId => {
        propertyOwnerEmail[propId] = email;
    });
});

// Cache for owner usernames (global for access from other modules)
window.ownerUsernameCache = window.ownerUsernameCache || {};

// Get owner email for a property
function getPropertyOwnerEmail(propertyId) {
    // Ensure we're comparing with numeric ID
    const numericId = typeof propertyId === 'string' ? parseInt(propertyId) : propertyId;
    
    // First check the static mapping
    if (propertyOwnerEmail[numericId]) {
        return propertyOwnerEmail[numericId];
    }
    
    // Then check the property object itself (for user-created properties)
    const prop = properties.find(p => p.id === numericId);
    if (prop && prop.ownerEmail) {
        // Cache it for future lookups
        propertyOwnerEmail[numericId] = prop.ownerEmail.toLowerCase();
        return prop.ownerEmail.toLowerCase();
    }
    
    return null;
}

// Fetch username by email from Firestore
async function getUsernameByEmail(email) {
    if (!email) return 'Unassigned';
    
    // Check cache first
    if (window.ownerUsernameCache[email]) {
        return window.ownerUsernameCache[email];
    }

    try {
        const querySnapshot = await db.collection('users').where('email', '==', email).get();
        if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            const username = userData.username || email.split('@')[0];
            window.ownerUsernameCache[email] = username; // Cache it
            return username;
        }
    } catch (error) {
        console.error('Error fetching username:', error);
    }
    
    // User not found - might be deleted, return Unassigned
    return 'Unassigned';
}

// Get owner username for a property
async function getPropertyOwnerUsername(propertyId) {
    const email = getPropertyOwnerEmail(propertyId);
    return await getUsernameByEmail(email);
}

// Get owner username with tier badge for display
async function getPropertyOwnerWithTier(propertyId) {
    const email = getPropertyOwnerEmail(propertyId);
    const username = await getUsernameByEmail(email);
    
    // Handle unassigned properties
    if (username === 'Unassigned' || !email) {
        return {
            username: 'Unassigned',
            tier: null,
            tierData: null,
            display: '🚫 Unassigned'
        };
    }
    
    // Get tier from user doc
    let tier = 'starter';
    try {
        const snapshot = await db.collection('users').where('email', '==', email).get();
        if (!snapshot.empty) {
            const userData = snapshot.docs[0].data();
            tier = userData.tier || 'starter';
            // Check if master admin
            if (TierService.isMasterAdmin(email)) {
                return {
                    username,
                    tier: 'owner',
                    tierData: { icon: '👑', name: 'Owner' },
                    display: `👑 ${username}`
                };
            }
        }
    } catch (error) {
        console.error('[getPropertyOwnerWithTier] Error:', error);
    }
    
    const tierData = TIERS[tier] || TIERS.starter;
    return {
        username,
        tier,
        tierData,
        display: `${tierData.icon} ${username}`
    };
}

// Preload usernames for all property owners (call this after properties load)
async function preloadOwnerUsernames() {
    const uniqueEmails = [...new Set(Object.values(propertyOwnerEmail))];
    console.log('[Cache] Preloading usernames for', uniqueEmails.length, 'owners');
    
    // Load all in parallel
    await Promise.all(uniqueEmails.map(email => getUsernameByEmail(email)));
    console.log('[Cache] Preload complete');
}

// Get properties for the current logged-in owner
function getOwnerProperties() {
    const user = auth.currentUser;
    if (!user) return [];
    const email = user.email.toLowerCase();
    const propertyIds = ownerPropertyMap[email] || [];
    return properties.filter(p => propertyIds.includes(p.id));
}

// Check if current owner owns a specific property
function ownsProperty(propertyId) {
    const user = auth.currentUser;
    if (!user) return false;
    
    // Master owner can access all properties
    if (TierService.isMasterAdmin(user.email)) {
        return true;
    }
    
    const email = user.email.toLowerCase();
    const propertyIds = ownerPropertyMap[email] || [];
    return propertyIds.includes(propertyId);
}
