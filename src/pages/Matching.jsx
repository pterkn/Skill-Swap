import React, { useEffect, useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Box,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Switch,
  FormControlLabel
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import {
  collection,
  query,
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import Header from '../components/Header';
import { motion } from 'framer-motion';

export default function Matching() {
  const [skills, setSkills] = useState([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [mutualOnly, setMutualOnly] = useState(false);
  const navigate = useNavigate();

  const userEmail = auth.currentUser?.email;

  useEffect(() => {
    if (!userEmail) return;
    const q = query(collection(db, 'skills'), orderBy('offered'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((doc) => doc.data());
      setSkills(list);
    });
    return () => unsub();
  }, [userEmail]);

  const userSkills = useMemo(() => {
    return skills.filter((s) => s.email === userEmail);
  }, [skills, userEmail]);

  const filteredMatches = useMemo(() => {
    return skills.filter((skill) => {
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
  }, [skills, category, search, userSkills, userEmail, mutualOnly]);

  const handleChat = (email) => {
    navigate(`/chat?partner=${email}`);
  };

  const handleRate = (email) => {
    navigate(`/review?user=${email}`);
  };

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

          <FormControl sx={{ minWidth: 120 }}>
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

          <FormControlLabel
            control={
              <Switch
                checked={mutualOnly}
                onChange={(e) => setMutualOnly(e.target.checked)}
              />
            }
            label="Mutual Matches"
          />
        </Box>

        <Grid container spacing={3} mt={2}>
          {filteredMatches.length === 0 ? (
            <Grid item xs={12}>
              <Typography>No matches found.</Typography>
            </Grid>
          ) : (
            filteredMatches.map((match, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Card elevation={3} sx={{ backgroundColor: '#FEFFEC' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={1}>
                        <img
                          src={`https://ui-avatars.com/api/?name=${match.email}&background=random`}
                          alt="Avatar"
                          style={{ borderRadius: '50%', width: 40, height: 40, marginRight: 10 }}
                        />
                        <Typography variant="subtitle1">
                          <strong>{match.email}</strong>
                        </Typography>
                      </Box>
                      <Typography><strong>Offers:</strong> {match.offered}</Typography>
                      <Typography><strong>Wants:</strong> {match.requested}</Typography>
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
            ))
          )}
        </Grid>
      </Container>
    </>
  );
}
