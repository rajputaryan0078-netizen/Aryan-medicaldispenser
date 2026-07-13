import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, isConfigured } from '../firebase/config';

interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Monitor auth state changes
  useEffect(() => {
    if (isConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || undefined
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Firebase not configured – no authentication available
      console.warn('[Auth] Firebase not configured. Authentication unavailable.');
      setLoading(false);
    }
  }, []);

  // Login method
  const login = async (email: string, password: string) => {
    if (!isConfigured || !auth) {
      throw new Error('Firebase is not configured. Please set up environment variables.');
    }
    await signInWithEmailAndPassword(auth, email, password);
  };

  // Sign up method
  const signup = async (email: string, password: string, name: string) => {
    if (!isConfigured || !auth) {
      throw new Error('Firebase is not configured. Please set up environment variables.');
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName: name });
      setUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email || '',
        displayName: name
      });
    }
  };

  // Logout method
  const logout = async () => {
    if (!isConfigured || !auth) {
      throw new Error('Firebase is not configured.');
    }
    await signOut(auth);
  };

  // Password Reset method
  const resetPassword = async (email: string) => {
    if (!isConfigured || !auth) {
      throw new Error('Firebase is not configured. Please set up environment variables.');
    }
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, resetPassword }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
};
