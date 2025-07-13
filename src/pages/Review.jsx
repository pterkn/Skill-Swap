
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import Header from '../components/Header';
import Toast from '../components/Toast';
import '../style.css';

export default function Review() {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const reviewedUser = params.get('user');

  useEffect(() => {
    if (!auth.currentUser) navigate('/');
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const reviewer = auth.currentUser?.email;
    if (!reviewer || !reviewedUser || rating < 1) return;

    // Prevent duplicate reviews
    const q = query(
      collection(db, 'reviews'),
      where('reviewer', '==', reviewer),
      where('reviewed', '==', reviewedUser)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      setToastMsg(' You have already reviewed this user.');
      setShowToast(true);
      return;
    }

    try {
      await addDoc(collection(db, 'reviews'), {
        reviewer,
        reviewed: reviewedUser,
        rating,
        text,
        createdAt: new Date()
      });
      setToastMsg(' Review submitted!');
      setShowToast(true);
      setRating(0);
      setText('');
    } catch (err) {
      setToastMsg(' Failed to submit review');
      setShowToast(true);
    }
  };

  return (
    <>
      <Header showLogout={true} />
      <div className="container">
        <h2>Review {reviewedUser}</h2>

        <form onSubmit={handleSubmit}>
          {/* Star Ratings */}
          <div className="stars">
            {[1, 2, 3, 4, 5].map(num => (
              <span
                key={num}
                className={rating >= num ? 'star filled' : 'star'}
                onClick={() => setRating(num)}
              >
                ★
              </span>
            ))}
          </div>

          <textarea
            placeholder="Write your feedback (optional)..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          ></textarea>

          <button type="submit">Submit Review</button>
        </form>
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
