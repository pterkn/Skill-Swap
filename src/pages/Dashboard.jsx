
import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Toast from '../components/Toast';
import '../style.css';

export default function Dashboard() {
  const [skills, setSkills] = useState([]);
  const [offered, setOffered] = useState('');
  const [requested, setRequested] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) navigate('/');
      else {
        const ref = collection(db, 'skills');
        onSnapshot(ref, (snapshot) => {
          const all = snapshot.docs.map(doc => doc.data());
          all.sort((a, b) => a.offered.localeCompare(b.offered));
          setSkills(all);
          setLoading(false);
        });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    try {
      await addDoc(collection(db, 'skills'), {
        email: user.email,
        offered,
        requested,
        createdAt: serverTimestamp()
      });
      setToastMsg('✅ Skill added successfully');
      setShowToast(true);
      setOffered('');
      setRequested('');
    } catch (err) {
      setToastMsg('❌ Failed to add skill');
      setShowToast(true);
    }
  };

  const filtered = skills.filter(skill =>
    skill.offered?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    skill.requested?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Header showLogout={true} />
      <div className="container">
        <h2>Welcome to SkillSwap</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Skill You Offer"
            value={offered}
            onChange={(e) => setOffered(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Skill You Want"
            value={requested}
            onChange={(e) => setRequested(e.target.value)}
            required
          />
          <button type="submit">Add Skill</button>
        </form>

        <input
          type="text"
          placeholder="Search skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {loading ? (
          <div className="spinner">Loading...</div>
        ) : filtered.length === 0 ? (
          <p>No skills found.</p>
        ) : (
          <ul>
            {filtered.map((s, i) => (
              <li key={i}>
                {s.email}: Offers <strong>{s.offered}</strong> | Wants <strong>{s.requested}</strong>
                {s.email !== auth.currentUser?.email && (
                  <>
                    <button onClick={() => navigate(`/chat?partner=${s.email}`)}>Chat</button>
                    <button onClick={() => navigate(`/review?user=${s.email}`)}>Rate</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
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
