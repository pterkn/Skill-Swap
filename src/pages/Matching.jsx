import React, { useEffect, useState, useMemo } from 'react';
import {
  Container, Typography, Grid, Card, CardContent, CardActions, Button, TextField, Box,
  MenuItem, Select, InputLabel, FormControl, Switch, FormControlLabel, Chip, Tooltip, Avatar, CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import {
  collection, query, onSnapshot, orderBy, getDocs
} from 'firebase/firestore';
import Header from '../components/Header';
import { motion } from 'framer-motion';
import StarIcon from '@mui/icons-material/Star';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

export default function Matching() {
  const [skills, setSkills] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [mutualOnly, setMutualOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userEmail = auth.currentUser?.email;

  useEffect(() => {
    if (!userEmail) return;

    const q = query(collection(db, 'skills'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((doc) => doc.data());
      setSkills(list);
      setLoading(false);
    });

    return () => unsub();
  }, [userEmail]);

  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, 'users'));
      const map = {};
      snap.forEach((doc) => {
        map[doc.id] = doc.data();
      });
      setUserMap(map);
    };
    fetchUsers();
  }, []);

  const userSkills = useMemo(() => skills.filter(s => s.email === userEmail), [skills, userEmail]);

  const filteredMatches = useMemo(() => {
    const base = skills.filter(skill => {
      if (skill.email === userEmail) return false;

      const matchCategory = category === 'all' || skill.category === category;
      const matchSearch = [skill.offered, skill.requested].join(' ').toLowerCase().includes(search.toLowerCase());

      const mutualMatch = userSkills.some(
        (us) =>
          us.offered.toLowerCase() === skill.requested.toLowerCase() &&
          us.requested.toLowerCase() === skill.offered.toLowerCase()
      );

      return matchCategory && matchSearch && (!mutualOnly || mutualMatch);
    });

    if (sortOrder === 'alphabetical') {
      return base.sort((a, b) => a.offered.localeCompare(b.offered));
    }
    return base;
  }, [skills, category, search, userSkills, userEmail, mutualOnly, sortOrder]);

  const handleChat = (email) => navigate(`/chat?partner=${email}`);
  const handleRate = (email) => navigate(`/review?user=${email}`);
  const handleProfile = (email) => navigate(`/profile?user=${email}`);

  return (
    <>
      <Header showLogout={true} />
      <Container maxWidth="md">
        <Box mt={4} textAlign="center">
          <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            Find Skill Matches
          </Typography>
        </Box>

        <Box display="flex" gap={2} mt={4} flexWrap="wrap" justifyContent="center">
          <TextField
            label="Search Skills"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <FormControl sx={{ minWidth: 140 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              label="Category"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="code">Code</MenuItem>
              <MenuItem value="design">Design</MenuItem>
              <MenuItem value="teaching">Teaching</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 140 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              label="Sort By"
            >
              <MenuItem value="newest">Newest</MenuItem>
              <MenuItem value="alphabetical">A-Z</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={<Switch checked={mutualOnly} onChange={(e) => setMutualOnly(e.target.checked)} />}
            label="Mutual Only"
          />
        </Box>

        <Grid container spacing={3} mt={2}>
          {loading ? (
            <Grid item xs={12} textAlign="center">
              <CircularProgress />
            </Grid>
          ) : filteredMatches.length === 0 ? (
            <Grid item xs={12}>
              <Typography>No matches found.</Typography>
            </Grid>
          ) : (
            filteredMatches.map((match, i) => {
              const isMutual = userSkills.some(
                (us) =>
                  us.offered.toLowerCase() === match.requested.toLowerCase() &&
                  us.requested.toLowerCase() === match.offered.toLowerCase()
              );

              const user = userMap[match.email];
              const isOnline = user?.status === 'online';
              const lastSeen = user?.lastSeen?.toDate?.().toLocaleString?.() || 'Unknown';
              const displayName = user?.name || match.email;
              const bio = user?.bio || '';
              const rating = user?.rating || 0;
              const availability = user?.availability || '';
              const skillLevel = user?.skillLevel || '';

              return (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <Card elevation={4} sx={{ backgroundColor: '#FEFFEC', borderRadius: 3 }}>
                      <CardContent>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Box sx={{ position: 'relative' }}>
                            <Avatar src={`https://ui-avatars.com/api/?name=${displayName}&background=023020&color=fff`} sx={{ width: 40, height: 40, mr: 1 }} />
                            <Tooltip title={isOnline ? 'Online' : `Last seen: ${lastSeen}`}>
                              <FiberManualRecordIcon
                                sx={{
                                  position: 'absolute',
                                  bottom: 0,
                                  right: 0,
                                  color: isOnline ? 'green' : 'gray',
                                  fontSize: 12,
                                  border: '2px solid white',
                                  borderRadius: '50%'
                                }}
                              />
                            </Tooltip>
                          </Box>
                          <Tooltip title={bio} placement="top">
                            <Typography variant="subtitle1" onClick={() => handleProfile(match.email)} sx={{ cursor: 'pointer', fontWeight: 'bold' }}>
                              {displayName} {rating > 0 && (<><StarIcon sx={{ color: 'gold', fontSize: 18 }} /> {rating.toFixed(1)}</>)}
                            </Typography>
                          </Tooltip>
                        </Box>

                        <Typography><strong>Offers:</strong> {match.offered}</Typography>
                        <Typography><strong>Wants:</strong> {match.requested}</Typography>
                        {availability && (
                          <Chip label={availability} size="small" color="primary" sx={{ mt: 1, mr: 1 }} />
                        )}
                        {skillLevel && (
                          <Chip label={skillLevel} size="small" color="secondary" sx={{ mt: 1 }} />
                        )}
                        {match.createdAt && (
                          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            Added on: {new Date(match.createdAt.seconds * 1000).toDateString()}
                          </Typography>
                        )}
                        {isMutual && (
                          <Chip label="Mutual Match" size="small" color="success" sx={{ mt: 1 }} />
                        )}
                      </CardContent>
                      <CardActions>
                        <Button size="small" onClick={() => handleChat(match.email)}>Chat</Button>
                        <Button size="small" onClick={() => handleRate(match.email)}>Rate</Button>
                      </CardActions>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })
          )}
        </Grid>
      </Container>
    </>
  );
}
