
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  MenuItem,
  Select,
  InputLabel,
  FormControl
} from '@mui/material';
import { auth, db } from '../firebase';
import {
  collection,
  getDocs,
  orderBy,
  query
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

export default function Matching() {
  const [skills, setSkills] = useState([]);
  const [matches, setMatches] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [onlyMutual, setOnlyMutual] = useState(false);

  const navigate = useNavigate();
  const userEmail = auth.currentUser?.email;

  useEffect(() => {
    const fetchSkills = async () => {
      const q = query(collection(db, 'skills'), orderBy('offered'));
      const snap = await getDocs(q);
      const list = snap.docs.map((doc) => doc.data());
      setSkills(list);
    };
    fetchSkills();
  }, []);

  useEffect(() => {
    const mine = skills.filter((s) => s.email === userEmail);
    const theirs = skills.filter((s) => s.email !== userEmail);

    const newMatches = theirs.filter((t) =>
      mine.some((m) =>
        m.offered.toLowerCase() === t.requested.toLowerCase() &&
        m.requested.toLowerCase() === t.offered.toLowerCase()
      )
    );

    const filtered = newMatches.filter((s) => {
      const queryMatch = [s.offered, s.requested].join(' ').toLowerCase().includes(search.toLowerCase());
      const categoryMatch =
        category === 'all' ||
        (category === s.category);
      return queryMatch && categoryMatch;
    });

    setMatches(onlyMutual ? filtered : theirs);
  }, [skills, search, category, onlyMutual, userEmail]);

  const categories = ['all', 'code', 'design', 'teaching', 'other'];

  return (
    <>
      <Header showLogout={true} />
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h4" textAlign="center" mb={3} fontFamily="Georgia, serif">
          Skill Matches
        </Typography>

        <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
          <TextField
            label="Search skills"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant={onlyMutual ? 'contained' : 'outlined'}
            onClick={() => setOnlyMutual(!onlyMutual)}
            sx={{ minWidth: '150px' }}
          >
            {onlyMutual ? 'Showing Mutual Matches' : 'Show Only Mutual'}
          </Button>
        </Box>

        <Grid container spacing={3}>
          {matches.length === 0 ? (
            <Grid item xs={12}>
              <Typography>No matches found.</Typography>
            </Grid>
          ) : (
            matches.map((skill, i) => (
              <Grid item xs={12} sm={6} key={i}>
                <Card sx={{ backgroundColor: '#FEFFEC' }}>
                  <CardContent>
                    <Typography variant="subtitle1">
                      <strong>{skill.email}</strong>
                    </Typography>
                    <Typography>
                      <strong>Offers:</strong> {skill.offered}
                    </Typography>
                    <Typography>
                      <strong>Wants:</strong> {skill.requested}
                    </Typography>
                    <Typography variant="caption">Category: {skill.category}</Typography>
                  </CardContent>
                  <Divider />
                  <CardActions>
                    <Button size="small" onClick={() => navigate(`/chat?partner=${skill.email}`)}>
                      💬 Chat
                    </Button>
                    <Button size="small" onClick={() => navigate(`/review?user=${skill.email}`)}>
                      ⭐ Rate
                    </Button>
                    <Button size="small" variant="outlined" color="success">
                      💾 Save Match
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Container>
    </>
  );
}
