import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateEmail as firebaseUpdateEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { sanitizeProfileUpdates } from '../services/userProfileService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserProfile(userSnap.data());
      } else {
        setUserProfile(null);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setUserProfile(null);
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Login
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await fetchUserProfile(result.user.uid);
      return result;
    } catch (err) {
      const msg = getFirebaseErrorMessage(err.code);
      setAuthError(msg);
      throw err;
    }
  };

  // Register (creates Auth user + Firestore profile with isAdmin: false)
  const register = async (email, password, role, displayName) => {
    setAuthError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const userRef = doc(db, 'users', result.user.uid);
      const profile = {
        uid: result.user.uid,
        email: email.toLowerCase(),
        displayName: displayName || email.split('@')[0],
        role,
        isAdmin: false,
        createdAt: serverTimestamp()
      };
      await setDoc(userRef, profile);
      setUserProfile(profile);
      return result;
    } catch (err) {
      const msg = getFirebaseErrorMessage(err.code);
      setAuthError(msg);
      throw err;
    }
  };

  // Update profile
  const updateUserProfile = async (updates) => {
    if (!currentUser?.uid) {
      throw new Error('Utilisateur non authentifié');
    }

    const sanitized = sanitizeProfileUpdates(updates);

    try {
      if (sanitized.email && sanitized.email !== currentUser.email?.toLowerCase()) {
        await firebaseUpdateEmail(currentUser, sanitized.email);
      }

      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, sanitized, { merge: true });
      setUserProfile((prev) => ({ ...prev, ...sanitized }));
      setCurrentUser((prev) => prev ? { ...prev, email: sanitized.email || prev.email } : prev);
    } catch (err) {
      console.error('Error updating user profile:', err);
      throw err;
    }
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  // Helper: readable Firebase error messages
  const getFirebaseErrorMessage = (code) => {
    switch (code) {
      case 'auth/user-not-found': return 'Aucun compte trouvé avec cet email.';
      case 'auth/wrong-password': return 'Mot de passe incorrect.';
      case 'auth/invalid-email': return 'Adresse email invalide.';
      case 'auth/email-already-in-use': return 'Cet email est déjà utilisé.';
      case 'auth/weak-password': return 'Le mot de passe doit contenir au moins 6 caractères.';
      case 'auth/invalid-credential': return 'Email ou mot de passe incorrect.';
      case 'auth/too-many-requests': return 'Trop de tentatives. Réessayez plus tard.';
      case 'auth/requires-recent-login': return 'Cette opération nécessite une reconnexion récente.';
      default: return 'Une erreur est survenue. Vérifiez votre connexion.';
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    authError,
    setAuthError,
    login,
    register,
    logout,
    updateUserProfile,
    isAdmin: userProfile?.isAdmin === true
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
