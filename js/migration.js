/**
 * MIGRATION SCRIPT: Unified Firestore Architecture
 * 
 * Run this ONCE to migrate all property data to a single Firestore document.
 * 
 * BEFORE RUNNING:
 * 1. Backup your current Firestore data
 * 2. Make sure you're logged in as admin (richard2019201900@gmail.com)
 * 
 * HOW TO RUN:
 * 1. Include this script in index.html temporarily: <script src="js/migration.js"></script>
 * 2. Open browser console
 * 3. Run: await runMigration()
 * 4. Verify data in Firebase Console
 * 5. Remove migration.js from index.html
 */

// Hardcoded base properties (copy from data.js)
const BASE_PROPERTIES = [
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

// Default owner assignment (all to master admin)
const DEFAULT_OWNER = 'richard2019201900@gmail.com';

/**
 * Main migration function
 */
window.runMigration = async function() {
    console.log('========================================');
    console.log('  PROPERTY DATA MIGRATION');
    console.log('  Unified Firestore Architecture');
    console.log('========================================');
    
    // Step 0: Verify admin access
    const user = auth.currentUser;
    if (!user || user.email !== DEFAULT_OWNER) {
        console.error('❌ You must be logged in as', DEFAULT_OWNER);
        return false;
    }
    console.log('✅ Admin access verified:', user.email);
    
    try {
        // Step 1: Fetch existing data from Firestore
        console.log('\n📥 Fetching existing Firestore data...');
        
        const [overridesDoc, existingPropsDoc, availabilityDoc] = await Promise.all([
            db.collection('settings').doc('propertyOverrides').get(),
            db.collection('settings').doc('properties').get(),
            db.collection('settings').doc('propertyAvailability').get()
        ]);
        
        const overridesData = overridesDoc.exists ? overridesDoc.data() : {};
        const existingPropsData = existingPropsDoc.exists ? existingPropsDoc.data() : {};
        const availabilityData = availabilityDoc.exists ? availabilityDoc.data() : {};
        
        console.log('   - propertyOverrides:', Object.keys(overridesData).length, 'fields');
        console.log('   - existing properties doc:', Object.keys(existingPropsData).length, 'properties');
        console.log('   - availability:', Object.keys(availabilityData).length, 'entries');
        
        // Step 2: Parse overrides into per-property objects
        console.log('\n🔄 Parsing propertyOverrides...');
        const parsedOverrides = {};
        
        Object.keys(overridesData).forEach(key => {
            const parts = key.split('.');
            if (parts.length === 2) {
                const propId = parts[0];
                const field = parts[1];
                if (!parsedOverrides[propId]) {
                    parsedOverrides[propId] = {};
                }
                parsedOverrides[propId][field] = overridesData[key];
            }
        });
        
        console.log('   - Found overrides for properties:', Object.keys(parsedOverrides).join(', '));
        
        // Step 3: Build unified property records
        console.log('\n🏗️  Building unified property records...');
        const unifiedProperties = {};
        
        // First, add all base properties
        BASE_PROPERTIES.forEach(baseProp => {
            const propId = String(baseProp.id);
            
            // Start with base data
            const unified = {
                ...baseProp,
                // Add standard fields with defaults
                ownerEmail: DEFAULT_OWNER,
                isStatic: true, // Mark as originally static (optional, for reference)
                dailyPrice: baseProp.dailyPrice || 0,
                biweeklyPrice: baseProp.biweeklyPrice || (baseProp.weeklyPrice * 2),
                buyPrice: baseProp.buyPrice || 0,
                renterName: '',
                renterPhone: '',
                renterNotes: '',
                paymentFrequency: '',
                lastPaymentDate: '',
                isPremium: false,
                isPremiumTrial: false,
                premiumStartDate: null,
                premiumLastPayment: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                migratedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Merge overrides (these take precedence)
            if (parsedOverrides[propId]) {
                Object.keys(parsedOverrides[propId]).forEach(field => {
                    // Skip metadata fields
                    if (!['updatedAt', 'updatedBy', 'clearedBy'].includes(field)) {
                        const value = parsedOverrides[propId][field];
                        // Only override if value is meaningful
                        if (value !== undefined && value !== null) {
                            unified[field] = value;
                        }
                    }
                });
                console.log(`   - Property ${propId}: merged ${Object.keys(parsedOverrides[propId]).length} overrides`);
            }
            
            unifiedProperties[propId] = unified;
        });
        
        // Then, add any user-created properties from existing doc (ID > 14)
        Object.keys(existingPropsData).forEach(propId => {
            const numId = parseInt(propId);
            if (numId > 14 && existingPropsData[propId].title) {
                // This is a user-created property, keep it as-is
                unifiedProperties[propId] = {
                    ...existingPropsData[propId],
                    id: numId,
                    migratedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                console.log(`   - Property ${propId}: user-created, preserved`);
            }
        });
        
        console.log(`\n📊 Total properties to write: ${Object.keys(unifiedProperties).length}`);
        
        // Step 4: Preview data (don't write yet)
        console.log('\n📋 PREVIEW - Properties to be written:');
        Object.keys(unifiedProperties).sort((a,b) => parseInt(a) - parseInt(b)).forEach(propId => {
            const p = unifiedProperties[propId];
            console.log(`   ${propId}: ${p.title} (${p.type}) - Owner: ${p.ownerEmail || 'none'}`);
            if (p.renterName) console.log(`        └─ Has Active Renter: YES`);
            if (p.isPremium) console.log(`        └─ Premium: YES`);
        });
        
        // Step 5: Ask for confirmation
        console.log('\n⚠️  READY TO MIGRATE');
        console.log('Run: await confirmMigration() to write to Firestore');
        console.log('Run: await cancelMigration() to abort');
        
        // Store for confirmation
        window._migrationData = unifiedProperties;
        window._migrationAvailability = availabilityData;
        
        return true;
        
    } catch (error) {
        console.error('❌ Migration error:', error);
        return false;
    }
};

/**
 * Confirm and execute the migration
 */
window.confirmMigration = async function() {
    if (!window._migrationData) {
        console.error('❌ No migration data. Run runMigration() first.');
        return false;
    }
    
    console.log('\n🚀 EXECUTING MIGRATION...');
    
    try {
        const batch = db.batch();
        
        // Write unified properties document
        const propsRef = db.collection('settings').doc('properties');
        batch.set(propsRef, window._migrationData);
        console.log('   - Queued: settings/properties');
        
        // Commit the batch
        await batch.commit();
        console.log('\n✅ MIGRATION COMPLETE!');
        
        // Cleanup
        console.log('\n🧹 POST-MIGRATION STEPS:');
        console.log('1. Verify data in Firebase Console');
        console.log('2. Deploy new code (services.js, data.js)');
        console.log('3. Test the application');
        console.log('4. Run: await deleteOldOverrides() to clean up propertyOverrides');
        
        window._migrationData = null;
        return true;
        
    } catch (error) {
        console.error('❌ Migration write error:', error);
        return false;
    }
};

/**
 * Cancel the migration
 */
window.cancelMigration = function() {
    window._migrationData = null;
    console.log('🛑 Migration cancelled');
};

/**
 * Delete the old propertyOverrides document (run after verifying migration)
 */
window.deleteOldOverrides = async function() {
    console.log('\n🗑️  Deleting old propertyOverrides document...');
    
    const confirm = window.confirm(
        'This will DELETE the settings/propertyOverrides document.\n\n' +
        'Only do this AFTER verifying the migration was successful.\n\n' +
        'Continue?'
    );
    
    if (!confirm) {
        console.log('   Cancelled');
        return false;
    }
    
    try {
        await db.collection('settings').doc('propertyOverrides').delete();
        console.log('✅ propertyOverrides deleted');
        return true;
    } catch (error) {
        console.error('❌ Delete error:', error);
        return false;
    }
};

/**
 * Utility: View current Firestore state
 */
window.viewFirestoreState = async function() {
    console.log('\n📊 CURRENT FIRESTORE STATE');
    
    const [overridesDoc, propsDoc, availDoc] = await Promise.all([
        db.collection('settings').doc('propertyOverrides').get(),
        db.collection('settings').doc('properties').get(),
        db.collection('settings').doc('propertyAvailability').get()
    ]);
    
    console.log('\nsettings/propertyOverrides:');
    if (overridesDoc.exists) {
        const data = overridesDoc.data();
        console.log('  Fields:', Object.keys(data).length);
        Object.keys(data).slice(0, 20).forEach(k => console.log(`    ${k}: ${JSON.stringify(data[k]).substring(0, 50)}`));
        if (Object.keys(data).length > 20) console.log('    ... and more');
    } else {
        console.log('  (does not exist)');
    }
    
    console.log('\nsettings/properties:');
    if (propsDoc.exists) {
        const data = propsDoc.data();
        console.log('  Properties:', Object.keys(data).length);
        Object.keys(data).sort((a,b) => parseInt(a) - parseInt(b)).forEach(k => {
            if (data[k].title) {
                console.log(`    ${k}: ${data[k].title}`);
            }
        });
    } else {
        console.log('  (does not exist)');
    }
    
    console.log('\nsettings/propertyAvailability:');
    if (availDoc.exists) {
        const data = availDoc.data();
        console.log('  Entries:', Object.keys(data).length);
    } else {
        console.log('  (does not exist)');
    }
};

console.log('📦 Migration script loaded.');
console.log('   Run: await runMigration() to start');
console.log('   Run: await viewFirestoreState() to see current data');
