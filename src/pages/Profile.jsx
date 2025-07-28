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
  Paper,
  Chip
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
import { BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useParams, useNavigate } from 'react-router-dom';

dayjs.extend(relativeTime);

export default function Profile() {
  const { email: userParam } = useParams();
  const currentEmail = auth.currentUser?.email;
  const navigate = useNavigate();

  const isOwnProfile = !userParam || userParam === currentEmail;
  const userEmail = isOwnProfile ? currentEmail : userParam;

  const [userData, setUserData] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    if (!userEmail) return navigate('/');

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
      setSkills(skillSnap.docs.map(doc => doc.data()));
    };

    fetchAll();
  }, [userEmail, navigate]);

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
      <Header showLogout />
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, backgroundColor: '#FEFFEC' }}>
          <Box textAlign="center">
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                src={`https://ui-avatars.com/api/?name=${userEmail}&background=023020&color=fff`}
                sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 10,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  backgroundColor: userData.online ? 'green' : 'gray',
                  border: '2px solid white'
                }}
              />
            </Box>

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

            {userData?.joinedAt?.toDate && (
              <Typography variant="caption" display="block" mt={1}>
                Member since {dayjs(userData.joinedAt.toDate()).format('MMM YYYY')}
              </Typography>
            )}

            {!userData.online && userData?.lastSeen?.toDate && (
              <Typography variant="caption" color="text.secondary">
                Last seen {dayjs(userData.lastSeen.toDate()).fromNow()}
              </Typography>
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
            <Typography variant="h6" textAlign="center">Review Summary</Typography>
            <Box mt={3}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ratingCounts}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <ReTooltip />
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
