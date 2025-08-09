import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Container, Box, TextField, Button, Typography, Grid, Card, CardContent, CardActions,
  Divider, Tabs, Tab, FormControl, CircularProgress,
  IconButton, Pagination, Chip, Avatar, Tooltip, InputLabel, Select, MenuItem, Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Rating } from '@mui/material';
import { motion } from 'framer-motion';
import { auth, db, batchFetchUsers, batchFetchUserRatings, subscribeToSkills, timestamp } from '../firebase';
import {
  collection, addDoc, deleteDoc, doc, updateDoc
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Toast from '../components/Toast';
import { onAuthStateChanged } from 'firebase/auth';

export default function Dashboard() {
  // State management
  const [skills, setSkills] = useState([]);
  const [offered, setOffered] = useState('');
  const [requested, setRequested] = useState('');
  const [availability, setAvailability] = useState('Anytime');
  const [skillLevel, setSkillLevel] = useState('Intermediate');
  const [search, setSearch] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [tab, setTab] = useState('community');
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('offered');
  const [page, setPage] = useState(1);
  const [editingSkill, setEditingSkill] = useState(null);
  const [users, setUsers] = useState({});
  const [userRatings, setUserRatings] = useState({});
  const [userEmail, setUserEmail] = useState('');
  const [authReady, setAuthReady] = useState(false);
  const [error, setError] = useState('');
  
  // Performance optimization refs
  const userCacheRef = useRef(new Map());
  const ratingCacheRef = useRef(new Map());
  const unsubscribeRef = useRef(null);
  const lastSkillsUpdateRef = useRef(0);
  const profilesFetchingRef = useRef(false);

  const perPage = 6;
  const navigate = useNavigate();

  // Auth state management
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
      } else {
        navigate('/login');
        return;
      }
      setAuthReady(true);
    });

    return () => unsubAuth();
  }, [navigate]);

  // Optimized function to handle skills updates with user profiles and ratings
  const handleSkillsUpdate = useCallback(async (skillsData) => {
    try {
      setSkills(skillsData);
      
      // Prevent multiple simultaneous profile fetches
      if (profilesFetchingRef.current) return;
      
      const currentTime = Date.now();
      const timeSinceLastUpdate = currentTime - lastSkillsUpdateRef.current;
      
      // Only fetch profiles if it's been more than 5 seconds since last update
      // This prevents excessive API calls during rapid updates
      if (timeSinceLastUpdate < 5000 && users && Object.keys(users).length > 0) {
        setLoading(false);
        return;
      }
      
      profilesFetchingRef.current = true;
      lastSkillsUpdateRef.current = currentTime;
      
      // Get unique user emails from skills
      const userEmails = [...new Set(skillsData.map(skill => skill.email))];
      
      if (userEmails.length === 0) {
        setLoading(false);
        profilesFetchingRef.current = false;
        return;
      }
      
      // Batch fetch users and ratings in parallel
      const [userProfiles, ratings] = await Promise.all([
        batchFetchUsers(userEmails, userCacheRef.current),
        batchFetchUserRatings(userEmails, ratingCacheRef.current)
      ]);
      
      setUsers(userProfiles);
      setUserRatings(ratings);
      setLoading(false);
      setError('');
      
    } catch (err) {
      console.error('Error handling skills update:', err);
      setError('Failed to load user profiles. Showing skills without profile data.');
      setLoading(false);
    } finally {
      profilesFetchingRef.current = false;
    }
  }, [users]);

  // Skills subscription with optimized listener
  useEffect(() => {
    if (!authReady) return;

    const handleSkillsData = (skillsData) => {
      handleSkillsUpdate(skillsData);
    };

    const handleSkillsError = (error) => {
      console.error('Skills listener error:', error);
      setError('Connection error. Please check your internet and refresh.');
      setLoading(false);
    };

    // Set up optimized skills subscription
    unsubscribeRef.current = subscribeToSkills(handleSkillsData, handleSkillsError);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [authReady, handleSkillsUpdate]);

  // Form submission handler with proper debugging
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!offered.trim() || !requested.trim()) {
      setToastMsg('Please enter valid skills');
      setShowToast(true);
      return;
    }

    // Debug logging to track values being sent
    const skillData = {
      offered: offered.trim(),
      requested: requested.trim(),
      availability,
      skillLevel,
      email: userEmail
    };
    
    console.log('Submitting skill with data:', skillData);

    try {
      if (editingSkill) {
        // Update existing skill
        const updateData = {
          ...skillData,
          updatedAt: timestamp()
        };
        
        console.log('Updating skill with ID:', editingSkill, 'Data:', updateData);
        
        await updateDoc(doc(db, 'skills', editingSkill), updateData);
        setToastMsg('✅ Skill updated successfully!');
      } else {
        // Create new skill
        const createData = {
          ...skillData,
          createdAt: timestamp()
        };
        
        console.log('Creating new skill with data:', createData);
        
        await addDoc(collection(db, 'skills'), createData);
        setToastMsg('✅ Skill added successfully!');
      }
      
      // Reset form
      setOffered('');
      setRequested('');
      setAvailability('Anytime');
      setSkillLevel('Intermediate');
      setEditingSkill(null);
      setShowToast(true);
      
    } catch (err) {
      console.error('Error saving skill:', err);
      setToastMsg(`❌ Failed to save skill: ${err.message}`);
      setShowToast(true);
    }
  };

  // Optimized skills filtering and sorting
  const sortedSkills = useMemo(() => {
    const filtered = skills.filter(skill => {
      const matchEmail = tab === 'mine' ? skill.email === userEmail : skill.email !== userEmail;
      
      if (!matchEmail) return false;
      
      if (!search.trim()) return true;
      
      const searchLower = search.toLowerCase();
      const userName = users[skill.email]?.name || users[skill.email]?.displayName || '';
      
      const searchableContent = [
        skill.offered || '',
        skill.requested || '',
        skill.availability || '',
        skill.skillLevel || '',
        userName,
        skill.email || ''
      ].join(' ').toLowerCase();
      
      return searchableContent.includes(searchLower);
    });
    
    return sort === 'newest'
      ? filtered.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        })
      : filtered.sort((a, b) => (a.offered || '').localeCompare(b.offered || ''));
  }, [skills, search, sort, tab, userEmail, users]);

  // Paginated skills
  const paginatedSkills = useMemo(() => {
    const start = (page - 1) * perPage;
    return sortedSkills.slice(start, start + perPage);
  }, [sortedSkills, page]);

  // Delete skill handler
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this skill?')) return;
    
    try {
      await deleteDoc(doc(db, 'skills', id));
      setToastMsg('✅ Skill deleted successfully');
      setShowToast(true);
    } catch (err) {
      console.error('Error deleting skill:', err);
      setToastMsg('❌ Failed to delete skill');
      setShowToast(true);
    }
  };

  // Edit skill handler
  const handleEditSkill = (skill, e) => {
    e.stopPropagation();
    
    console.log('Editing skill:', skill);
    
    setEditingSkill(skill.id);
    setOffered(skill.offered || '');
    setRequested(skill.requested || '');
    setAvailability(skill.availability || 'Anytime');
    setSkillLevel(skill.skillLevel || 'Intermediate');
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel edit handler
  const cancelEdit = () => {
    setEditingSkill(null);
    setOffered('');
    setRequested('');
    setAvailability('Anytime');
    setSkillLevel('Intermediate');
  };

  // Search handler with debouncing
  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page when searching
  }, []);

  // Loading state
  if (!authReady) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="50vh">
        <CircularProgress />
        <Typography variant="body2" mt={2}>Loading dashboard...</Typography>
      </Box>
    );
  }

  return (
    <>
      <Header showLogout={true} />
      <Container maxWidth="md">
        <Box mt={4} mb={2} textAlign="center">
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Welcome to SkillSwap
          </Typography>
          <Typography variant="body1" color="text.secondary" mt={1}>
            Share your skills and learn from others
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Skill Form */}
        <form onSubmit={handleSubmit}>
          <Box mb={3} display="flex" flexWrap="wrap" gap={2}>
            <TextField 
              label="Skill You Offer" 
              value={offered} 
              onChange={e => setOffered(e.target.value)} 
              required 
              fullWidth 
              placeholder="e.g., Web Development, Guitar, Cooking..."
            />
            <TextField 
              label="Skill You Want to Learn" 
              value={requested} 
              onChange={e => setRequested(e.target.value)} 
              required 
              fullWidth 
              placeholder="e.g., Photography, Spanish, Data Science..."
            />

            <FormControl fullWidth>
              <InputLabel>Availability</InputLabel>
              <Select 
                value={availability} 
                onChange={e => setAvailability(e.target.value)} 
                label="Availability"
              >
                <MenuItem value="Anytime">Anytime</MenuItem>
                <MenuItem value="Weekdays">Weekdays</MenuItem>
                <MenuItem value="Weekends">Weekends</MenuItem>
                <MenuItem value="Evenings">Evenings</MenuItem>
                <MenuItem value="Mornings">Mornings</MenuItem>
                <MenuItem value="Flexible">Flexible</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Your Skill Level</InputLabel>
              <Select 
                value={skillLevel} 
                onChange={e => setSkillLevel(e.target.value)} 
                label="Your Skill Level"
              >
                <MenuItem value="Beginner">Beginner</MenuItem>
                <MenuItem value="Intermediate">Intermediate</MenuItem>
                <MenuItem value="Advanced">Advanced</MenuItem>
                <MenuItem value="Expert">Expert</MenuItem>
              </Select>
            </FormControl>

            <Box display="flex" gap={1} width="100%">
              <Button type="submit" variant="contained" color="primary">
                {editingSkill ? 'Update Skill' : 'Add Skill'}
              </Button>
              {editingSkill && (
                <Button variant="outlined" onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
            </Box>
          </Box>
        </form>

        {/* Search and Filter Controls */}
        <Box mb={3} display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <TextField 
            label="Search Skills or Users" 
            value={search} 
            onChange={handleSearchChange}
            sx={{ flex: 1 }} 
            placeholder="Search by skill name or user..."
          />
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Sort By</InputLabel>
            <Select value={sort} onChange={(e) => setSort(e.target.value)} label="Sort By">
              <MenuItem value="offered">Alphabetical</MenuItem>
              <MenuItem value="newest">Newest First</MenuItem>
            </Select>
          </FormControl>
          <Tabs value={tab} onChange={(e, val) => { setTab(val); setPage(1); }}>
            <Tab value="community" label="Community Skills" />
            <Tab value="mine" label="My Skills" />
          </Tabs>
        </Box>

        {/* Skills Display */}
        {loading ? (
          <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress />
            <Typography variant="body2" ml={2} alignSelf="center">
              Loading skills...
            </Typography>
          </Box>
        ) : (
          <>
            {sortedSkills.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {tab === 'mine' ? 'No skills added yet' : 'No community skills found'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {tab === 'mine' 
                    ? 'Add your first skill using the form above!' 
                    : search 
                      ? 'Try adjusting your search terms'
                      : 'Be the first to share a skill!'
                  }
                </Typography>
              </Box>
            ) : (
              <>
                <Grid container spacing={3}>
                  {paginatedSkills.map((skill) => {
                    const profile = users[skill.email] || {};
                    const rating = userRatings[skill.email] || 0;
                    const displayName = profile.name || profile.displayName || skill.email?.split('@')[0] || 'Unknown User';
                    
                    return (
                      <Grid item xs={12} sm={6} md={4} key={skill.id}>
                        <motion.div 
                          whileHover={{ scale: 1.03 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card 
                            onClick={() => navigate(`/profile/${encodeURIComponent(skill.email)}`)} 
                            sx={{ 
                              cursor: 'pointer',
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              '&:hover': {
                                boxShadow: 3
                              }
                            }}
                          >
                            <CardContent sx={{ flexGrow: 1 }}>
                              <Box display="flex" alignItems="center" gap={1} mb={2}>
                                <Avatar 
                                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=023020&color=fff`}
                                  alt={displayName}
                                />
                                <Box>
                                  <Typography variant="subtitle2" fontWeight="bold">
                                    {displayName}
                                  </Typography>
                                  {rating > 0 && (
                                    <Box display="flex" alignItems="center" gap={0.5}>
                                      <Rating value={rating} precision={0.1} readOnly size="small" />
                                      <Typography variant="caption" color="text.secondary">
                                        ({rating.toFixed(1)})
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                              
                              <Typography variant="body2" gutterBottom>
                                <strong>Offers:</strong> {skill.offered || 'Not specified'}
                              </Typography>
                              <Typography variant="body2" gutterBottom>
                                <strong>Wants:</strong> {skill.requested || 'Not specified'}
                              </Typography>
                              
                              <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                                <Chip 
                                  size="small" 
                                  label={skill.availability || 'Anytime'} 
                                  color="primary" 
                                />
                                <Chip 
                                  size="small" 
                                  label={skill.skillLevel || 'Intermediate'} 
                                  variant="outlined" 
                                />
                              </Box>
                            </CardContent>
                            
                            <Divider />
                            
                            <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
                              {skill.email === userEmail ? (
                                <Box>
                                  <Tooltip title="Edit skill">
                                    <IconButton 
                                      size="small"
                                      onClick={(e) => handleEditSkill(skill, e)}
                                      color="primary"
                                    >
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete skill">
                                    <IconButton 
                                      size="small"
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        handleDelete(skill.id); 
                                      }}
                                      color="error"
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              ) : (
                                <Box display="flex" gap={1}>
                                  <Button 
                                    size="small"
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      navigate(`/chat?partner=${encodeURIComponent(skill.email)}`); 
                                    }}
                                  >
                                    Chat
                                  </Button>
                                  <Button 
                                    size="small"
                                    variant="outlined"
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      navigate(`/review/${encodeURIComponent(skill.email)}`); 
                                    }}
                                  >
                                    Review
                                  </Button>
                                </Box>
                              )}
                            </CardActions>
                          </Card>
                        </motion.div>
                      </Grid>
                    );
                  })}
                </Grid>
                
                {/* Pagination */}
                {Math.ceil(sortedSkills.length / perPage) > 1 && (
                  <Box display="flex" justifyContent="center" mt={4}>
                    <Pagination 
                      count={Math.ceil(sortedSkills.length / perPage)} 
                      page={page} 
                      onChange={(e, val) => setPage(val)}
                      color="primary"
                    />
                  </Box>
                )}
              </>
            )}
          </>
        )}
      </Container>
      
      <Toast 
        message={toastMsg} 
        visible={showToast} 
        onHide={() => setShowToast(false)} 
        type="info" 
      />
    </>
  );
}