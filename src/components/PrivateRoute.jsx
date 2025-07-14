
import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading, null = not logged in
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <p>Loading...</p>;

  return user ? children : <Navigate to="/" />;
}
