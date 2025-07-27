import React, { useState, useEffect, useRef } from 'react';
import {
  Container, Typography, Box, Rating, TextField, Button, Card, CardContent, Divider,
  Avatar, Fade, LinearProgress, MenuItem, Select, InputLabel, FormControl
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  collection, addDoc, getDocs, query, where, orderBy, doc, getDoc
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
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [sortOrder, setSortOrder] = useState('newest');
  const commentRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const targetEmail = searchParams.get('user');
  const userEmail = auth.currentUser?.email;

  useEffect(() => {
    const fetchAll = async () => {
      if (!userEmail || !targetEmail) return;

      const duplicateQuery = query(
        collection(db, 'reviews'),
        where('reviewer', '==', userEmail),
        where('reviewee', '==', targetEmail)
      );
      const duplicateSnap = await getDocs(duplicateQuery);
      setHasReviewed(!duplicateSnap.empty);

      const reviewQuery = query(
        collection(db, 'reviews'),
        where('reviewee', '==', targetEmail),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(reviewQuery);

      const enriched = await Promise.all(snap.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const userDoc = await getDoc(doc(db, 'users', data.reviewer));
        const userInfo = userDoc.exists() ? userDoc.data() : {};
        return { ...data, reviewerInfo: userInfo };
      }));

      setPastReviews(enriched);
      setLoadingReviews(false);
    };

    fetchAll();
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
    } catch {
      setToastMsg('❌ Failed to submit review.');
      setShowToast(true);
    }
  };

  const sortedReviews = [...pastReviews].sort((a, b) => {
    if (sortOrder === 'highest') return b.rating - a.rating;
    if (sortOrder === 'lowest') return a.rating - b.rating;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const ratingCounts = [1, 2, 3, 4, 5].map((star) => ({
    name: `${star} ★`,
    count: pastReviews.filter(r => r.rating === star).length
  }));

  const averageRating = pastReviews.length
    ? pastReviews.reduce((sum, r) => sum + r.rating, 0) / pastReviews.length
    : 0;

  const mostHelpfulReview = pastReviews.reduce((best, current) =>
    current.comment.length > (best?.comment.length || 0) ? current : best,
    null
  );

  if (!auth.currentUser) {
    navigate('/');
    return null;
  }

  return (
    <>
      <Header showLogout={true} />
      <Container maxWidth="sm">
        <Fade in timeout={600}>
          <Box mt={4} textAlign="center">
            <Typography variant="h4" sx={{ fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>
              Leave a Review
            </Typography>
            <Typography variant="subtitle1" mt={1}>
              for <strong>{targetEmail}</strong>
            </Typography>
          </Box>
        </Fade>

        {hasReviewed ? (
          <Card sx={{ mt: 4, backgroundColor: '#FEFFEC' }}>
            <CardContent>
              <Typography>You already submitted a review for this user.</Typography>
            </CardContent>
          </Card>
        ) : submitted ? (
          <Card sx={{ mt: 4, backgroundColor: '#FEFFEC' }}>
            <CardContent>
              <Typography>Thank you for your feedback! 🙏</Typography>
            </CardContent>
          </Card>
        ) : (
          <Box component="form" mt={4} onSubmit={handleSubmit}>
            <Rating value={rating} onChange={(e, v) => setRating(v)} size="large" />
            <TextField
              label="Feedback"
              multiline
              fullWidth
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              inputRef={commentRef}
              required
              helperText={`${comment.length}/300`}
              inputProps={{ maxLength: 300 }}
              sx={{ mt: 2 }}
            />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              Submit Review
            </Button>
          </Box>
        )}

        {loadingReviews ? (
          <LinearProgress sx={{ mt: 6 }} />
        ) : pastReviews.length ? (
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
                  <Bar dataKey="count" fill="#023020" />
                </BarChart>
              </ResponsiveContainer>
            </Box>

            <FormControl fullWidth sx={{ mt: 4 }}>
              <InputLabel>Sort Reviews</InputLabel>
              <Select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} label="Sort Reviews">
                <MenuItem value="newest">Newest</MenuItem>
                <MenuItem value="highest">Highest Rated</MenuItem>
                <MenuItem value="lowest">Lowest Rated</MenuItem>
              </Select>
            </FormControl>

            {mostHelpfulReview && (
              <Box mt={4}>
                <Typography variant="h6">Most Helpful Review</Typography>
                <Card sx={{ mt: 2, backgroundColor: '#FEFFEC' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar src={`https://ui-avatars.com/api/?name=${mostHelpfulReview.reviewer}`} />
                      <Box>
                        <Typography variant="subtitle2">
                          {mostHelpfulReview.reviewerInfo?.name || mostHelpfulReview.reviewer}
                        </Typography>
                        <Rating value={mostHelpfulReview.rating} readOnly size="small" />
                        <Typography variant="caption">
                          {new Date(mostHelpfulReview.createdAt?.toDate?.() || mostHelpfulReview.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2">{mostHelpfulReview.comment}</Typography>
                  </CardContent>
                </Card>
              </Box>
            )}

            <Box mt={6}>
              <Typography variant="h6" ref={commentRef}>All Reviews</Typography>
              {sortedReviews.map((r, i) => (
                <Card key={i} sx={{ mt: 2, backgroundColor: '#FEFFEC' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar src={`https://ui-avatars.com/api/?name=${r.reviewer}`} />
                      <Box>
                        <Typography variant="subtitle2">
                          {r.reviewerInfo?.name || r.reviewer}
                        </Typography>
                        <Rating value={r.rating} readOnly size="small" />
                        <Typography variant="caption">
                          {new Date(r.createdAt?.toDate?.() || r.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2">{r.comment}</Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </>
        ) : (
          <Box mt={6} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              📝 No reviews yet for this user.
            </Typography>
          </Box>
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
