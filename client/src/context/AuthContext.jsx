import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../services/firebase/firebaseConfig';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to normalize user ID / username to valid email format if no '@' is present
  // Also replaces any spaces in the identifier with underscores
  const formatEmail = (identifier) => {
    const trimmed = identifier.trim();
    if (!trimmed) return '';
    const replaced = trimmed.replace(/\s+/g, '_');
    if (replaced.includes('@')) return replaced;
    return `${replaced.toLowerCase()}@pathshala.ai`;
  };

  const signup = async (identifier, password) => {
    const email = formatEmail(identifier);
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const login = async (identifier, password) => {
    const email = formatEmail(identifier);
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Format user display name (e.g. "alex" from "alex@pathshala.ai" or full email)
  const getUserDisplayName = (user) => {
    if (!user || !user.email) return 'User';
    if (user.email.endsWith('@pathshala.ai')) {
      return user.email.replace('@pathshala.ai', '');
    }
    return user.email;
  };

  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    getUserDisplayName,
    formatEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
