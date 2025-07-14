import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Avatar,
  Tabs,
  Tab,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../components/Header';

export default function Matching() {
  const [skills, setSkills] = useState([]);
  const [myOffered, setMyOffered] = useState([]);
  const [myRequested, setMyRequested] = useState([]);
  const [tab, setTab] = useState('offer');
  const [category, setCategory] = useState('all');

  const user = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSkills = async () => {
      const q = query(collection(db, 'skills'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const all = snap.docs.map(doc => doc.data());
      setSkills(all);

      const mine = all.filter(s => s.email === user.email);
      setMyOffered(mine.map(s => s.offered.toLowerCase()));
      setMyRequested(mine.map(s => s.requested.toLowerCase()));
    };
    fetchSkills();
  }, [user]);

  const matches = skills.filter((s) => {
    if (s.email === user.email) return false;
    const offered = s.offered.toLowerCase();
    const requested = s.requested.toLowerCase();

    const matchesTab = tab === 'offer'
      ? myRequested.includes(offered)
      : myOffered.includes(requested);

    const matchesCategory =
      category === 'all' || s.category === category;

    return matchesTab && matchesCategory;
  });

  return (
    <>
      <Header showLogout={true} />
      <Container maxWidth="md">
        <Box mt={4} textAlign="center">
          <Typography variant="h4">Skill Matches</Typography>
        </Box>

        <Box mt={3} mb={3}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} centered>
            <Tab value="offer" label="They Offer What I Want" />
            <Tab value="request" label="They Want What I Offer" />
          </Tabs>
        </Box>

        <Box mb={3} display="flex" justifyContent="center">
          <ToggleButtonGroup
            value={category}
            exclusive
            onChange={(e, val) => setCategory(val)}
            size="small"
            color="primary"
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="design">Design</ToggleButton>
            <ToggleButton value="code">Code</ToggleButton>
            <ToggleButton value="teaching">Teaching</ToggleButton>
            <ToggleButton value="other">Other</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Grid container spacing={3}>
          {matches.length === 0 ? (
            <Grid item xs={12}>
              <Typography textAlign="center">No matches found.</Typography>
            </Grid>
          ) : (
            matches.map((m, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card elevation={3}>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Avatar
                          src={`https://ui-avatars.com/api/?name=${m.email}`}
                          sx={{ mr: 2 }}
                        />
                        <Typography variant="subtitle1"><strong>{m.email}</strong></Typography>
                      </Box>

                      <Typography><strong>Offers:</strong> {m.offered}</Typography>
                      <Typography><strong>Wants:</strong> {m.requested}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Category: {m.category || 'N/A'}
                      </Typography>
                    </CardContent>
                    <Box display="flex" justifyContent="flex-end" p={2} gap={1}>
                      <Button
                        size="small"
                        onClick={() => navigate(`/chat?partner=${m.email}`)}
                      >
                        Chat
                      </Button>
                      <Button
                        size="small"
                        onClick={() => navigate(`/review?user=${m.email}`)}
                      >
                        Rate
                      </Button>
                    </Box>
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
