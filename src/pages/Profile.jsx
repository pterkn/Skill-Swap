import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Avatar, TextField, Button, Grid, Divider,
  Rating, Card, CardContent, Paper, Chip, CircularProgress
} from '@mui/material';
import { auth, db } from '../firebase';
import {
  doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy
} from 'firebase/firestore';
import Header from '../components/Header';
import { useParams, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

export default function Profile() {
  const { email: userParam } = useParams();
  const navigate = useNavigate();

  const [authReady, setAuthReady] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');
  const [userData, setUserData] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setCurrentEmail(user.email);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const isOwnProfile = !userParam || userParam === currentEmail;
  const userEmail = isOwnProfile ? currentEmail : userParam;

  useEffect(() => {
    if (!authReady || !userEmail) return;

    const fetchAll = async () => {
      const docRef = doc(db, 'users', userEmail);
      const snap = await getDoc(docRef);
      if (snap.exists()) setUserData(snap.data());

      const reviewsSnap = await getDocs(query(
        collection(db, 'reviews'),
        where('reviewee', '==', userEmail),
        orderBy('createdAt', 'desc')
      ));
      setReviews(reviewsSnap.docs.map(doc => doc.data()));

      const skillSnap = await getDocs(query(
        collection(db, 'skills'),
        where('email', '==', userEmail),
        orderBy('createdAt', 'desc')
      ));
      const fetchedSkills = skillSnap.docs.map(doc => doc.data());
      setSkills(fetchedSkills);
    };

    fetchAll();
  }, [authReady, userEmail]);

  const handleUpdate = async () => {
    const docRef = doc(db, 'users', userEmail);
    await updateDoc(docRef, userData);
    setEditMode(false);
  };

  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const mostHelpfulReview = reviews.reduce((longest, current) =>
    current.comment.length > (longest?.comment.length || 0) ? current : longest,
    null
  );

  if (!authReady) {
    return (
      <Box mt={8} textAlign="center">
        <CircularProgress />
        <Typography variant="body2" mt={2}>Loading user...</Typography>
      </Box>
    );
  }

  return (
    <>
      <Header showLogout />
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

            <Box mt={1}>
              <Chip label={userData.skillLevel || 'Skill Level N/A'} color="primary" size="small" sx={{ mr: 1 }} />
              <Chip label={userData.availability || 'Availability N/A'} color="secondary" size="small" />
            </Box>

            <Typography variant="body2" sx={{ mt: 1 }}>
              {reviews.length} Reviews • Avg. Rating:
            </Typography>
            <Rating value={averageRating} precision={0.5} readOnly />

            {isOwnProfile ? (
              <Button onClick={() => setEditMode(true)} fullWidth sx={{ mt: 2 }}>
                Edit Profile
              </Button>
            ) : (
              <Box display="flex" gap={2} mt={2}>
                <Button fullWidth variant="outlined" onClick={() => navigate(`/chat?partner=${userEmail}`)}>Chat</Button>
                <Button fullWidth variant="contained" onClick={() => navigate(`/review?user=${userEmail}`)}>Rate</Button>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {editMode ? (
            <>
              <TextField
                fullWidth
                label="Name"
                value={userData.name || ''}
                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Bio"
                value={userData.bio || ''}
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
            </>
          )}
        </Paper>

        {skills.length > 0 && (
          <Box mt={6}>
            <Typography variant="h6" textAlign="center">Skills</Typography>
            <Grid container spacing={2} mt={1}>
              {skills.map((s, i) => (
                <Grid item xs={12} key={i}>
                  <Card sx={{ backgroundColor: '#FFF6E9' }}>
                    <CardContent>
                      <Typography><strong>Offers:</strong> {s.offered || 'N/A'}</Typography>
                      <Typography><strong>Wants:</strong> {s.requested || 'N/A'}</Typography>
                      <Box mt={1} display="flex" gap={1}>
                        <Chip label={s.availability || 'Anytime'} size="small" color="primary" />
                        <Chip label={s.skillLevel || 'Intermediate'} size="small" variant="outlined" />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {reviews.length > 0 && (
          <Box mt={6}>
            <Typography variant="h6" textAlign="center">Reviews</Typography>

            {mostHelpfulReview && (
              <Box mt={2}>
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
