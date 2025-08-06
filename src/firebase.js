// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { 
  getFirestore, 
  connectFirestoreEmulator,
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  doc,
  getDoc,
  enableNetwork,
  disableNetwork,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED
} from "firebase/firestore";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyD_r3gRWiAqqxbrUofwBsLL-SjpI48oQcQ",
  authDomain: "skill-swap-c120d.firebaseapp.com",
  databaseURL: "https://skill-swap-c120d-default-rtdb.firebaseio.com",
  projectId: "skill-swap-c120d",
  storageBucket: "skill-swap-c120d.appspot.com",
  messagingSenderId: "589789024180",
  appId: "1:589789024180:web:f86da7794f070469c82ce1",
  measurementId: "G-N9ZGELZFXS"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services with better caching
export const auth = getAuth(app);

// Initialize Firestore with enhanced settings for your app
export const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  experimentalForceLongPolling: false, // Set to true if you have connection issues
});

export const dbRealtime = getDatabase(app);
export const storage = getStorage(app);

// Development Environment Setup
if (process.env.NODE_ENV === 'development') {
  // Only connect to emulators if they haven't been connected already
  // Uncomment these lines if you want to use Firebase emulators in development
  
  // if (!auth._delegate._config.emulator) {
  //   connectAuthEmulator(auth, "http://localhost:9099");
  // }
  // if (!db._delegate._databaseId.database.includes('localhost')) {
  //   connectFirestoreEmulator(db, 'localhost', 8080);
  // }
  // connectDatabaseEmulator(dbRealtime, "localhost", 9000);
  // connectStorageEmulator(storage, "localhost", 9199);
}

// ================================
//  Firebase Data Helper Methods
// ================================

/**
 * Fetch all users from Firestore with error handling
 * @returns {Promise<Array<Object>>} Array of user documents
 */
export const fetchAllUsers = async () => {
  try {
    const snapshot = await getDocs(collection(db, "users"));
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      email: doc.id, // Since we're using email as document ID
      ...doc.data() 
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
    throw new Error(`Failed to fetch users: ${getFirestoreErrorMessage(error)}`);
  }
};

/**
 * Fetch user by email with retry logic
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User document or null
 */
export const fetchUserByEmail = async (email) => {
  try {
    const userDoc = await getDoc(doc(db, "users", email));
    if (userDoc.exists()) {
      return { id: userDoc.id, email: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user:", error);
    // Return null instead of throwing for user profiles that might not exist yet
    return null;
  }
};

/**
 * Fetch reviews for a specific user with fallback queries
 * @param {string} userEmail - User email to get reviews for
 * @returns {Promise<Array<Object>>} Array of review documents
 */
export const fetchUserReviews = async (userEmail) => {
  try {
    console.log('Fetching reviews for:', userEmail);
    
    // First try with orderBy (requires index)
    try {
      const reviewsQuery = query(
        collection(db, "reviews"),
        where("reviewee", "==", userEmail),
        orderBy("createdAt", "desc")
      );
      
      const snapshot = await getDocs(reviewsQuery);
      const reviews = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      console.log('Reviews fetched with orderBy:', reviews.length);
      return reviews;
      
    } catch (indexError) {
      if (indexError.code === 'failed-precondition' || indexError.message.includes('index')) {
        console.log('Index missing, trying fallback query...');
        
        // Fallback: query without orderBy
        const fallbackQuery = query(
          collection(db, "reviews"),
          where("reviewee", "==", userEmail)
        );
        
        const snapshot = await getDocs(fallbackQuery);
        const reviews = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        
        // Sort manually by creation date
        reviews.sort((a, b) => {
          const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return bTime - aTime; // Newest first
        });
        
        console.log('Reviews fetched with fallback:', reviews.length);
        return reviews;
      }
      throw indexError;
    }
    
  } catch (error) {
    console.error("Error fetching reviews:", error);
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please check your login status.');
    }
    throw new Error(`Failed to fetch reviews: ${getFirestoreErrorMessage(error)}`);
  }
};

/**
 * Fetch all skills from Firestore with enhanced query options
 * @param {Object} options - Query options
 * @param {string} options.userEmail - Filter by user email
 * @param {number} options.limit - Limit number of results
 * @returns {Promise<Array<Object>>} Array of skill documents
 */
export const fetchAllSkills = async (options = {}) => {
  try {
    let skillsQuery = collection(db, "skills");
    
    const constraints = [];
    
    if (options.userEmail) {
      constraints.push(where("email", "==", options.userEmail));
    }
    
    // Try with orderBy first, fallback if index missing
    try {
      constraints.push(orderBy("createdAt", "desc"));
      skillsQuery = query(skillsQuery, ...constraints);
      
      const snapshot = await getDocs(skillsQuery);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
    } catch (indexError) {
      if (indexError.code === 'failed-precondition' || indexError.message.includes('index')) {
        console.log('Skills index missing, using fallback query...');
        
        // Remove orderBy and try again
        const fallbackConstraints = constraints.slice(0, -1); // Remove orderBy
        if (fallbackConstraints.length > 0) {
          skillsQuery = query(skillsQuery, ...fallbackConstraints);
        }
        
        const snapshot = await getDocs(skillsQuery);
        const skills = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        
        // Sort manually
        skills.sort((a, b) => {
          const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return bTime - aTime;
        });
        
        return skills;
      }
      throw indexError;
    }
    
  } catch (error) {
    console.error("Error fetching skills:", error);
    throw new Error(`Failed to fetch skills: ${getFirestoreErrorMessage(error)}`);
  }
};

/**
 * Search skills by keyword with better text matching
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array<Object>>} Array of matching skill documents
 */
export const searchSkills = async (searchTerm) => {
  try {
    // Get all skills first (you could optimize this with full-text search later)
    const allSkills = await fetchAllSkills();
    
    const searchLower = searchTerm.toLowerCase().trim();
    if (!searchLower) return allSkills;
    
    return allSkills.filter(skill => {
      const offered = (skill.offered || '').toLowerCase();
      const requested = (skill.requested || '').toLowerCase();
      const description = (skill.description || '').toLowerCase();
      const email = (skill.email || '').toLowerCase();
      
      return offered.includes(searchLower) || 
             requested.includes(searchLower) || 
             description.includes(searchLower) ||
             email.includes(searchLower);
    });
  } catch (error) {
    console.error("Error searching skills:", error);
    throw new Error(`Failed to search skills: ${getFirestoreErrorMessage(error)}`);
  }
};

/**
 * Get comprehensive user statistics
 * @param {string} userEmail - User email
 * @returns {Promise<Object>} User statistics
 */
export const getUserStats = async (userEmail) => {
  try {
    const [reviews, skills] = await Promise.all([
      fetchUserReviews(userEmail).catch(() => []), // Don't fail if reviews fail
      fetchAllSkills({ userEmail }).catch(() => []) // Don't fail if skills fail
    ]);
    
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length 
      : 0;
    
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      const rating = Math.floor(review.rating || 0);
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating]++;
      }
    });
    
    return {
      totalReviews: reviews.length,
      averageRating: Math.round(averageRating * 10) / 10,
      totalSkills: skills.length,
      ratingDistribution,
      recentReviews: reviews.slice(0, 3),
      topRatedReviews: reviews
        .filter(r => r.rating >= 4)
        .sort((a, b) => (b.comment?.length || 0) - (a.comment?.length || 0))
        .slice(0, 2),
      skillsOffered: skills.filter(s => s.offered).length,
      skillsWanted: skills.filter(s => s.requested).length,
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    // Return default stats instead of throwing
    return {
      totalReviews: 0,
      averageRating: 0,
      totalSkills: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      recentReviews: [],
      topRatedReviews: [],
      skillsOffered: 0,
      skillsWanted: 0,
    };
  }
};

// ================================
//  Connection Management
// ================================

/**
 * Enable Firestore offline persistence
 */
export const enableOfflineSupport = async () => {
  try {
    await enableNetwork(db);
    console.log("Firestore offline support enabled");
  } catch (error) {
    console.warn("Could not enable offline support:", error);
  }
};

/**
 * Disable Firestore network
 */
export const disableOfflineSupport = async () => {
  try {
    await disableNetwork(db);
    console.log("Firestore network disabled");
  } catch (error) {
    console.warn("Could not disable network:", error);
  }
};

// ================================
//  Error Handling Utilities
// ================================

/**
 * Handle Firebase Auth errors with user-friendly messages
 * @param {Error} error - Firebase error
 * @returns {string} User-friendly error message
 */
export const getAuthErrorMessage = (error) => {
  switch (error.code) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/invalid-credential':
      return 'Invalid credentials. Please check your email and password.';
    default:
      return error.message || 'An unexpected authentication error occurred.';
  }
};

/**
 * Handle Firestore errors with user-friendly messages
 * @param {Error} error - Firestore error
 * @returns {string} User-friendly error message
 */
export const getFirestoreErrorMessage = (error) => {
  switch (error.code) {
    case 'permission-denied':
      return 'You do not have permission to perform this action.';
    case 'not-found':
      return 'The requested data was not found.';
    case 'already-exists':
      return 'This data already exists.';
    case 'resource-exhausted':
      return 'Service temporarily overloaded. Please try again later.';
    case 'unavailable':
      return 'Service temporarily unavailable. Please try again.';
    case 'unauthenticated':
      return 'Please log in to continue.';
    case 'failed-precondition':
      return 'Database index required. Please contact support.';
    case 'invalid-argument':
      return 'Invalid data provided.';
    case 'cancelled':
      return 'Operation was cancelled.';
    case 'deadline-exceeded':
      return 'Operation timed out. Please try again.';
    default:
      return error.message || 'A database error occurred.';
  }
};

// ================================
//  Collection References
// ================================

// Export commonly used collection references
export const collections = {
  users: collection(db, "users"),
  skills: collection(db, "skills"),
  reviews: collection(db, "reviews"),
  chats: collection(db, "chats"),
  messages: collection(db, "messages"),
};

// Development helper to check Firebase connection
if (process.env.NODE_ENV === 'development') {
  console.log('🔥 Firebase initialized successfully');
  console.log('Project ID:', app.options.projectId);
  console.log('Auth Domain:', app.options.authDomain);
  console.log('Environment: Development');
}

// Export a function to test Firebase connection
export const testFirebaseConnection = async () => {
  try {
    console.log('Testing Firebase connection...');
    
    // Test auth
    console.log('Auth initialized:', !!auth.currentUser || 'Ready for login');
    
    // Test Firestore
    const testDoc = doc(db, 'test', 'connection');
    await getDoc(testDoc); // This will work even if doc doesn't exist
    console.log('Firestore: Connected ');
    
    // Test Realtime Database
    console.log('Realtime DB: Connected ');
    
    // Test Storage
    console.log('Storage: Connected ');
    
    return true;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
};