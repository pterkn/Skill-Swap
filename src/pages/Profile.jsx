import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, Avatar, TextField, Button, Grid, Divider,
  Rating, Card, CardContent, Paper, Chip, CircularProgress, Alert, Snackbar
} from '@mui/material';
import { auth, db } from '../firebase';
import {
  doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, onSnapshot
} from 'firebase/firestore';
import Header from '../components/Header';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

export default function Profile() {
  const { email: userParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [authReady, setAuthReady] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');
  const [userData, setUserData] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Check for refresh trigger from URL params or location state
  const shouldRefresh = location.state?.refreshProfile || location.search.includes('refresh=true');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setCurrentEmail(user.email);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const isOwnProfile = !userParam || userParam === currentEmail;
  const userEmail = isOwnProfile ? currentEmail : userParam;

  // Fallback manual fetch function for when real-time listener fails
  const fetchReviewsManually = useCallback(async () => {
    if (!userEmail) return;
    
    try {
      console.log('Manually fetching reviews for:', userEmail);
      
      // Try with orderBy first
      try {
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('reviewee', '==', userEmail),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(reviewsQuery);
        const reviewsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Manual fetch with orderBy successful:', reviewsData.length);
        setReviews(reviewsData);
        return;
      } catch (orderByError) {
        console.log('OrderBy failed, trying without orderBy:', orderByError);
      }

      // Fallback without orderBy
      const simpleQuery = query(
        collection(db, 'reviews'),
        where('reviewee', '==', userEmail)
      );
      const querySnapshot = await getDocs(simpleQuery);
      const reviewsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort manually
      reviewsData.sort((a, b) => {
        const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return bTime - aTime;
      });

      console.log('Manual fetch without orderBy successful:', reviewsData.length);
      setReviews(reviewsData);
      
    } catch (error) {
      console.error('Manual reviews fetch failed:', error);
      // Only set empty if we have no reviews, otherwise keep existing
      if (reviews.length === 0) {
        setReviews([]);
      }
    }
  }, [userEmail, reviews.length]);

  // Fetch user data and skills (one-time fetch)
  const fetchStaticData = useCallback(async () => {
    if (!userEmail) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Fetch user data
      const docRef = doc(db, 'users', userEmail);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setUserData(snap.data());
      } else {
        // Create a basic user profile if it doesn't exist
        const basicUserData = {
          name: userEmail.split('@')[0],
          email: userEmail,
          createdAt: new Date(),
        };
        setUserData(basicUserData);
        console.log('User profile not found, using basic data');
      }

      // Fetch skills (don't fail if this fails)
      try {
        const skillSnap = await getDocs(query(
          collection(db, 'skills'),
          where('email', '==', userEmail),
          orderBy('createdAt', 'desc')
        ));
        const fetchedSkills = skillSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSkills(fetchedSkills);
      } catch (skillError) {
        console.warn('Failed to fetch skills:', skillError);
        setSkills([]);
      }

      // Show success message if this was a refresh after adding a review
      if (shouldRefresh) {
        setSuccessMessage('Profile updated with new review!');
        // Clean up the URL
        window.history.replaceState({}, '', location.pathname);
      }
    } catch (err) {
      console.error('Critical error fetching profile data:', err);
      setError(`Failed to load profile for ${userEmail}. Please try refreshing the page.`);
    } finally {
      setLoading(false);
    }
  }, [userEmail, shouldRefresh, location.pathname]);

  // Set up real-time listener for reviews
  useEffect(() => {
    if (!userEmail) return;

    console.log('Setting up reviews listener for:', userEmail);
    
    // Create real-time listener for reviews with error handling
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('reviewee', '==', userEmail),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      reviewsQuery,
      (snapshot) => {
        console.log('Reviews snapshot received for', userEmail, '- count:', snapshot.docs.length);
        const reviewsData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        console.log('Setting reviews data:', reviewsData);
        setReviews(reviewsData);
        
        // Show success message only for actual new reviews (not initial load)
        if (reviews.length > 0 && reviewsData.length > reviews.length) {
          setSuccessMessage('New review received!');
        }
      },
      (error) => {
        console.error('Reviews listener error:', error);
        
        // Fallback to one-time fetch if real-time listener fails
        if (error.code === 'failed-precondition') {
          console.log('Firestore index missing, falling back to manual fetch');
          fetchReviewsManually();
        } else {
          console.warn('Real-time listener failed, trying manual fetch');
          fetchReviewsManually();
        }
      }
    );

    // Cleanup subscription on unmount or when userEmail changes
    return () => {
      console.log('Cleaning up reviews listener for:', userEmail);
      unsubscribe();
    };
  }, [userEmail]); // Keep dependency minimal

  // Initial data fetch - only for static data, not reviews
  useEffect(() => {
    if (!authReady || !userEmail) {
      console.log('Profile effect skipped - authReady:', authReady, 'userEmail:', userEmail);
      return;
    }
    
    console.log('Profile effect running - userEmail:', userEmail);
    fetchStaticData();
  }, [authReady, userEmail, fetchStaticData]);

  // Manual refresh function for the refresh button
  const handleRefresh = useCallback(async () => {
    console.log('Manual refresh triggered');
    setLoading(true);
    try {
      await fetchStaticData();
      await fetchReviewsManually(); // Also refresh reviews manually
      setSuccessMessage('Profile refreshed successfully!');
    } catch (error) {
      console.error('Manual refresh failed:', error);
      setError('Failed to refresh profile');
    } finally {
      setLoading(false);
    }
  }, [fetchStaticData, fetchReviewsManually]);

  // Listen for navigation state changes (when coming back from review page)
  useEffect(() => {
    if (location.state?.reviewSubmitted || location.state?.refreshProfile) {
      console.log('Navigation state detected:', location.state);
      setSuccessMessage(
        location.state.reviewSubmitted 
          ? 'Review submitted successfully!' 
          : 'Profile updated with new review!'
      );
      // Clear the state to prevent showing message again
      window.history.replaceState({}, '', location.pathname);
      
      // Force a manual review fetch to ensure we have the latest data
      setTimeout(() => {
        fetchReviewsManually();
      }, 500);
    }
  }, [location.state, location.pathname, fetchReviewsManually]);

  const handleUpdate = async () => {
    if (!userData.name?.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const docRef = doc(db, 'users', userEmail);
      await updateDoc(docRef, {
        ...userData,
        updatedAt: new Date()
      });
      setEditMode(false);
      setSuccessMessage('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshClick = () => {
    handleRefresh();
  };

  // Calculate ratings with better error handling
  const averageRating = reviews.length
    ? Math.round((reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length) * 10) / 10
    : 0;

  // Find most helpful review (longest comment with rating >= 4)
  const mostHelpfulReview = reviews
    .filter(r => r.rating >= 4 && r.comment?.length > 50)
    .reduce((best, current) => 
      current.comment.length > (best?.comment.length || 0) ? current : best, null
    ) || reviews.find(r => r.comment?.length > 0);

  if (!authReady) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="50vh">
        <CircularProgress />
        <Typography variant="body2" mt={2}>Loading user...</Typography>
      </Box>
    );
  }

  if (!userEmail) {
    return (
      <Container maxWidth="sm" sx={{ py: 4, textAlign: 'center' }}>
        <Alert severity="error">No user email found</Alert>
      </Container>
    );
  }

  return (
    <>
      <Header showLogout />
      <Container maxWidth="sm" sx={{ py: 4 }}>
        {/* Only show error if it's a critical error and no user data loaded */}
        {error && !userData.name && !userData.email && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Show warning if error but data still loaded */}
        {error && (userData.name || userData.email) && (
          <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError('')}>
            Some data may be incomplete. {error}
          </Alert>
        )}

        <Paper elevation={3} sx={{ p: 3, backgroundColor: '#FEFFEC', position: 'relative' }}>
          {loading && (
            <Box position="absolute" top={16} right={16}>
              <CircularProgress size={20} />
            </Box>
          )}

          <Box textAlign="center">
            <Avatar
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || userEmail)}&background=023020&color=fff&size=128`}
              sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
            />
            <Typography variant="h5" sx={{ fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>
              {userData.name || userEmail.split('@')[0]}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {userEmail}
            </Typography>

            <Box mt={1}>
              <Chip 
                label={userData.skillLevel || 'Skill Level N/A'} 
                color="primary" 
                size="small" 
                sx={{ mr: 1 }} 
              />
              <Chip 
                label={userData.availability || 'Availability N/A'} 
                color="secondary" 
                size="small" 
              />
            </Box>

            <Box mt={2} display="flex" alignItems="center" justifyContent="center" gap={1}>
              <Typography variant="body2">
                {reviews.length} Review{reviews.length !== 1 ? 's' : ''}
              </Typography>
              {reviews.length > 0 && (
                <>
                  <Typography variant="body2">•</Typography>
                  <Rating value={averageRating} precision={0.1} readOnly size="small" />
                  <Typography variant="body2" color="text.secondary">
                    ({averageRating.toFixed(1)})
                  </Typography>
                </>
              )}
            </Box>

            {isOwnProfile ? (
              <Box mt={2}>
                <Button 
                  onClick={() => setEditMode(true)} 
                  variant="contained"
                  fullWidth 
                  sx={{ mb: 1 }}
                  disabled={loading}
                >
                  Edit Profile
                </Button>
                <Button 
                  onClick={handleRefreshClick} 
                  variant="outlined"
                  fullWidth
                  size="small"
                  disabled={loading}
                >
                  Refresh Profile
                </Button>
              </Box>
            ) : (
              <Box display="flex" gap={2} mt={2}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  onClick={() => navigate(`/chat?partner=${userEmail}`)}
                >
                  Chat
                </Button>
                <Button 
                  fullWidth 
                  variant="contained" 
                  onClick={() => navigate(`/review/${encodeURIComponent(userEmail)}`)}
                >
                  Rate & Review
                </Button>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {editMode ? (
            <Box component="form" onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
              <TextField
                fullWidth
                label="Name"
                value={userData.name || ''}
                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                margin="normal"
                required
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Bio"
                value={userData.bio || ''}
                onChange={(e) => setUserData({ ...userData, bio: e.target.value })}
                multiline
                rows={4}
                margin="normal"
                placeholder="Tell others about yourself, your skills, and what you're looking for..."
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Skill Level"
                value={userData.skillLevel || ''}
                onChange={(e) => setUserData({ ...userData, skillLevel: e.target.value })}
                margin="normal"
                placeholder="e.g., Beginner, Intermediate, Advanced"
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Availability"
                value={userData.availability || ''}
                onChange={(e) => setUserData({ ...userData, availability: e.target.value })}
                margin="normal"
                placeholder="e.g., Weekends, Evenings, Flexible"
                disabled={loading}
              />
              <Box mt={2} display="flex" gap={2}>
                <Button 
                  variant="contained" 
                  onClick={handleUpdate} 
                  fullWidth
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => setEditMode(false)} 
                  fullWidth
                  disabled={loading}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>About</Typography>
              <Typography variant="body1" paragraph>
                <strong>Name:</strong> {userData.name || 'Not set'}
              </Typography>
              <Typography variant="body1" paragraph>
                <strong>Bio:</strong> {userData.bio || 'No bio provided.'}
              </Typography>
              <Typography variant="body1" paragraph>
                <strong>Skill Level:</strong> {userData.skillLevel || 'Not specified'}
              </Typography>
              <Typography variant="body1">
                <strong>Availability:</strong> {userData.availability || 'Not specified'}
              </Typography>
            </>
          )}
        </Paper>

        {/* Skills Section */}
        {skills.length > 0 && (
          <Paper elevation={2} sx={{ mt: 3, p: 3, backgroundColor: '#FFF6E9' }}>
            <Typography variant="h6" gutterBottom textAlign="center">Skills Exchange</Typography>
            <Grid container spacing={2}>
              {skills.map((skill, index) => (
                <Grid item xs={12} key={skill.id || index}>
                  <Card sx={{ backgroundColor: '#FFFFFF', borderLeft: '4px solid #1976d2' }}>
                    <CardContent>
                      <Typography variant="body1" gutterBottom>
                        <strong>Can teach:</strong> {skill.offered || 'N/A'}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        <strong>Wants to learn:</strong> {skill.requested || 'N/A'}
                      </Typography>
                      <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                        <Chip 
                          label={skill.availability || 'Anytime'} 
                          size="small" 
                          color="primary" 
                        />
                        <Chip 
                          label={skill.skillLevel || 'Intermediate'} 
                          size="small" 
                          variant="outlined" 
                        />
                        {skill.createdAt && (
                          <Chip 
                            label={`Added ${new Date(skill.createdAt.toDate()).toLocaleDateString()}`}
                            size="small" 
                            variant="outlined"
                            color="default"
                          />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <Paper elevation={2} sx={{ mt: 3, p: 3, backgroundColor: '#FEFFEC' }}>
            <Typography variant="h6" gutterBottom textAlign="center">
              Reviews ({reviews.length})
            </Typography>

            {/* Most Helpful Review */}
            {mostHelpfulReview && (
              <Box mb={3}>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                   Most Helpful Review
                </Typography>
                <Card sx={{ backgroundColor: '#E3F2FD', border: '1px solid #1976d2' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {mostHelpfulReview.reviewer}
                      </Typography>
                      <Rating value={mostHelpfulReview.rating} readOnly size="small" />
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2">{mostHelpfulReview.comment}</Typography>
                    {mostHelpfulReview.createdAt && (
                      <Typography variant="caption" color="text.secondary" mt={1} display="block">
                        {new Date(mostHelpfulReview.createdAt.toDate()).toLocaleDateString()}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Box>
            )}

            {/* All Reviews */}
            <Typography variant="subtitle1" gutterBottom>All Reviews</Typography>
            <Grid container spacing={2}>
              {reviews.map((review, index) => (
                <Grid item xs={12} key={review.id || index}>
                  <Card sx={{ backgroundColor: '#FFFFFF' }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {review.reviewer}
                        </Typography>
                        <Rating value={review.rating} readOnly size="small" />
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2">{review.comment}</Typography>
                      {review.createdAt && (
                        <Typography variant="caption" color="text.secondary" mt={1} display="block">
                          {new Date(review.createdAt.toDate()).toLocaleDateString()}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        {/* Empty State for Reviews */}
        {reviews.length === 0 && !loading && (
          <Paper elevation={1} sx={{ mt: 3, p: 3, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Reviews Yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isOwnProfile 
                ? "Start skill exchanges to receive your first review!"
                : "Be the first to review this user's skills!"
              }
            </Typography>
          </Paper>
        )}
      </Container>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
}