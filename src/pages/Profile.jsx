import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Divider,
  Rating
} from '@mui/material';
import { auth, db } from '../firebase';
import Header from '../components/Header';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function Profile() {
  const user = auth.currentUser;
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    const fetchRatings = async () => {
      if (!user) return;

      const q = query(collection(db, 'reviews'), where('reviewee', '==', user.email));
      const snap = await getDocs(q);
      const reviews = snap.docs.map(doc => doc.data());

      const count = reviews.length;
      const avg = count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;

      setAvgRating(avg);
      setReviewCount(count);
    };

    fetchRatings();
  }, [user]);

  return (
    <>
      <Header showLogout={true} />
      <Container maxWidth="sm">
        <Box mt={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" flexDirection="column">
                <Avatar
                  src={`https://ui-avatars.com/api/?name=${user?.email}`}
                  alt="User Avatar"
                  sx={{ width: 80, height: 80, mb: 2 }}
                />
                <Typography variant="h6">{user?.email}</Typography>
                <Divider sx={{ my: 2, width: '100%' }} />
                <Typography variant="subtitle1">Average Rating</Typography>
                <Rating value={avgRating} precision={0.5} readOnly sx={{ mt: 1 }} />
                <Typography variant="caption">{avgRating.toFixed(1)} / 5 ({reviewCount} review{reviewCount !== 1 ? 's' : ''})</Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </>
  );
}
