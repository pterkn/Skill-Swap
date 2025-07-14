
import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  TextField,
  Button,
  Rating,
  Divider
} from '@mui/material';
import { auth, db } from '../firebase';
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc
} from 'firebase/firestore';
import Header from '../components/Header';

export default function Profile() {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchProfile = async () => {
      const docRef = doc(db, 'profiles', user.email);
      const snap = await getDocs(query(collection(db, 'profiles'), where('__name__', '==', user.email)));
      const profile = snap.docs[0]?.data();
      if (profile) {
        setName(profile.name || '');
        setBio(profile.bio || '');
      }
    };

    const fetchRating = async () => {
      const q = query(collection(db, 'reviews'), where('reviewee', '==', user.email));
      const snap = await getDocs(q);
      const reviews = snap.docs.map((doc) => doc.data());
      const total = reviews.reduce((sum, r) => sum + r.rating, 0);
      setReviewCount(reviews.length);
      setAvgRating(reviews.length ? total / reviews.length : 0);
    };

    fetchProfile();
    fetchRating();
  }, [user.email]);

  const handleSave = async () => {
    const docRef = doc(db, 'profiles', user.email);
    await updateDoc(docRef, { name, bio });
    setEditing(false);
  };

  return (
    <>
      <Header showLogout={true} />
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Card sx={{ backgroundColor: '#FEFFEC', p: 2 }}>
          <CardContent>
            <Box display="flex" flexDirection="column" alignItems="center">
              <Avatar
                src={`https://ui-avatars.com/api/?name=${user.email}`}
                sx={{ width: 80, height: 80, mb: 2 }}
              />
              <Typography variant="h6" fontFamily="Georgia, serif">
                {user.email}
              </Typography>

              <Box mt={2}>
                <Rating value={avgRating} readOnly precision={0.5} />
                <Typography variant="caption">
                  {avgRating.toFixed(1)} / 5 from {reviewCount} reviews
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {editing ? (
              <>
                <TextField
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Bio"
                  multiline
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <Button variant="contained" onClick={handleSave} fullWidth>
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Typography variant="subtitle1" fontWeight="bold">
                  {name || 'No name set'}
                </Typography>
                <Typography variant="body2" mb={2}>
                  {bio || 'No bio provided.'}
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => setEditing(true)}
                >
                  Edit Profile
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
