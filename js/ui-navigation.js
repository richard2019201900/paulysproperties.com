/**
 * ============================================================================
 * UI NAVIGATION - Navigation and routing functions
 * ============================================================================
 * 
 * CONTENTS:
 * - Main navigation functions
 * - Section navigation (home, dashboard, properties, etc.)
 * - User dropdown menu
 * - Blog page rendering
 * - Auth UI handlers
 * - Mobile menu
 * - Back navigation
 * 
 * DEPENDENCIES: TierService, PropertyDataService
 * ============================================================================
 */

// ==================== NAVIGATION ====================
function updateAuthButton(isLoggedIn) {
    const navBtn = $('navAuthBtn');
    const mobileBtn = $('mobileAuthBtn');
    const navCreateBtn = $('navCreateListingBtn');
    const mobileCreateBtn = $('mobileCreateListingBtn');
    const navUserDisplay = $('navUserDisplay');
    const mobileUserSection = $('mobileUserSection');
    const mobileLogoutBtn = $('mobileLogoutBtn');
    const mobileBlogLink = $('mobileBlogLink');
    
    if (isLoggedIn) {
        // Desktop nav
        navBtn.textContent = 'Logout';
        navBtn.className = 'hidden md:block bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-xl hover:opacity-90 transition font-semibold shadow-lg text-sm lg:text-base';
        
        // Mobile nav - hide auth button, show logout button and user section
        if (mobileBtn) mobileBtn.className = 'hidden';
        if (mobileLogoutBtn) mobileLogoutBtn.className = 'flex w-full text-left px-4 py-3 text-red-400 hover:bg-gray-800 font-semibold items-center gap-2';
        if (mobileUserSection) mobileUserSection.className = 'border-b border-gray-700 p-4 bg-gray-800/50';
        if (mobileBlogLink) mobileBlogLink.className = 'flex px-4 py-3 text-gray-300 hover:bg-gray-800 cursor-pointer items-center gap-2';
        
        showElement($('navDashboardLink'));
        showElement($('mobileDashboardLink'));
        // Show Create Listing buttons
        if (navCreateBtn) navCreateBtn.className = 'hidden md:block bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 px-3 lg:px-5 py-2 lg:py-2.5 rounded-xl hover:opacity-90 transition font-bold shadow-lg text-xs lg:text-sm';
        if (mobileCreateBtn) mobileCreateBtn.className = 'flex px-4 py-3 text-green-400 hover:bg-gray-800 cursor-pointer font-semibold items-center gap-2';
        // Show user display
        if (navUserDisplay) {
            navUserDisplay.className = 'hidden md:flex items-center gap-2';
            updateNavUserDisplay();
        }
        // Show "My Properties" filter
        const myPropertiesFilter = $('myPropertiesFilter');
        if (myPropertiesFilter) myPropertiesFilter.className = 'flex items-center gap-2 text-gray-300 font-semibold cursor-pointer text-sm md:text-base hover:text-white transition';
    } else {
        // Desktop nav
        navBtn.textContent = 'Register / Sign In';
        navBtn.className = 'hidden md:block gradient-bg text-white px-4 lg:px-6 py-2 lg:py-3 rounded-xl hover:opacity-90 transition font-semibold shadow-lg text-sm lg:text-base';
        
        // Mobile nav - show auth button, hide logout button and user section
        if (mobileBtn) {
            mobileBtn.textContent = 'Register / Sign In';
            mobileBtn.className = 'block w-full text-left px-4 py-3 text-purple-400 hover:bg-gray-800 font-semibold';
        }
        if (mobileLogoutBtn) mobileLogoutBtn.className = 'hidden';
        if (mobileUserSection) mobileUserSection.className = 'hidden';
        if (mobileBlogLink) mobileBlogLink.className = 'hidden';
        
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
    
    // Update site update badge
    updateSiteUpdateBadge();
    
    const navUserName = $('navUserName');
    const navUserTier = $('navUserTier');
    const navUpgradeOption = $('navUpgradeOption');
    
    // Mobile elements
    const mobileUserName = $('mobileUserName');
    const mobileUserTier = $('mobileUserTier');
    const mobileUserInitial = $('mobileUserInitial');
    
    if (!navUserName || !navUserTier) return;
    
    try {
        const doc = await db.collection('users').doc(user.uid).get();
        const data = doc.data() || {};
        // Try displayName first, then username, then fall back to email
        const username = data.displayName || data.username || user.email.split('@')[0];
        
        // Check if master admin
        if (TierService.isMasterAdmin(user.email)) {
            navUserName.textContent = username;
            navUserTier.innerHTML = '👑 Owner';
            navUserTier.className = 'text-xs text-red-400';
            // Hide upgrade option for Owner
            if (navUpgradeOption) navUpgradeOption.classList.add('hidden');
            
            // Update mobile elements
            if (mobileUserName) mobileUserName.textContent = username;
            if (mobileUserTier) {
                mobileUserTier.innerHTML = '👑 Owner';
                mobileUserTier.className = 'text-xs text-red-400';
            }
            if (mobileUserInitial) mobileUserInitial.textContent = username.charAt(0).toUpperCase();
            
            // Show admin notification badges on mobile
            updateMobileAdminBadges();
        } else {
            const tier = data.tier || 'starter';
            const tierData = TIERS[tier] || TIERS.starter;
            
            navUserName.textContent = username;
            navUserTier.innerHTML = `${tierData.icon} ${tierData.name}`;
            navUserTier.className = `text-xs ${tierData.color}`;
            
            // Update mobile elements
            if (mobileUserName) mobileUserName.textContent = username;
            if (mobileUserTier) {
                mobileUserTier.innerHTML = `${tierData.icon} ${tierData.name}`;
                mobileUserTier.className = `text-xs ${tierData.color}`;
            }
            if (mobileUserInitial) mobileUserInitial.textContent = username.charAt(0).toUpperCase();
            
            // Hide upgrade option for Elite users
            if (navUpgradeOption) {
                if (tier === 'elite') {
                    navUpgradeOption.classList.add('hidden');
                } else {
                    navUpgradeOption.classList.remove('hidden');
                }
            }
            
            // Update rent badges for all property owners (not just admin)
            updateMobileRentBadge();
        }
    } catch (error) {
        console.error('Error updating nav user display:', error);
        navUserName.textContent = user.email.split('@')[0];
        navUserTier.textContent = '🌱 Starter';
        
        // Update mobile elements with fallback
        if (mobileUserName) mobileUserName.textContent = user.email.split('@')[0];
        if (mobileUserTier) mobileUserTier.textContent = '🌱 Starter';
        if (mobileUserInitial) mobileUserInitial.textContent = user.email.charAt(0).toUpperCase();
    }
}

// Update mobile admin notification badges
function updateMobileAdminBadges() {
    // Update rent badges for ALL logged-in users (not just admin)
    updateMobileRentBadge();
    
    // Admin-only badges
    if (!TierService.isMasterAdmin(auth.currentUser?.email)) return;
    
    const mobileAdminBadge = $('mobileAdminBadge');
    const mobileAdminCount = $('mobileAdminCount');
    
    // Update combined admin badge (users + listings + premium) - ADMIN ONLY
    if (mobileAdminBadge && window.AdminNotifications && TierService.isMasterAdmin(auth.currentUser?.email)) {
        const userCount = AdminNotifications.visible ? 
            Array.from(AdminNotifications.visible.values()).filter(v => v.type === 'new-user-').length : 0;
        const listingCount = AdminNotifications.visible ? 
            Array.from(AdminNotifications.visible.values()).filter(v => v.type === 'new-listing-').length : 0;
        const premiumCount = AdminNotifications.visible ? 
            Array.from(AdminNotifications.visible.values()).filter(v => v.type === 'new-premium-').length : 0;
        
        const total = userCount + listingCount + premiumCount;
        
        if (total > 0) {
            if (mobileAdminCount) mobileAdminCount.textContent = total;
            mobileAdminBadge.className = 'flex bg-blue-500 text-white text-xs font-bold rounded-full w-7 h-7 items-center justify-center shadow-lg animate-pulse cursor-pointer';
        } else {
            mobileAdminBadge.className = 'hidden';
        }
    } else if (mobileAdminBadge) {
        // Hide admin badge for non-admins
        mobileAdminBadge.className = 'hidden';
    }
}

// Separate function for updating mobile rent badge only (for non-admin users)
function updateMobileRentBadge() {
    const mobileRentBadge = $('mobileRentBadge');
    const mobileRentCount = $('mobileRentCount');
    
    if (mobileRentBadge && window.AdminNotifications?.rentNotifications) {
        const { overdue, today, tomorrow } = AdminNotifications.rentNotifications;
        const rentTotal = overdue.length + today.length + tomorrow.length;
        
        if (rentTotal > 0) {
            if (mobileRentCount) mobileRentCount.textContent = rentTotal;
            mobileRentBadge.className = 'flex bg-red-600 text-white text-xs font-bold rounded-full w-7 h-7 items-center justify-center shadow-lg animate-pulse cursor-pointer';
        } else {
            mobileRentBadge.className = 'hidden';
        }
    }
}

window.updateMobileRentBadge = updateMobileRentBadge;
window.updateMobileAdminBadges = updateMobileAdminBadges;

window.updateNavUserDisplay = updateNavUserDisplay;

// User dropdown menu functions
window.toggleUserDropdown = function() {
    const dropdown = $('userDropdownMenu');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
        // Update badge position after toggle
        setTimeout(updateSiteUpdateBadge, 10);
    }
};

window.closeUserDropdown = function() {
    const dropdown = $('userDropdownMenu');
    if (dropdown) {
        dropdown.classList.add('hidden');
        // Update badge position after close
        setTimeout(updateSiteUpdateBadge, 10);
    }
};

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const dropdown = $('userDropdownMenu');
    const navUserDisplay = $('navUserDisplay');
    if (dropdown && navUserDisplay && !navUserDisplay.contains(e.target)) {
        const wasOpen = !dropdown.classList.contains('hidden');
        dropdown.classList.add('hidden');
        // Update badge if dropdown was open
        if (wasOpen) setTimeout(updateSiteUpdateBadge, 10);
    }
});

// Navigate to profile settings section
window.goToProfileSettings = function() {
    goToDashboard();
    // Switch to My Properties tab (where profile settings lives) if admin
    if (TierService.isMasterAdmin(auth.currentUser?.email)) {
        switchDashboardTab('myProperties');
    }
    // Scroll to profile settings after a short delay
    setTimeout(() => {
        const profileSection = document.querySelector('#profileSettingsSection');
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

// Navigate to blog/updates page
window.goToBlog = function() {
    closeUserDropdown();
    markSiteUpdateAsRead();
    navigateTo('blog');
};

// Render blog page content
window.renderBlogPage = function() {
    const blogPage = $('blogPage');
    if (!blogPage) return;
    
    // Blog posts data - add new posts at the top
    const blogPosts = [
        {
            date: 'February 8, 2026',
            title: '🚀 Over 100 Updates Since Last Month',
            category: 'Major Update',
            categoryColor: 'bg-green-500',
            content: `
                <p class="mb-4">Since the last site update I've pushed <strong>over 100 updates</strong> to the platform. PaulysProperties.com just hit <strong>521 total deployments</strong> in just over two months since launch. Here's what's new:</p>
                
                <h4 class="font-bold text-white mb-2 mt-6">🏠 Property Sales Tracking</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li>You can now log property sales directly on the site with buyer info, sale price, date and government fees all in one place</li>
                    <li>When a property sells it automatically updates to "Sold" status so everyone browsing knows what's available</li>
                    <li>Property status is more detailed now. Instead of just "Available" or "Unavailable" you'll see <strong>Rented</strong>, <strong>Sold</strong> or <strong>Temporarily Unavailable</strong></li>
                </ul>
                
                <h4 class="font-bold text-white mb-2 mt-6">📋 Copy Listing</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li>Need to list multiple units in the same building? Use the new Copy Listing feature to duplicate a property with all its details, images and pricing in seconds</li>
                    <li>Just change the title and storage and you're live. No more re-entering the same info over and over</li>
                </ul>
                
                <h4 class="font-bold text-white mb-2 mt-6">👑 Premium Listings</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li>Premium listing management got a complete rebuild with better tracking and controls</li>
                    <li>Want your property featured at the top of the page with a gold border and premium badge? Text me for details</li>
                </ul>
                
                <h4 class="font-bold text-white mb-2 mt-6">🛡️ Smarter Safeguards</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li>Accidentally clicking outside a popup no longer closes it. All modals now require you to click the X or a close button so you never lose progress mid-edit</li>
                    <li>The system now guides you through the correct steps when ending a rental or clearing tenant info. No more accidental data wipes</li>
                </ul>
                
                <h4 class="font-bold text-white mb-2 mt-6">📊 Dashboard Upgrades</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li>Designed and started building a <strong>Real Estate Agent</strong> system in preparation for future growth. When the time comes you'll be able to have an assigned agent managing your properties with full dashboard visibility, commission tracking and rent collection alerts built right in</li>
                    <li>Income tracking and payment breakdowns are more accurate on every screen</li>
                    <li>Real-time sync improvements so what you see on your dashboard is always current</li>
                </ul>
                
                <h4 class="font-bold text-white mb-2 mt-6">🔔 Notification System Rebuild</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li>The entire notification system has been rebuilt from scratch for reliability</li>
                    <li>Alerts now sync across devices and persist correctly between sessions</li>
                    <li>Admin notifications properly track new users, new listings and premium fee reminders</li>
                    <li>One-click "Clear All" button when notifications stack up</li>
                </ul>
                
                <h4 class="font-bold text-white mb-2 mt-6">🏆 Leaderboard</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li>XP tracking is tighter than ever. Scores reflect real activity only and corrections are made automatically if data changes</li>
                    <li>Keep logging payments and making moves to climb the ranks</li>
                </ul>
                
                <h4 class="font-bold text-white mb-2 mt-6">✨ Quality of Life</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li>Simplified sign-up process. Just pick a username and password to get started, fill in your details after</li>
                    <li>Display names now show correctly everywhere across the platform (property cards, notifications, agent listings)</li>
                    <li>"List Your Property" button now works properly for new visitors and walks you through creating an account</li>
                    <li>All payment reminder scripts now include the property name so there's no confusion about which property you're collecting for</li>
                    <li>Contact info displays correctly for every property owner regardless of who's browsing</li>
                </ul>
                
                <h4 class="font-bold text-white mb-2 mt-6">⚡ Under the Hood</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li>113 updates deployed in the last 3 weeks alone</li>
                    <li>Complete rewrite of the notification persistence system</li>
                    <li>Real-time data sync improvements across every page</li>
                    <li>Dozens of performance and reliability improvements you'll feel but won't see</li>
                </ul>
                
                <p class="mt-6 text-gray-300">This platform is built for the community and that's never going to change. Every single feature request and piece of feedback I've received has been built and deployed within 24 to 48 hours. That's the standard and I plan to keep it that way. If you have ideas, suggestions or anything that would make your experience better I want to hear it. Fastest way to reach me is always a text.</p>
                
                <p class="mt-4"><span class="text-green-400 font-bold cursor-pointer hover:text-green-300" onclick="openModal('contactModal')">📱 Text Pauly</span></p>
            `
        },
        {
            date: 'January 15, 2025',
            title: '🎉 Simplified Tier System - More Value, Lower Prices!',
            category: 'Major Update',
            categoryColor: 'bg-green-500',
            content: `
                <p class="mb-4">We've completely revamped our subscription tiers to give you <strong>more value at lower prices!</strong></p>
                
                <h4 class="font-bold text-white mb-2 mt-6">🌱 Starter Tier - NOW FREE with 3 Listings!</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li><strong>Before:</strong> 1 listing limit</li>
                    <li><strong>Now:</strong> 3 listings for FREE!</li>
                </ul>
                <p class="mb-4 text-gray-300">That's right - you can now list up to <strong class="text-green-400">3 properties completely free</strong>. No subscription, no monthly payments, just create your account and start listing!</p>
                
                <h4 class="font-bold text-white mb-2 mt-6">👑 Elite Tier - Now Just $25,000/month!</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li><strong>Before:</strong> $50,000/month</li>
                    <li><strong>Now:</strong> $25,000/month <span class="text-green-400 font-bold">(50% OFF!)</span></li>
                </ul>
                <p class="mb-4 text-gray-300">Get <strong>unlimited listings</strong> at half the previous price! Perfect for serious property managers who want to dominate the rental market.</p>
                
                <h4 class="font-bold text-white mb-2 mt-6">⭐ Pro Tier - Retired</h4>
                <p class="mb-2 text-gray-300">The Pro tier has been retired. All former Pro members have been automatically migrated:</p>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li><strong>You now have 3 FREE listings</strong> on the Starter tier</li>
                    <li><strong>No payment required</strong> - your trial status has been cleared</li>
                    <li><strong>Keep all your existing properties</strong> - nothing changes with your listings</li>
                </ul>
                
                <h4 class="font-bold text-white mb-2 mt-6">💡 Why Did We Make This Change?</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li><strong>Simpler choices</strong> - Two tiers instead of three makes it easier to decide</li>
                    <li><strong>More free value</strong> - Triple the free listings for everyone</li>
                    <li><strong>Lower barrier to entry</strong> - 50% price reduction for Elite makes unlimited listings more accessible</li>
                    <li><strong>Better for the community</strong> - More property owners = more options for renters</li>
                </ul>
                
                <div class="bg-gray-800 rounded-xl p-4 mt-6">
                    <h4 class="font-bold text-white mb-3">📋 Summary</h4>
                    <div class="grid grid-cols-3 gap-2 text-sm">
                        <div class="text-gray-400 font-bold">Tier</div>
                        <div class="text-gray-400 font-bold">Listings</div>
                        <div class="text-gray-400 font-bold">Price</div>
                        <div class="text-white">🌱 Starter</div>
                        <div class="text-white">3</div>
                        <div class="text-green-400 font-bold">FREE</div>
                        <div class="text-white">👑 Elite</div>
                        <div class="text-white">Unlimited</div>
                        <div class="text-yellow-400 font-bold">$25,000/mo</div>
                    </div>
                </div>
                
                <p class="mt-6 text-gray-300">Questions? Text Pauly or send a message through the platform. We're here to help!</p>
                <p class="mt-2 text-gray-400 italic">Thank you for being part of PaulysProperties.com! 🏠✨</p>
            `
        },
        {
            date: 'January 14, 2025',
            title: '🏠 Property Management Just Got Easier',
            category: 'Major Update',
            categoryColor: 'bg-purple-500',
            content: `
                <p class="mb-4">This update focuses on making your day-to-day property management smoother. We've improved how you track rent, added professional services, and cleaned up the interface. We also connected PaulysAutos.com via a dropdown in the top-left corner to make switching between car and property sales as seamless as possible.</p>
                
                <h4 class="font-bold text-white mb-2 mt-6">📊 Dashboard Improvements:</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li>Rent collection alerts are now fully clickable</li>
                    <li>Click any overdue tenant to jump straight to their property details</li>
                    <li>One-click copy for reminder messages to send to tenants</li>
                    <li>Overall performance is noticeably faster</li>
                </ul>
                
                <h4 class="font-bold text-white mb-2 mt-6">🛎️ Professional Services:</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li>New <strong>Services</strong> tab in the navigation bar</li>
                    <li>Professional photography packages to make your listings stand out</li>
                    <li>Turn-key management available if you want us to handle everything</li>
                    <li>Pricing is straightforward: one-time fee plus a percentage of rent or sale</li>
                </ul>
                
                <h4 class="font-bold text-white mb-2 mt-6">✨ Quality of Life Updates:</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li>Navigation is cleaner with only the active page highlighted</li>
                    <li>Streamlined welcome screen for new visitors</li>
                    <li>About and Contact info now in one place</li>
                    <li>Dozens of bug fixes behind the scenes</li>
                </ul>
                
                <h4 class="font-bold text-white mb-2 mt-6">🚗 One More Thing:</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li><strong>PaulysAutos.com</strong> is now live for vehicle listings</li>
                    <li>Use the dropdown in the top-left corner to switch between sites</li>
                    <li>Browsing is always free on both sites</li>
                    <li>If you want to list on both, you'll need to create a separate account for each</li>
                </ul>
                
                <p class="mt-6 text-gray-300">We're building a connected network of services for Los Santos. Whether you need a place to live or a car to drive, Pauly's got you covered.</p>
                
                <p class="mt-4 text-gray-400 italic">Questions or ideas? <strong class="text-green-400 cursor-pointer hover:text-green-300" onclick="openModal('contactModal')">Text Pauly.</strong> Your feedback shapes everything we build.</p>
            `
        },
        {
            date: 'December 30, 2024',
            title: '📱 Now Available On Your Phone + Massive Platform Upgrades',
            category: 'Major Update',
            categoryColor: 'bg-purple-500',
            content: `
                <p class="mb-4"><strong>PaulysProperties.com now works directly in your phone browser.</strong> No more alt-tabbing to Chrome — browse listings, manage your properties, and check your dashboard right from your phone. Just type paulysproperties.com and you're in.</p>
                
                <p class="mb-4">Over the past two weeks, we've pushed <strong>26 major updates</strong> and completely transformed the platform. Here's what's new:</p>
                
                <h4 class="font-bold text-white mb-2 mt-6">📱 Phone Support:</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li>Full site now works in the phone browser — no alt-tab needed</li>
                    <li>Custom domain: just type <strong>paulysproperties.com</strong></li>
                    <li>Optimized for smooth scrolling and fast loading</li>
                    <li>More phone-friendly improvements coming in 2026</li>
                </ul>
                
                <h4 class="font-bold text-white mb-2 mt-6">🏠 Rent-to-Own System <span class="text-amber-400">(Elite Members)</span>:</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li>Create RTO contracts on any property with custom terms</li>
                    <li>Flexible deposit amounts and payment schedules</li>
                    <li>Track every payment with automatic balance calculations</li>
                    <li>Listing ownership transfers on the site when contract completes</li>
                    <li>Edit or delete payments if mistakes are made</li>
                </ul>
                
                <h4 class="font-bold text-white mb-2 mt-6">🏷️ House Sales Tracking:</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li>Log property sales and track the financials on your dashboard</li>
                    <li>Celebration banners when you complete a sale</li>
                    <li>Earn XP and climb the leaderboard with each sale</li>
                    <li>Everything still is coordinated via text — the site just keeps you organized</li>
                </ul>
                
                <h4 class="font-bold text-white mb-2 mt-6">📊 Redesigned Dashboard:</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li>8 new tiles showing exactly what you're earning</li>
                    <li>Income broken down by Daily, Weekly, Biweekly, and Monthly renters</li>
                    <li>Dedicated RTO Income and House Sales tracking</li>
                    <li>Click any tile for a detailed breakdown</li>
                </ul>
                
                <h4 class="font-bold text-white mb-2 mt-6">🔔 Smart Rent Collection Alerts:</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li>Automatic alerts when rent is overdue, due today, or coming up</li>
                    <li>One-click copy for reminder messages to send to tenants</li>
                    <li>Dashboard notifications so you never miss a payment</li>
                    <li>Works for all property owners, not just admin</li>
                </ul>
                
                <h4 class="font-bold text-white mb-2 mt-6">📸 Bulk Image Uploads:</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li>Upload multiple property photos at once</li>
                    <li>Drag and drop to reorder your gallery</li>
                    <li>Horizontal layout for easier browsing</li>
                </ul>
                
                <h4 class="font-bold text-white mb-2 mt-6">🏆 Improved Leaderboard:</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li>XP now updates in real-time as you complete actions</li>
                    <li>Earn XP for logging payments, completing leases, and making sales</li>
                    <li>Privacy protections keep your renters' info private</li>
                </ul>
                
                <h4 class="font-bold text-white mb-2 mt-6">⚡ Under the Hood:</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li>Complete notification system rebuild for reliability</li>
                    <li>Upgraded server infrastructure for faster performance</li>
                    <li>Enhanced security across the entire platform</li>
                    <li>Dozens of bug fixes and quality improvements</li>
                </ul>
                
                <p class="mt-6 text-gray-300">We're going all-in on the phone browser experience. Our goal is to make PaulysProperties.com the smoothest, most useful tool you can access from your phone.</p>
                
                <p class="mt-4 text-gray-400 italic">Questions, ideas, or feedback? <strong class="text-green-400 cursor-pointer hover:text-green-300" onclick="openModal('contactModal')">Text Pauly</strong> — everything you tell us shapes what we build next.</p>
            `
        },
        {
            date: 'December 15, 2024',
            title: '🚀 Two Weeks In - A Complete Property Management Platform',
            category: 'Milestone',
            categoryColor: 'bg-amber-500',
            content: `
                <p class="mb-4">Two weeks ago, PaulysProperties.com was just an idea. Today, we're a fully operational property management platform with nearly <strong>15 registered users</strong> and <strong>30+ active listings</strong> across Los Santos.</p>
                
                <p class="mb-4">Here's everything we've built since December 2nd:</p>
                
                <h4 class="font-bold text-white mb-2 mt-6">For Property Owners:</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li>Create and manage unlimited listings with full image galleries</li>
                    <li>7 property types supported: Apartments, Houses, Condos, Villas, Hotels, Warehouses, and Hideouts</li>
                    <li>Flexible pricing options: Daily, Weekly, Biweekly, Monthly rates plus Buy Price</li>
                    <li>Automatic discount badges that calculate savings for longer-term rentals</li>
                    <li>One-click property status toggling between Available and Rented</li>
                </ul>
                
                <h4 class="font-bold text-white mb-2 mt-6">Tenant & Payment Management:</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li>Track renter names, phone numbers, and private notes for each property</li>
                    <li>Set payment frequency and log payment dates</li>
                    <li>Auto-calculated due dates so you never miss a collection</li>
                    <li>Full payment ledger with history tracking</li>
                    <li>One-click reminder script generation for late payments</li>
                    <li>Overdue alerts that show exactly who owes you money</li>
                </ul>
                
                <h4 class="font-bold text-white mb-2 mt-6">Elite Portfolio Reports <span class="text-amber-400">(Elite Members)</span>:</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li>4-tab analytics dashboard: Overview, Revenue, Occupancy, and Top Performers</li>
                    <li>Vacancy Loss Calculator showing exactly how much empty units cost you weekly and monthly</li>
                    <li>4-Week Cash Flow Forecast to project your upcoming income</li>
                    <li>Overdue and upcoming payment alerts at a glance</li>
                    <li>Top earners ranked by current rent and all-time collections</li>
                    <li>Occupancy breakdowns by property type</li>
                </ul>
                
                <h4 class="font-bold text-white mb-2 mt-6">2-Tier Subscription System:</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li>🌱 <strong>Starter</strong> (Free) - Up to 3 listings, perfect for getting started</li>
                    <li>👑 <strong>Elite</strong> ($25,000/mo) - Unlimited listings plus exclusive Portfolio Reports</li>
                </ul>
                
                <h4 class="font-bold text-white mb-2 mt-6">Photo Services:</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li>Per Photo package: $10,000 for professional HD shots</li>
                    <li>Premium Bundle: $125,000 for 6-7 photos, video tour, and 4 weeks of premium placement</li>
                </ul>
                
                <h4 class="font-bold text-white mb-2 mt-6">Admin Tools:</h4>
                <ul class="list-disc list-inside space-y-1 text-gray-300 mb-4">
                    <li>Real-time dashboard with 8 interactive stat tiles</li>
                    <li>User management: create accounts, adjust tiers, handle upgrades</li>
                    <li>4-type notification system for new users, listings, upgrade requests, and premium activations</li>
                    <li>Property reassignment between owners</li>
                    <li>CSV export for external reporting</li>
                    <li>Activity logging and VIP leads tracking</li>
                </ul>
                
                <p class="mt-6 text-gray-300">This is just the beginning. We're releasing updates weekly based on your feedback. Have a feature request or question? <strong class="text-green-400 cursor-pointer hover:text-green-300" onclick="openModal('contactModal')">Text Pauly</strong> for the fastest response.</p>
                
                <p class="mt-4 text-gray-400 italic">Thank you to everyone who's joined us in these first two weeks. Here's to building something great together.</p>
            `
        }
    ];
    
    blogPage.innerHTML = `
        <div class="max-w-4xl mx-auto">
            <!-- Header -->
            <div class="text-center mb-10">
                <h1 class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-3">
                    📰 Site Updates
                </h1>
                <p class="text-gray-400">Stay informed about new features and improvements</p>
            </div>
            
            <!-- Blog Posts -->
            <div class="space-y-8">
                ${blogPosts.map(post => `
                    <article class="bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden hover:border-purple-500/50 transition">
                        <div class="p-6">
                            <div class="flex items-center gap-3 mb-4">
                                <span class="${post.categoryColor} text-white text-xs font-bold px-3 py-1 rounded-full">${post.category}</span>
                                <span class="text-gray-500 text-sm">${post.date}</span>
                            </div>
                            <h2 class="text-2xl font-bold text-white mb-4">${post.title}</h2>
                            <div class="text-gray-300 leading-relaxed">
                                ${post.content}
                            </div>
                        </div>
                    </article>
                `).join('')}
            </div>
            
            <!-- Footer -->
            <div class="text-center mt-12 py-8 border-t border-gray-700">
                <p class="text-gray-500 text-sm">
                    Updates posted weekly. <span class="text-green-400 cursor-pointer hover:text-green-300" onclick="openModal('contactModal')">Text Pauly</span> with questions or feedback.
                </p>
                <button onclick="navigateTo('home')" class="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-xl font-bold hover:opacity-90 transition">
                    ← Back to Home
                </button>
            </div>
        </div>
    `;
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
    if (emailField) emailField.value = '';
    if (passwordField) passwordField.value = '';
    
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
    if (emailField) emailField.value = '';
    if (passwordField) passwordField.value = '';
    
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
                // Set flag to trigger new user welcome flow after login
                window.isNewUserRegistration = true;
                
                // Create the user with Firebase Auth
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                // Create user document with starter tier
                // NOTE: displayName and phone will be set later when user completes profile
                await db.collection('users').doc(user.uid).set({
                    email: user.email.toLowerCase(),
                    username: '',     // Will be set when user saves their profile
                    phone: '',        // Will be set when user saves their profile
                    tier: 'starter',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                // CREATE ADMIN NOTIFICATION for new user signup (wrapped in try-catch to not break flow)
                try {
                    await db.collection('adminNotifications').add({
                        type: 'new_user',
                        userEmail: user.email.toLowerCase(),
                        displayName: '(Profile incomplete)',
                        tier: 'starter',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        dismissed: false
                    });
                } catch (notifyError) {
                    console.warn('[Auth] Could not create admin notification (non-critical):', notifyError);
                    // Don't break the flow - account creation succeeded
                }
                
                // Clear the flag after document is created
                window.isCreatingAccount = false;
                
                // Show brief success then redirect to dashboard
                errorDiv.className = 'text-green-400 text-sm font-medium text-center p-3 bg-green-900/30 rounded-xl';
                errorDiv.innerHTML = `✓ Account created! Redirecting to your dashboard...`;
                showElement(errorDiv);
                
                // Close modal and navigate to dashboard after brief delay
                setTimeout(() => {
                    closeModal('loginModal');
                    errorDiv.className = 'hidden text-red-400 text-sm font-medium text-center p-3 bg-red-900/30 rounded-xl';
                    // Navigate to dashboard - the auth state change will trigger the new user flow
                    navigateTo('dashboard');
                }, 1500);
                
            } catch (error) {
                // Clear flags on error too
                window.isCreatingAccount = false;
                window.isNewUserRegistration = false;
                
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

// Hide mobile menu helper
window.hideMobileMenu = function() {
    hideElement($('mobileMenu'));
};

window.goToDashboard = function() {
    hideElement($('mobileMenu'));
    if (state.currentUser === 'owner') {
        hideElement($('renterSection'));
        hideElement($('propertyDetailPage'));
        hideElement($('propertyStatsPage'));
        hideElement($('blogPage'));
        hideElement($('leaderboardPage'));
        showElement($('ownerDashboard'));
        renderOwnerDashboard();
        
        // Update nav highlighting
        updateNavHighlight('dashboard');
        
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

// Go to Dashboard -> My Properties tab and highlight rent alerts
window.goToRentAlerts = function() {
    // Use the enterprise scroll-to-highlight pattern
    scrollToAndHighlightElement({
        targetSelector: '#rentNotificationsPanel',
        tabName: 'myProperties',
        maxWaitMs: 3000,
        highlightColor: 'rgba(239, 68, 68, 0.7)',
        glowColor: 'rgba(239, 68, 68, 0.4)',
    });
};

// Go to Dashboard -> Admin Panel and scroll to notifications
window.goToAdminNotifications = async function(type) {
    // Ensure we're on the dashboard
    if (!$('ownerDashboard') || $('ownerDashboard').classList.contains('hidden')) {
        goToDashboard();
        await sleep(300);
    }
    
    // Switch to Admin Panel tab
    if (typeof switchDashboardTab === 'function') {
        switchDashboardTab('admin');
        await sleep(200);
    }
    
    // Determine target based on notification type
    if (type === 'users' || type === 'listings') {
        // For new users and new listings, scroll to the notification stack at top of admin panel
        // This is where "While You Were Away" and "New User Registration" cards appear
        const targetElement = await waitForElement('#adminNotificationsStack', 3000);
        
        if (targetElement && !targetElement.classList.contains('hidden')) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Highlight the notification stack
            const highlightColor = type === 'users' ? 'rgba(59, 130, 246, 0.7)' : 'rgba(34, 197, 94, 0.7)';
            targetElement.style.boxShadow = `0 0 0 4px ${highlightColor}, 0 0 30px ${highlightColor.replace('0.7', '0.4')}`;
            targetElement.style.transition = 'box-shadow 0.3s ease';
            
            setTimeout(() => {
                targetElement.style.boxShadow = '';
            }, 4000);
        }
        
    } else if (type === 'premium') {
        // For premium requests, scroll to the premium alert section
        const targetElement = await waitForElement('#pendingPremiumAlert', 3000);
        
        if (targetElement && !targetElement.classList.contains('hidden')) {
            // Expand the details if collapsed
            const listEl = $('premiumRequestsList');
            if (listEl && listEl.classList.contains('hidden')) {
                if (typeof showPremiumRequestsList === 'function') {
                    showPremiumRequestsList();
                }
            }
            
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            const highlightColor = 'rgba(245, 158, 11, 0.7)';
            targetElement.style.boxShadow = `0 0 0 4px ${highlightColor}, 0 0 30px ${highlightColor.replace('0.7', '0.4')}`;
            targetElement.style.transition = 'box-shadow 0.3s ease';
            
            setTimeout(() => {
                targetElement.style.boxShadow = '';
            }, 4000);
        }
        
    } else if (type === 'photo') {
        // For photo requests, switch to Requests subtab and highlight photo section
        if (typeof switchAdminTab === 'function') {
            switchAdminTab('requests');
            await sleep(200);
        }
        
        // Load fresh photo requests
        if (typeof loadPhotoRequests === 'function') {
            loadPhotoRequests();
        }
        
        const targetElement = await waitForElement('#photoRequestsSection', 3000);
        
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            const highlightColor = 'rgba(168, 85, 247, 0.7)';
            targetElement.style.boxShadow = `0 0 0 4px ${highlightColor}, 0 0 30px ${highlightColor.replace('0.7', '0.4')}`;
            targetElement.style.transition = 'box-shadow 0.3s ease';
            
            setTimeout(() => {
                targetElement.style.boxShadow = '';
            }, 4000);
        }
        
    } else {
        // Default: scroll to notification stack
        const targetElement = await waitForElement('#adminNotificationsStack', 3000);
        
        if (targetElement && !targetElement.classList.contains('hidden')) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
};

window.backToDashboard = function() {
    hideElement($('propertyStatsPage'));
    hideElement($('blogPage'));
    
    // Return to the page user came from
    if (window.navigationSource === 'properties') {
        hideElement($('ownerDashboard'));
        showElement($('renterSection'));
        
        // Re-apply filters
        if (typeof applyAllFilters === 'function') {
            applyAllFilters();
        }
        
        // Restore scroll position
        if (typeof window.savedScrollPosition === 'number') {
            setTimeout(() => {
                window.scrollTo(0, window.savedScrollPosition);
            }, 50);
        } else {
            $('properties')?.scrollIntoView({ behavior: 'smooth' });
        }
    } else {
        // Default: go to dashboard
        showElement($('ownerDashboard'));
        
        // Restore scroll position if available
        if (typeof window.savedScrollPosition === 'number') {
            setTimeout(() => {
                window.scrollTo(0, window.savedScrollPosition);
            }, 50);
        } else {
            window.scrollTo(0, 0);
        }
    }
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
    hideElement($('blogPage'));
    showElement($('renterSection'));
    
    // Re-apply filters to ensure checkbox state matches displayed properties
    if (typeof applyAllFilters === 'function') {
        applyAllFilters();
    }
    
    window.scrollTo(0, 0);
};

// Update which nav link is highlighted as active
window.updateNavHighlight = function(activeSection) {
    // All nav link IDs
    const navLinks = {
        home: 'navHomeLink',
        properties: 'navPropertiesLink', 
        leaderboard: 'navLeaderboardLink',
        services: 'navServicesLink',
        dashboard: 'navDashboardLink'
    };
    
    // Reset all nav links to gray
    Object.values(navLinks).forEach(linkId => {
        const link = $(linkId);
        if (link) {
            link.classList.remove('text-purple-400');
            link.classList.add('text-gray-300');
        }
    });
    
    // Highlight the active link in purple
    const activeLink = $(navLinks[activeSection]);
    if (activeLink) {
        activeLink.classList.remove('text-gray-300');
        activeLink.classList.add('text-purple-400');
    }
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
    hideElement($('blogPage'));
    hideElement($('leaderboardPage'));
    
    // Update nav highlighting
    updateNavHighlight(section);
    
    // Handle home - scroll to absolute top
    if (section === 'home') {
        showElement($('renterSection'));
        
        // Re-apply filters to ensure checkbox state matches displayed properties
        if (typeof applyAllFilters === 'function') {
            applyAllFilters();
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    
    // Handle blog page specially
    if (section === 'blog') {
        hideElement($('renterSection'));
        showElement($('blogPage'));
        renderBlogPage();
        window.scrollTo(0, 0);
        return;
    }
    
    // Handle leaderboard page
    if (section === 'leaderboard') {
        hideElement($('renterSection'));
        showElement($('leaderboardPage'));
        renderLeaderboardPage();
        window.scrollTo(0, 0);
        return;
    }
    
    showElement($('renterSection'));
    
    // Re-apply filters when navigating to properties section
    // This ensures checkbox state matches displayed properties
    if (section === 'properties' && typeof applyAllFilters === 'function') {
        applyAllFilters();
    }
    
    setTimeout(() => $(section)?.scrollIntoView({ behavior: 'smooth' }), 100);
};

window.goBack = function() {
    hideElement($('propertyDetailPage'));
    hideElement($('propertyStatsPage'));
    hideElement($('leaderboardPage'));
    hideElement($('blogPage'));
    hideElement($('ownerDashboard'));
    showElement($('renterSection'));
    
    // Re-apply filters to ensure checkbox state matches displayed properties
    if (typeof applyAllFilters === 'function') {
        applyAllFilters();
    }
    
    // Restore scroll position (saved when user clicked on a property)
    if (typeof window.savedScrollPosition === 'number') {
        // Small delay to ensure DOM is ready after showing renterSection
        setTimeout(() => {
            window.scrollTo(0, window.savedScrollPosition);
        }, 50);
    } else {
        $('properties').scrollIntoView({ behavior: 'smooth' });
    }
};

// ==================== SITE SWITCHER ====================
/**
 * Toggle the site switcher dropdown (PaulysProperties / PaulysAutos)
 */
window.toggleSiteSwitcher = function() {
    const dropdown = $('siteSwitcherDropdown');
    const arrow = $('siteSwitcherArrow');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
        if (arrow) {
            arrow.classList.toggle('rotate-180');
        }
    }
};

/**
 * Close the site switcher dropdown
 */
window.closeSiteSwitcher = function() {
    const dropdown = $('siteSwitcherDropdown');
    const arrow = $('siteSwitcherArrow');
    if (dropdown && !dropdown.classList.contains('hidden')) {
        dropdown.classList.add('hidden');
        if (arrow) {
            arrow.classList.remove('rotate-180');
        }
    }
};

// Close site switcher when clicking outside
document.addEventListener('click', function(e) {
    const container = $('siteSwitcherContainer');
    if (container && !container.contains(e.target)) {
        closeSiteSwitcher();
    }
});

// Legacy fallback for cached HTML - Services submenu was moved to hero banner
function toggleServicesSubmenu(event) {
    if (event) event.preventDefault();
    openPhotoServicesModal();
    closeUserDropdown();
}

// ==================== NEW USER WELCOME FLOW ====================
/**
 * Trigger the new user welcome flow after registration
 * - Shows welcome banner
 * - Highlights profile fields
 * - Scrolls to profile section
 * - Requires Display Name and Phone before listing
 */
window.triggerNewUserWelcome = function() {
    console.log('[NewUser] Triggering welcome flow...');
    
    // Show the welcome banner
    const welcomeBanner = $('newUserWelcomeBanner');
    if (welcomeBanner) {
        welcomeBanner.classList.remove('hidden');
    }
    
    // Show required indicators
    const cityNameRequired = $('cityNameRequired');
    const cityPhoneRequired = $('cityPhoneRequired');
    if (cityNameRequired) cityNameRequired.classList.remove('hidden');
    if (cityPhoneRequired) cityPhoneRequired.classList.remove('hidden');
    
    // Add highlight styling to field wrappers
    const displayNameWrapper = $('displayNameFieldWrapper');
    const phoneWrapper = $('phoneFieldWrapper');
    
    if (displayNameWrapper) {
        displayNameWrapper.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))';
        displayNameWrapper.style.border = '2px solid rgb(34, 197, 94)';
        displayNameWrapper.style.boxShadow = '0 0 20px rgba(34, 197, 94, 0.3)';
    }
    
    if (phoneWrapper) {
        phoneWrapper.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))';
        phoneWrapper.style.border = '2px solid rgb(34, 197, 94)';
        phoneWrapper.style.boxShadow = '0 0 20px rgba(34, 197, 94, 0.3)';
    }
    
    // Scroll to the profile section after a brief delay
    setTimeout(() => {
        const profileSection = $('profileSettingsSection');
        if (profileSection) {
            profileSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        // Focus the display name input
        setTimeout(() => {
            const cityNameInput = $('ownerUsername');
            if (cityNameInput) {
                cityNameInput.focus();
            }
        }, 500);
    }, 300);
    
    // Clear the new user flag
    window.isNewUserRegistration = false;
};

/**
 * Clear the new user welcome styling (called after profile is saved)
 */
window.clearNewUserWelcome = function() {
    // Hide welcome banner
    const welcomeBanner = $('newUserWelcomeBanner');
    if (welcomeBanner) {
        welcomeBanner.classList.add('hidden');
    }
    
    // Hide required indicators
    const cityNameRequired = $('cityNameRequired');
    const cityPhoneRequired = $('cityPhoneRequired');
    if (cityNameRequired) cityNameRequired.classList.add('hidden');
    if (cityPhoneRequired) cityPhoneRequired.classList.add('hidden');
    
    // Remove highlight styling
    const displayNameWrapper = $('displayNameFieldWrapper');
    const phoneWrapper = $('phoneFieldWrapper');
    
    if (displayNameWrapper) {
        displayNameWrapper.style.background = '';
        displayNameWrapper.style.border = '';
        displayNameWrapper.style.boxShadow = '';
    }
    
    if (phoneWrapper) {
        phoneWrapper.style.background = '';
        phoneWrapper.style.border = '';
        phoneWrapper.style.boxShadow = '';
    }
};

