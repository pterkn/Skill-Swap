
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Rating,
  TextField,
  Button,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import Header from '../components/Header';
import Toast from '../components/Toast';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

export default function Review() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [pastReviews, setPastReviews] = useState([]);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const targetEmail = searchParams.get('user');
  const userEmail = auth.currentUser?.email;

  useEffect(() => {
    const checkDuplicate = async () => {
      if (!userEmail || !targetEmail) return;

      const q = query(
        collection(db, 'reviews'),
        where('reviewer', '==', userEmail),
        where('reviewee', '==', targetEmail)
      );
      const snap = await getDocs(q);
      if (!snap.empty) setHasReviewed(true);
    };

    const fetchPastReviews = async () => {
      const q = query(
        collection(db, 'reviews'),
        where('reviewee', '==', targetEmail),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const reviews = snap.docs.map(doc => doc.data());
      setPastReviews(reviews);
    };

    checkDuplicate();
    fetchPastReviews();
  }, [userEmail, targetEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || !comment.trim()) {
      setToastMsg('Please provide both rating and feedback.');
      setShowToast(true);
      return;
    }

    try {
      await addDoc(collection(db, 'reviews'), {
        reviewer: userEmail,
        reviewee: targetEmail,
        rating,
        comment,
        createdAt: new Date()
      });
      setSubmitted(true);
      setToastMsg('✅ Review submitted!');
      setShowToast(true);
    } catch (err) {
      setToastMsg('❌ Failed to submit review.');
      setShowToast(true);
    }
  };

  const ratingCounts = [1, 2, 3, 4, 5].map((star) => ({
    name: `${star} ★`,
    count: pastReviews.filter((r) => r.rating === star).length
  }));

  const averageRating = pastReviews.length
    ? pastReviews.reduce((sum, r) => sum + r.rating, 0) / pastReviews.length
    : 0;

  const mostHelpfulReview = pastReviews.reduce((longest, current) => {
    return current.comment.length > (longest?.comment.length || 0) ? current : longest;
  }, null);

  return (
    <>
      <Header showLogout={true} />
      <Container maxWidth="sm">
        <Box mt={4} textAlign="center">
          <Typography variant="h4">Leave a Review</Typography>
          <Typography variant="subtitle1" mt={1}>
            for <strong>{targetEmail}</strong>
          </Typography>
        </Box>

        {hasReviewed ? (
          <Card sx={{ mt: 4 }}>
            <CardContent>
              <Typography>You already submitted a review for this user.</Typography>
            </CardContent>
          </Card>
        ) : submitted ? (
          <Card sx={{ mt: 4 }}>
            <CardContent>
              <Typography>Thank you for your feedback! 🙏</Typography>
            </CardContent>
          </Card>
        ) : (
          <Box component="form" mt={4} onSubmit={handleSubmit}>
            <Box mb={2}>
              <Rating
                value={rating}
                onChange={(e, newVal) => setRating(newVal)}
                size="large"
              />
            </Box>

            <TextField
              label="Feedback"
              multiline
              fullWidth
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />

            <Button variant="contained" type="submit" fullWidth sx={{ mt: 2 }}>
              Submit Review
            </Button>
          </Box>
        )}

        {pastReviews.length > 0 && (
          <>
            <Box mt={6} textAlign="center">
              <Typography variant="h6">Average Rating</Typography>
              <Rating value={averageRating} precision={0.5} readOnly />
              <Typography variant="caption">{averageRating.toFixed(1)} / 5</Typography>
            </Box>

            <Box mt={4}>
              <Typography variant="h6" mb={2}>Ratings Breakdown</Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ratingCounts}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </Box>

            {mostHelpfulReview && (
              <Box mt={4}>
                <Typography variant="h6">Most Helpful Review</Typography>
                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2">{mostHelpfulReview.reviewer}</Typography>
                    <Rating value={mostHelpfulReview.rating} readOnly size="small" />
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2">{mostHelpfulReview.comment}</Typography>
                  </CardContent>
                </Card>
              </Box>
            )}

            <Box mt={6}>
              <Typography variant="h6">All Reviews</Typography>
              {pastReviews.map((r, i) => (
                <Card key={i} sx={{ mt: 2 }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="subtitle2">{r.reviewer}</Typography>
                      <Rating value={r.rating} readOnly size="small" />
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2">{r.comment}</Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </>
        )}
      </Container>

      <Toast
        message={toastMsg}
        visible={showToast}
        onHide={() => setShowToast(false)}
        type={submitted ? 'success' : 'error'}
      />
    </>
  );
}
