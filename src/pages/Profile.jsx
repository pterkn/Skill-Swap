import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Avatar, Button, Grid, Divider, Rating, Card,
  CardContent, Paper, Chip
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import {
  doc, getDoc, collection, query, where, getDocs, orderBy
} from 'firebase/firestore';
import Header from '../components/Header';
import { BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

export default function Profile() {
  const { email } = useParams();
  const navigate = useNavigate();

  const [userData, setUserData] = useState({});
  const [reviews, setReviews] = useState([]);
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', email);
        const snap = await getDoc(docRef);
        if (snap.exists()) setUserData(snap.data());
      } catch (err) {
        console.error('Error fetching profile:', err.message);
      }
    };

    const fetchReviews = async () => {
      const q = query(collection(db, 'reviews'), where('reviewee', '==', email), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setReviews(snap.docs.map(doc => doc.data()));
    };

    const fetchSkills = async () => {
      const q = query(collection(db, 'skills'), where('email', '==', email), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setSkills(snap.docs.map(doc => doc.data()));
    };

    if (email) {
      fetchProfile();
      fetchReviews();
      fetchSkills();
    }
  }, [email]);

  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingCounts = [1, 2, 3, 4, 5].map(star => ({
    name: `${star}★`,
    count: reviews.filter(r => r.rating === star).length
  }));

  const mostHelpfulReview = reviews.reduce((best, curr) =>
    curr.comment.length > (best?.comment.length || 0) ? curr : best,
    null
  );

  return (
    <>
      <Header showLogout />
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, backgroundColor: '#FEFFEC' }}>
          <Box textAlign="center">
            <Avatar
              src={`https://ui-avatars.com/api/?name=${email}&background=023020&color=fff`}
              sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
            />

            <Typography variant="h5" sx={{ fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>
              {userData.name || 'Unnamed User'}
            </Typography>
            <Typography variant="body2" color="text.secondary">{email}</Typography>

            <Box mt={1}>
              <Chip label={userData.skillLevel || 'Skill Level N/A'} color="primary" size="small" sx={{ mr: 1 }} />
              <Chip label={userData.availability || 'Availability N/A'} color="secondary" size="small" />
            </Box>

            {userData.bio && (
              <Typography variant="body2" mt={2} px={2}>
                {userData.bio}
              </Typography>
            )}

            <Typography variant="body2" mt={2}>
              {reviews.length} Reviews • Avg. Rating:
            </Typography>
            <Rating value={averageRating} precision={0.5} readOnly />

            {userData?.joinedAt?.toDate && (
              <Typography variant="caption" display="block" mt={1}>
                Member since {dayjs(userData.joinedAt.toDate()).format('MMM YYYY')}
              </Typography>
            )}

            {userData?.lastSeen?.toDate && (
              <Typography variant="caption" color="text.secondary">
                Last seen {dayjs(userData.lastSeen.toDate()).fromNow()}
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box display="flex" gap={2}>
            <Button variant="outlined" fullWidth onClick={() => navigate(`/chat?partner=${email}`)}>
              Chat
            </Button>
            <Button variant="contained" fullWidth onClick={() => navigate(`/review?user=${email}`)}>
              Rate
            </Button>
          </Box>
        </Paper>

        {skills.length > 0 && (
          <Box mt={6}>
            <Typography variant="h6" textAlign="center">Skills Offered</Typography>
            <Grid container spacing={2} mt={1}>
              {skills.slice(0, 3).map((s, i) => (
                <Grid item xs={12} key={i}>
                  <Card sx={{ backgroundColor: '#FFF6E9' }}>
                    <CardContent>
                      <Typography><strong>Offers:</strong> {s.offered}</Typography>
                      <Typography><strong>Wants:</strong> {s.requested}</Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Level: {s.skillLevel || 'N/A'} • Availability: {s.availability || 'N/A'}
                      </Typography>
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
