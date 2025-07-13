
import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Toast from '../components/Toast';
import '../style.css';

export default function Profile() {
  const [userEmail, setUserEmail] = useState('');
  const [skills, setSkills] = useState([]);
  const [profile, setProfile] = useState({ displayName: '', bio: '' });
  const [edit, setEdit] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserEmail(user.email);
        fetchSkills(user.email);
        fetchProfile(user.email);
      } else {
        navigate('/');
      }
    });
  }, [navigate]);

  const fetchSkills = async (email) => {
    const q = query(collection(db, 'skills'), where('email', '==', email));
    const snap = await getDocs(q);
    setSkills(snap.docs.map(doc => doc.data()));
  };

  const fetchProfile = async (email) => {
    const ref = doc(db, 'users', email);
    const snap = await getDoc(ref);
    if (snap.exists()) setProfile(snap.data());
  };

  const handleSave = async () => {
    try {
      await setDoc(doc(db, 'users', userEmail), {
        ...profile,
        updatedAt: new Date()
      });
      setToastMsg(' Profile updated');
      setShowToast(true);
      setEdit(false);
    } catch (err) {
      setToastMsg(' Failed to update profile');
      setShowToast(true);
    }
  };

  return (
    <>
      <Header showLogout={true} />
      <div className="container">
        <h2>Your Profile</h2>
        <p><strong>Email:</strong> {userEmail}</p>

        {edit ? (
          <>
            <input
              type="text"
              placeholder="Display Name"
              value={profile.displayName}
              onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
            />
            <textarea
              placeholder="Bio"
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            />
            <button onClick={handleSave}>Save</button>
          </>
        ) : (
          <>
            <p><strong>Name:</strong> {profile.displayName || '(Not set)'}</p>
            <p><strong>Bio:</strong> {profile.bio || '(No bio)'}</p>
            <button onClick={() => setEdit(true)}>Edit Profile</button>
          </>
        )}

        <h3>Your Skills</h3>
        <ul>
          {skills.length === 0 ? (
            <li>No skills listed.</li>
          ) : (
            skills.map((s, i) => (
              <li key={i}>Offers <strong>{s.offered}</strong> | Wants <strong>{s.requested}</strong></li>
            ))
          )}
        </ul>
      </div>

      <Toast
        message={toastMsg}
        visible={showToast}
        onHide={() => setShowToast(false)}
        type="info"
      />
    </>
  );
}
