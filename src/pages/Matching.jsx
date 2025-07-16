import React, { useEffect, useState, useMemo } from 'react';
import {
  Container, Typography, Grid, Card, CardContent, CardActions, Button, TextField, Box,
  MenuItem, Select, InputLabel, FormControl, Switch, FormControlLabel, Chip, Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import {
  collection, query, onSnapshot, orderBy
} from 'firebase/firestore';
import Header from '../components/Header';
import { motion } from 'framer-motion';

export default function Matching() {
  const [skills, setSkills] = useState([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [mutualOnly, setMutualOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest');
  const navigate = useNavigate();
  const userEmail = auth.currentUser?.email;

  useEffect(() => {
    if (!userEmail) return;

    const q = query(collection(db, 'skills'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((doc) => doc.data());
      setSkills(list);
    });

    const interval = setInterval(() => {
      // Trigger refresh by re-fetching
      console.log("🔄 Auto refreshing matches...");
    }, 30000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [userEmail]);

  const userSkills = useMemo(() => skills.filter(s => s.email === userEmail), [skills, userEmail]);

  const filteredMatches = useMemo(() => {
    const base = skills.filter(skill => {
      if (skill.email === userEmail) return false;

      const matchCategory = category === 'all' || skill.category === category;
      const matchSearch =
        [skill.offered, skill.requested].join(' ').toLowerCase().includes(search.toLowerCase());

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
            control={
              <Switch
                checked={mutualOnly}
                onChange={(e) => setMutualOnly(e.target.checked)}
              />
            }
            label="Mutual Only"
          />
        </Box>

        <Grid container spacing={3} mt={2}>
          {filteredMatches.length === 0 ? (
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
                            <img
                              src={`https://ui-avatars.com/api/?name=${match.email}&background=023020&color=fff`}
                              alt="Avatar"
                              style={{ borderRadius: '50%', width: 40, height: 40, marginRight: 10 }}
                            />
                            <Box
                              sx={{
                                position: 'absolute',
                                right: 5,
                                bottom: 5,
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                backgroundColor: 'green',
                                border: '2px solid white'
                              }}
                            />
                          </Box>
                          <Typography variant="subtitle1">
                            <strong>{match.email}</strong>
                          </Typography>
                        </Box>

                        <Typography><strong>Offers:</strong> {match.offered}</Typography>
                        <Typography><strong>Wants:</strong> {match.requested}</Typography>
                        {match.createdAt && (
                          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            Added on: {new Date(match.createdAt?.seconds * 1000).toDateString()}
                          </Typography>
                        )}
                        {isMutual && (
                          <Chip
                            label="Mutual Match"
                            size="small"
                            color="success"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </CardContent>
                      <CardActions>
                        <Button size="small" onClick={() => handleChat(match.email)}>
                          Chat
                        </Button>
                        <Button size="small" onClick={() => handleRate(match.email)}>
                          Rate
                        </Button>
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
