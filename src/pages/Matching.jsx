

import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import '../style.css';

export default function Matching() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/');
      return;
    }

    const fetchMatches = async () => {
      const snap = await getDocs(collection(db, 'skills'));
      const allSkills = snap.docs.map(doc => doc.data());

      const mySkills = allSkills.filter(s => s.email === user.email);
      const others = allSkills.filter(s => s.email !== user.email);

      const suggested = others.filter(other =>
        mySkills.some(mine =>
          mine.offered?.toLowerCase() === other.requested?.toLowerCase() ||
          mine.requested?.toLowerCase() === other.offered?.toLowerCase()
        )
      );

      setMatches(suggested);
      setLoading(false);
    };

    fetchMatches();
  }, [navigate]);

  return (
    <>
      <Header showLogout={true} />
      <div className="container">
        <h2>Suggested Skill Matches</h2>
        {loading ? (
          <div className="spinner">Loading...</div>
        ) : matches.length === 0 ? (
          <p> No matches found.</p>
        ) : (
          <ul>
            {matches.map((m, i) => (
              <li key={i}>
                {m.email}: Offers <strong>{m.offered}</strong> | Wants <strong>{m.requested}</strong>
                <button onClick={() => navigate(`/chat?partner=${m.email}`)}>Chat</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
