import { createContext, useContext, useState, useEffect } from 'react';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  updateProfile, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../services/firebase/firebaseConfig';
import { 
  createUserProfile, 
  getUserProfile, 
  checkPhoneRegistered,
  updateUserProfile 
} from '../services/firebase/userService';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearRecaptcha = (containerId = 'recaptcha-container') => {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        // Ignore clear error
      }
      window.recaptchaVerifier = null;
    }
    try {
      const container = document.getElementById(containerId);
      if (container && container.parentNode) {
        const fresh = document.createElement('div');
        fresh.id = containerId;
        container.parentNode.replaceChild(fresh, container);
      }
    } catch (e) {
      // Ignore DOM replace error
    }
  };

  // Initialize or reset invisible reCAPTCHA verifier
  const setupRecaptcha = (containerId = 'recaptcha-container') => {
    try {
      // Clean up previous instance and ensure a fresh, unrendered DOM element
      clearRecaptcha(containerId);

      const container = document.getElementById(containerId);
      if (!container) {
        console.warn(`reCAPTCHA container #${containerId} not found in DOM.`);
        return null;
      }

      window.recaptchaVerifier = new RecaptchaVerifier(auth, container, {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          console.warn('reCAPTCHA expired, resetting...');
          clearRecaptcha(containerId);
        }
      });

      return window.recaptchaVerifier;
    } catch (err) {
      console.error('Error configuring invisible reCAPTCHA:', err);
      throw err;
    }
  };

  /**
   * Sends phone OTP via Firebase Phone Auth
   * @param {string} formattedPhoneNumber - E.164 phone string
   * @param {string} containerId - DOM container ID for reCAPTCHA
   * @returns {Promise<ConfirmationResult>}
   */
  const sendPhoneOtp = async (formattedPhoneNumber, containerId = 'recaptcha-container') => {
    const verifier = setupRecaptcha(containerId);
    return signInWithPhoneNumber(auth, formattedPhoneNumber, verifier);
  };

  /**
   * Verifies OTP for Sign Up, saves profile in Firestore and updates Auth displayName
   * @param {ConfirmationResult} confirmationResult 
   * @param {string} otpCode 
   * @param {Object} details - { name, email, phoneNumber }
   */
  const verifyOtpAndSignUp = async (confirmationResult, otpCode, { name, email, phoneNumber }) => {
    const userCredential = await confirmationResult.confirm(otpCode);
    const user = userCredential.user;

    // 1. Update Firebase Auth user displayName
    if (name && name.trim()) {
      try {
        await updateProfile(user, { displayName: name.trim() });
      } catch (err) {
        console.warn('Failed to set displayName on auth user:', err);
      }
    }

    // 2. Persist profile document in Firestore
    const profile = await createUserProfile(user.uid, {
      displayName: name,
      phoneNumber: phoneNumber || user.phoneNumber,
      email: email || null
    });

    setUserProfile(profile);
    return user;
  };

  /**
   * Verifies OTP for Sign In, fetches profile from Firestore
   * @param {ConfirmationResult} confirmationResult 
   * @param {string} otpCode 
   */
  const verifyOtpAndSignIn = async (confirmationResult, otpCode) => {
    const userCredential = await confirmationResult.confirm(otpCode);
    const user = userCredential.user;

    // Retrieve user profile from Firestore
    let profile = await getUserProfile(user.uid);
    
    // Sync displayName if available
    if (profile && profile.displayName && !user.displayName) {
      try {
        await updateProfile(user, { displayName: profile.displayName });
      } catch (e) {}
    }

    setUserProfile(profile);
    return { user, profile };
  };

  /**
   * Updates user displayName and email in Firebase Auth, Firestore, and local state
   */
  const updateProfileDetails = async ({ displayName, email }) => {
    if (!currentUser) throw new Error('No user is currently logged in.');

    const cleanName = (displayName || '').trim();
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    // 1. Update Firebase Auth displayName
    if (cleanName) {
      try {
        await updateProfile(currentUser, { displayName: cleanName });
      } catch (err) {
        console.warn('Failed to update auth displayName:', err);
      }
    }

    // 2. Update Firestore profile
    await updateUserProfile(currentUser.uid, {
      displayName: cleanName,
      email: cleanEmail,
      phoneNumber: userProfile?.phoneNumber || currentUser.phoneNumber || ''
    });

    // 3. Update local state
    setUserProfile((prev) => ({
      ...prev,
      displayName: cleanName,
      email: cleanEmail,
      phoneNumber: prev?.phoneNumber || currentUser.phoneNumber || ''
    }));

    return { displayName: cleanName, email: cleanEmail };
  };

  const logout = () => {
    setUserProfile(null);
    clearRecaptcha();
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (err) {
          console.error('Failed to load user profile on auth state change:', err);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      clearRecaptcha();
    };
  }, []);

  // Format user display name (checks Firestore profile, Auth displayName, phone number)
  const getUserDisplayName = (user) => {
    if (userProfile?.displayName && userProfile.displayName.trim()) {
      return userProfile.displayName.trim();
    }
    if (user?.displayName && user.displayName.trim()) {
      return user.displayName.trim();
    }
    if (userProfile?.phoneNumber) {
      return userProfile.phoneNumber;
    }
    if (user?.phoneNumber) {
      return user.phoneNumber;
    }
    return 'Student';
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    sendPhoneOtp,
    verifyOtpAndSignUp,
    verifyOtpAndSignIn,
    logout,
    getUserDisplayName,
    checkPhoneRegistered,
    setupRecaptcha,
    clearRecaptcha,
    setUserProfile,
    updateProfileDetails
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
