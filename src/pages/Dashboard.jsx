import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider
} from '@mui/material';
import { auth, db } from '../firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Toast from '../components/Toast';

export default function Dashboard() {
  const [skills, setSkills] = useState([]);
  const [offered, setOffered] = useState('');
  const [requested, setRequested] = useState('');
  const [search, setSearch] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/');
      return;
    }

    const q = query(collection(db, 'skills'), orderBy('offered'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((doc) => doc.data());
      setSkills(list);
    });

    return () => unsub();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;

    try {
      await addDoc(collection(db, 'skills'), {
        email: user.email,
        offered,
        requested,
        createdAt: new Date()
      });
      setOffered('');
      setRequested('');
      setToastMsg('Skill added!');
      setShowToast(true);
    } catch (err) {
      setToastMsg(' Failed to add skill.');
      setShowToast(true);
    }
  };

  const filteredSkills = skills.filter((skill) =>
    [skill.offered, skill.requested]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <>
      <Header showLogout={true} />
      <Container maxWidth="md">
        <Box mt={4} mb={2} textAlign="center">
          <Typography variant="h4">Welcome to SkillSwap</Typography>
        </Box>

        {/* Add Skill Form */}
        <Box component="form" onSubmit={handleSubmit} mb={4} display="flex" gap={2}>
          <TextField
            label="Skill You Offer"
            value={offered}
            onChange={(e) => setOffered(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Skill You Want"
            value={requested}
            onChange={(e) => setRequested(e.target.value)}
            required
            fullWidth
          />
          <Button variant="contained" type="submit">
            Add
          </Button>
        </Box>

        {/* Search Bar */}
        <TextField
          label="Search Skills"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 3 }}
        />

        {/* Skill Listings */}
        <Grid container spacing={3}>
          {filteredSkills.length === 0 ? (
            <Grid item xs={12}>
              <Typography>No matching skills found.</Typography>
            </Grid>
          ) : (
            filteredSkills.map((skill, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Card elevation={3}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>{skill.email}</strong>
                    </Typography>
                    <Typography>
                      <strong>Offers:</strong> {skill.offered}
                    </Typography>
                    <Typography>
                      <strong>Wants:</strong> {skill.requested}
                    </Typography>
                  </CardContent>
                  <Divider />
                  <CardActions>
                    {skill.email !== auth.currentUser.email && (
                      <>
                        <Button
                          size="small"
                          onClick={() => navigate(`/chat?partner=${skill.email}`)}
                        >
                          Chat
                        </Button>
                        <Button
                          size="small"
                          onClick={() => navigate(`/review?user=${skill.email}`)}
                        >
                          Rate
                        </Button>
                      </>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
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
