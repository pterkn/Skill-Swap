import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Avatar,
  TextField,
  Button,
  Grid,
  Divider,
  Rating,
  Card,
  CardContent,
  Paper
} from '@mui/material';
import { auth, db } from '../firebase';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy
} from 'firebase/firestore';
import Header from '../components/Header';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Profile() {
  const [userData, setUserData] = useState({ name: '', bio: '' });
  const [editMode, setEditMode] = useState(false);
  const [reviews, setReviews] = useState([]);

  const userEmail = auth.currentUser?.email;

  useEffect(() => {
    const fetchProfile = async () => {
      const docRef = doc(db, 'users', userEmail);
      const snap = await getDoc(docRef);
      if (snap.exists()) setUserData(snap.data());
    };

    const fetchReviews = async () => {
      const q = query(
        collection(db, 'reviews'),
        where('reviewee', '==', userEmail),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => doc.data());
      setReviews(data);
    };

    fetchProfile();
    fetchReviews();
  }, [userEmail]);

  const handleUpdate = async () => {
    const docRef = doc(db, 'users', userEmail);
    await updateDoc(docRef, userData);
    setEditMode(false);
  };

  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingCounts = [1, 2, 3, 4, 5].map((star) => ({
    name: `${star}★`,
    count: reviews.filter((r) => r.rating === star).length
  }));

  const mostHelpfulReview = reviews.reduce((longest, current) =>
    current.comment.length > (longest?.comment.length || 0) ? current : longest,
    null
  );

  return (
    <>
      <Header showLogout={true} />
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, backgroundColor: '#FEFFEC' }}>
          <Box textAlign="center">
            <Avatar
              src={`https://ui-avatars.com/api/?name=${userEmail}&background=023020&color=fff`}
              sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
            />
            <Typography variant="h5" sx={{ fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>
              {userData.name || userEmail}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {userEmail}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {reviews.length} Reviews • Avg. Rating:
            </Typography>
            <Rating value={averageRating} precision={0.5} readOnly />
          </Box>

          <Divider sx={{ my: 3 }} />

          {editMode ? (
            <>
              <TextField
                fullWidth
                label="Name"
                value={userData.name}
                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Bio"
                value={userData.bio}
                onChange={(e) => setUserData({ ...userData, bio: e.target.value })}
                multiline
                rows={4}
                margin="normal"
              />
              <Button variant="contained" onClick={handleUpdate} fullWidth sx={{ mt: 2 }}>
                Save
              </Button>
            </>
          ) : (
            <>
              <Typography variant="h6" mt={2}>Name</Typography>
              <Typography>{userData.name || 'Not set'}</Typography>
              <Typography variant="h6" mt={2}>Bio</Typography>
              <Typography>{userData.bio || 'No bio provided.'}</Typography>
              <Button onClick={() => setEditMode(true)} fullWidth sx={{ mt: 2 }}>
                Edit Profile
              </Button>
            </>
          )}
        </Paper>

        {reviews.length > 0 && (
          <Box mt={6}>
            <Typography variant="h6" textAlign="center">Review Summary</Typography>

            <Box mt={3}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ratingCounts}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#023020" />
                </BarChart>
              </ResponsiveContainer>
            </Box>

            {mostHelpfulReview && (
              <Box mt={4}>
                <Typography variant="subtitle1">Most Helpful Review</Typography>
                <Card sx={{ backgroundColor: '#FEFFEC', mt: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle2">{mostHelpfulReview.reviewer}</Typography>
                    <Rating value={mostHelpfulReview.rating} readOnly size="small" />
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2">{mostHelpfulReview.comment}</Typography>
                  </CardContent>
                </Card>
              </Box>
            )}

            <Box mt={4}>
              <Typography variant="subtitle1">All Reviews</Typography>
              <Grid container spacing={2} mt={1}>
                {reviews.map((r, i) => (
                  <Grid item xs={12} key={i}>
                    <Card sx={{ backgroundColor: '#FEFFEC' }}>
                      <CardContent>
                        <Typography variant="subtitle2">{r.reviewer}</Typography>
                        <Rating value={r.rating} readOnly size="small" />
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="body2">{r.comment}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        )}
      </Container>
    </>
  );
}
