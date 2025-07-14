import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Avatar,
  Rating,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import { auth, db } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import Header from '../components/Header';

export default function Profile() {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [editing, setEditing] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [numReviews, setNumReviews] = useState(0);
  const [reviews, setReviews] = useState([]);

  const email = auth.currentUser?.email;

  useEffect(() => {
    if (!email) return;

    const fetchProfile = async () => {
      const snap = await getDoc(doc(db, 'profiles', email));
      if (snap.exists()) {
        const data = snap.data();
        setName(data.name || '');
        setBio(data.bio || '');
      }
    };

    const fetchReviews = async () => {
      const q = query(collection(db, 'reviews'), where('reviewee', '==', email));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => doc.data());
      setReviews(list);

      const avg = list.reduce((sum, r) => sum + r.rating, 0) / (list.length || 1);
      setAvgRating(avg);
      setNumReviews(list.length);
    };

    fetchProfile();
    fetchReviews();
  }, [email]);

  const handleSave = async () => {
    await setDoc(doc(db, 'profiles', email), { name, bio });
    setEditing(false);
  };

  return (
    <>
      <Header showLogout={true} />
      <Container maxWidth="sm">
        <Box textAlign="center" mt={4}>
          <Avatar
            src={`https://ui-avatars.com/api/?name=${email}`}
            sx={{ width: 80, height: 80, mx: 'auto' }}
          />
          <Typography variant="h5" mt={2}>{email}</Typography>

          <Box mt={1}>
            <Rating value={avgRating} readOnly precision={0.5} />
            <Typography variant="caption">{avgRating.toFixed(1)} / 5 from {numReviews} reviews</Typography>
          </Box>

          {editing ? (
            <Box mt={3}>
              <TextField
                label="Name"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Bio"
                fullWidth
                multiline
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button variant="contained" onClick={handleSave}>Save</Button>
            </Box>
          ) : (
            <Box mt={3}>
              <Typography><strong>Name:</strong> {name || '(Not set)'}</Typography>
              <Typography><strong>Bio:</strong> {bio || '(Not set)'}</Typography>
              <Button variant="outlined" onClick={() => setEditing(true)} sx={{ mt: 2 }}>Edit</Button>
            </Box>
          )}

          <Divider sx={{ my: 4 }} />

          <Typography variant="h6">Recent Reviews</Typography>
          {reviews.length === 0 ? (
            <Typography mt={2}>No reviews yet</Typography>
          ) : (
            reviews.map((r, i) => (
              <Card key={i} sx={{ mt: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="subtitle2">{r.reviewer}</Typography>
                    <Rating value={r.rating} readOnly size="small" />
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2">{r.comment}</Typography>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      </Container>
    </>
  );
}
