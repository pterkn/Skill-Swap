import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Rating,
  TextField,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Snackbar,
  Alert,
  Avatar,
  Container,
  Chip,
  IconButton,
  Card,
  CardContent,
} from "@mui/material";
import { ArrowBack, Star, StarBorder } from "@mui/icons-material";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  orderBy,
  serverTimestamp,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Header from "../components/Header";

const Review = () => {
  const { userId } = useParams(); // This could be email or userId
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userParam = searchParams.get('user'); // Get user from query params
  
  // Handle URL decoding for email addresses and use userParam if available, otherwise use userId from params
  const targetUser = userParam || (userId ? decodeURIComponent(userId) : null);

  // Debug logging to help troubleshoot routing issues
  console.log('Review component loaded');
  console.log('userId from params:', userId);
  console.log('userParam from search:', userParam);
  console.log('targetUser:', targetUser);

  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [reviewedUser, setReviewedUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const fetchUserProfile = async () => {
    if (!targetUser) return;
    
    try {
      console.log('Fetching user profile for:', targetUser);
      // Try to fetch user data using email (consistent with Profile.jsx)
      const userRef = doc(db, "users", targetUser);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setReviewedUser({
          email: targetUser,
          name: userData.name || targetUser.split('@')[0],
          ...userData
        });
        console.log('User profile loaded successfully');
      } else {
        console.log('User profile not found, creating basic profile');
        // Create basic user data if profile doesn't exist
        setReviewedUser({
          email: targetUser,
          name: targetUser.split('@')[0],
          displayName: targetUser.split('@')[0],
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Still create basic user data so review page can function
      setReviewedUser({
        email: targetUser,
        name: targetUser.split('@')[0],
        displayName: targetUser.split('@')[0],
      });
      // Don't show error alert for user profile fetch failures
    }
  };

  const fetchReviews = async () => {
    if (!targetUser) return;
    
    setLoading(true);
    try {
      console.log('Fetching reviews for user:', targetUser);
      
      const reviewsRef = collection(db, "reviews");
      const q = query(
        reviewsRef,
        where("reviewee", "==", targetUser), // Match Profile.jsx field name
        orderBy("createdAt", "desc") // Match Profile.jsx field name
      );
      
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log('Fetched reviews:', fetched.length);
      setReviews(fetched);

      // Check if current user already reviewed
      if (currentUser) {
        const existing = fetched.find(
          (rev) => rev.reviewer === currentUser.email
        );
        if (existing) {
          setMyReview(existing);
          setRating(existing.rating || 0);
          setComment(existing.comment || "");
          console.log('Found existing review from current user');
        }
      }
    } catch (err) {
      console.error("Detailed error fetching reviews:", err);
      
      // Handle specific Firestore errors
      if (err.code === 'failed-precondition') {
        console.log('Firestore index required - trying simple query without orderBy');
        // Fallback: try without orderBy if index is missing
        try {
          const reviewsRef = collection(db, "reviews");
          const simpleQuery = query(reviewsRef, where("reviewee", "==", targetUser));
          const querySnapshot = await getDocs(simpleQuery);
          const fetched = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          
          // Sort manually if no index
          fetched.sort((a, b) => {
            const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return bTime - aTime;
          });
          
          setReviews(fetched);
          console.log('Fallback query successful, fetched:', fetched.length);
        } catch (fallbackErr) {
          console.error("Fallback query also failed:", fallbackErr);
          setReviews([]); // Set empty array instead of showing error
        }
      } else if (err.code === 'permission-denied') {
        console.error("Permission denied - check Firestore security rules");
        setAlert({ type: "warning", message: "Unable to load reviews. Check your permissions." });
        setReviews([]);
      } else {
        console.error("Unknown error:", err);
        // Don't show error alert, just log it and set empty reviews
        setReviews([]);
      }
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      setAlert({ type: "error", message: "Please login to leave a review." });
      return;
    }

    if (currentUser.email === targetUser) {
      setAlert({ type: "error", message: "You cannot review yourself." });
      return;
    }

    if (rating === 0) {
      setAlert({ type: "error", message: "Please select a rating." });
      return;
    }

    if (comment.trim().length < 10) {
      setAlert({ type: "error", message: "Please provide a comment with at least 10 characters." });
      return;
    }

    setSubmitting(true);

    try {
      // Use consistent field names with Profile.jsx
      const reviewId = `${currentUser.email}_${targetUser}`.replace(/[.@]/g, '_');
      const reviewRef = doc(db, "reviews", reviewId);
      
      const reviewData = {
        reviewer: currentUser.email,
        reviewee: targetUser,
        rating: Number(rating),
        comment: comment.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(reviewRef, reviewData);

      // Update the reviewed user's profile to trigger recalculation
      const userRef = doc(db, "users", targetUser);
      await updateDoc(userRef, {
        lastReviewedAt: serverTimestamp(),
      });

      setAlert({ 
        type: "success", 
        message: myReview ? "Review updated successfully!" : "Review submitted successfully!" 
      });
      
      setMyReview({ ...reviewData, id: reviewId });
      
      // Refresh reviews to show the new/updated review
      await fetchReviews();

      // Navigate back to profile with refresh trigger after a short delay
      setTimeout(() => {
        navigate(`/profile/${targetUser}`, { 
          state: { refreshProfile: true },
          replace: true 
        });
      }, 2000);

    } catch (err) {
      console.error("Error submitting review:", err);
      setAlert({ type: "error", message: "Failed to submit review. Please try again." });
    }

    setSubmitting(false);
  };

  const calculateAverage = () => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return Math.round((total / reviews.length) * 10) / 10;
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[Math.floor(review.rating)]++;
      }
    });
    return distribution;
  };

  useEffect(() => {
    console.log('Review useEffect triggered - authReady:', authReady, 'targetUser:', targetUser, 'currentUser:', currentUser?.email);
    
    if (authReady && targetUser) {
      fetchUserProfile();
      fetchReviews();
    }
  }, [authReady, targetUser, currentUser]);

  const averageRating = calculateAverage();
  const ratingDistribution = getRatingDistribution();

  if (!authReady || loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="50vh">
        <CircularProgress />
        <Typography variant="body2" mt={2}>Loading reviews...</Typography>
      </Box>
    );
  }

  if (!targetUser) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Alert severity="error">
          <Typography variant="h6" gutterBottom>No User Specified</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Debug Info:
            <br />• URL Params userId: {userId || 'none'}
            <br />• Search Params user: {userParam || 'none'}
            <br />• Current URL: {window.location.href}
          </Typography>
        </Alert>
        <Button 
          onClick={() => navigate('/')} 
          variant="contained" 
          sx={{ mt: 2 }}
        >
          Go Home
        </Button>
      </Container>
    );
  }

  return (
    <>
      <Header showLogout />
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Back Button */}
        <Box mb={2}>
          <IconButton 
            onClick={() => navigate(`/profile/${targetUser}`)}
            sx={{ mr: 1 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="span" fontWeight="bold">
            Reviews
          </Typography>
        </Box>

        {/* User Header */}
        {reviewedUser && (
          <Paper elevation={2} sx={{ p: 3, mb: 3, backgroundColor: '#FEFFEC' }}>
            <Stack direction="row" alignItems="center" spacing={3}>
              <Avatar
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(reviewedUser.name || reviewedUser.email)}&background=023020&color=fff&size=128`}
                alt={reviewedUser.name || "User"}
                sx={{ width: 80, height: 80 }}
              />
              <Box flex={1}>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  {reviewedUser.name || reviewedUser.email}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={2} mb={1}>
                  <Rating value={averageRating} precision={0.1} readOnly />
                  <Typography variant="h6" color="text.secondary">
                    {averageRating.toFixed(1)} / 5
                  </Typography>
                  <Chip 
                    label={`${reviews.length} review${reviews.length !== 1 ? 's' : ''}`} 
                    color="primary" 
                    size="small" 
                  />
                </Stack>
                {reviewedUser.bio && (
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    {reviewedUser.bio}
                  </Typography>
                )}
              </Box>
            </Stack>

            {/* Rating Distribution */}
            {reviews.length > 0 && (
              <Box mt={3}>
                <Typography variant="subtitle2" gutterBottom>Rating Distribution</Typography>
                <Stack spacing={1}>
                  {[5, 4, 3, 2, 1].map(star => (
                    <Stack key={star} direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" sx={{ minWidth: 20 }}>
                        {star}
                      </Typography>
                      <Star sx={{ color: '#ffa726', fontSize: 16 }} />
                      <Box 
                        sx={{ 
                          flex: 1, 
                          height: 8, 
                          bgcolor: 'grey.200', 
                          borderRadius: 1,
                          overflow: 'hidden'
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            width: `${reviews.length ? (ratingDistribution[star] / reviews.length) * 100 : 0}%`,
                            bgcolor: '#ffa726',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 30 }}>
                        ({ratingDistribution[star]})
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}
          </Paper>
        )}

        {/* Review Form */}
        {currentUser && currentUser.email !== targetUser && (
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {myReview ? "Update Your Review" : "Leave a Review"}
            </Typography>

            <Box mb={3}>
              <Typography component="legend" gutterBottom>
                Rating *
              </Typography>
              <Rating
                value={rating}
                onChange={(e, newValue) => setRating(newValue)}
                size="large"
                sx={{
                  fontSize: '2rem',
                  '& .MuiRating-iconFilled': {
                    color: '#ff6d00'
                  },
                  '& .MuiRating-iconHover': {
                    color: '#ff8f00'
                  }
                }}
              />
            </Box>

            <TextField
              multiline
              fullWidth
              rows={4}
              label="Your Review *"
              placeholder="Share your experience working with this person. What skills did they help you with? How was the collaboration?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              variant="outlined"
              sx={{ mb: 3 }}
              helperText={`${comment.length}/500 characters (minimum 10 characters)`}
              inputProps={{ maxLength: 500 }}
              error={comment.length > 0 && comment.length < 10}
            />

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting || rating === 0 || comment.trim().length < 10}
                sx={{ 
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem'
                }}
              >
                {submitting ? (
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                ) : null}
                {submitting 
                  ? 'Submitting...' 
                  : myReview 
                    ? 'Update Review' 
                    : 'Submit Review'
                }
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => navigate(`/profile/${targetUser}`)}
                disabled={submitting}
              >
                Cancel
              </Button>
            </Stack>
          </Paper>
        )}

        {/* Login Prompt */}
        {!currentUser && (
          <Paper elevation={2} sx={{ p: 3, mb: 3, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
            <Typography variant="h6" gutterBottom>
              Login Required
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Please log in to leave a review for this user.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/login')}>
              Login
            </Button>
          </Paper>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Review List */}
        <Box>
          <Typography variant="h6" gutterBottom>
            All Reviews ({reviews.length})
          </Typography>

          {reviews.length === 0 ? (
            <Paper elevation={1} sx={{ p: 4, textAlign: 'center', backgroundColor: '#f9f9f9' }}>
              <StarBorder sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Reviews Yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Be the first to review this user's skills and collaboration!
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {reviews.map((review) => (
                <Card 
                  key={review.id} 
                  elevation={1}
                  sx={{ 
                    backgroundColor: review.reviewer === currentUser?.email ? '#e3f2fd' : '#ffffff',
                    border: review.reviewer === currentUser?.email ? '1px solid #1976d2' : 'none'
                  }}
                >
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {review.reviewer === currentUser?.email ? 'Your Review' : review.reviewer}
                          </Typography>
                          {review.reviewer === currentUser?.email && (
                            <Chip label="Your Review" size="small" color="primary" />
                          )}
                        </Stack>
                        <Rating value={review.rating || 0} precision={0.5} readOnly size="small" />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {review.createdAt?.toDate ? 
                          review.createdAt.toDate().toLocaleDateString() : 
                          'Recently'
                        }
                      </Typography>
                    </Stack>
                    
                    <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                      {review.comment || "No comment provided."}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>

        {/* Snackbar Alert */}
        <Snackbar
          open={!!alert}
          autoHideDuration={6000}
          onClose={() => setAlert(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          {alert && (
            <Alert
              onClose={() => setAlert(null)}
              severity={alert.type}
              sx={{ width: "100%" }}
              variant="filled"
            >
              {alert.message}
            </Alert>
          )}
        </Snackbar>
      </Container>
    </>
  );
};

export default Review;