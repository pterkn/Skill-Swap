import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ref, onDisconnect, set } from 'firebase/database';

import { auth, db, dbRealtime } from '../firebase'; // FIXED

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setAuthUser(user);
        const userDocRef = doc(db, 'users', user.email);

        const unsubscribeSnap = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        });

        // ✅ Use Realtime DB to mark user online
        const safeEmail = user.email.replace(/\./g, '_');
        const statusRef = ref(dbRealtime, `status/${safeEmail}`);

        set(statusRef, { online: true });
        onDisconnect(statusRef).set({
          online: false,
          lastSeen: serverTimestamp(),
        });

        await updateDoc(userDocRef, {
          lastSeen: serverTimestamp(),
        });

        setLoading(false);

        return () => unsubscribeSnap();
      } else {
        setAuthUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <UserContext.Provider value={{ authUser, userData, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
