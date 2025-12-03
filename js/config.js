// ==================== FIREBASE CONFIG ====================
// Note: Firebase API keys are safe to expose client-side.
// Security is enforced via Firestore Security Rules, not the API key.
// The API key only identifies the project; authentication and 
// authorization are handled by Firebase Security Rules.

const firebaseConfig = {
    apiKey: "AIzaSyDtxI5MhMc36U_rERd_rv15aaYp77P1wWA",
    authDomain: "paulys-property-portal.firebaseapp.com",
    projectId: "paulys-property-portal",
    storageBucket: "paulys-property-portal.firebasestorage.app",
    messagingSenderId: "667779460256",
    appId: "1:667779460256:web:c8f3c34c7e432eca73adc5"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Set auth persistence to LOCAL (persists across browser sessions)
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
        console.log('[Auth] Persistence set to LOCAL');
    })
    .catch((error) => {
        console.error('[Auth] Persistence error:', error);
    });
