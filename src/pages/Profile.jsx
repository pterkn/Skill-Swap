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
  CardContent
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

  return (
    <>
      <Header showLogout={true} />
      <Container maxWidth="sm">
        <Box mt={6} textAlign="center">
          <Avatar
            src={`https://ui-avatars.com/api/?name=${userEmail}&background=023020&color=fff`}
            sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
          />
          <Typography variant="h5" sx={{ fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>
            {userEmail}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {reviews.length} Reviews • Avg. Rating:
          </Typography>
          <Rating value={averageRating} precision={0.5} readOnly />
        </Box>

        <Box mt={4}>
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
              <Button variant="contained" onClick={handleUpdate} fullWidth sx={{ mt: 1 }}>
                Save
              </Button>
            </>
          ) : (
            <>
              <Typography variant="h6" mt={3}>Name</Typography>
              <Typography>{userData.name || 'Not set'}</Typography>
              <Typography variant="h6" mt={2}>Bio</Typography>
              <Typography>{userData.bio || 'No bio provided.'}</Typography>
              <Button onClick={() => setEditMode(true)} fullWidth sx={{ mt: 2 }}>
                Edit Profile
              </Button>
            </>
          )}
        </Box>

        <Box mt={6}>
          <Typography variant="h6">Recent Reviews</Typography>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            {reviews.map((r, i) => (
              <Grid item xs={12} key={i}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2">{r.reviewer}</Typography>
                    <Rating value={r.rating} readOnly size="small" />
                    <Typography variant="body2" mt={1}>{r.comment}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </>
  );
}
