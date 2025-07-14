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
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import CodeIcon from '@mui/icons-material/Code';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import SchoolIcon from '@mui/icons-material/School';
import { motion } from 'framer-motion';
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
  const [tab, setTab] = useState('community');
  const [category, setCategory] = useState('all');

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
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
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;

    if (!user) return;

    try {
      await addDoc(collection(db, 'skills'), {
        email: user.email,
        offered,
        requested,
        createdAt: new Date()
      });
      setOffered('');
      setRequested('');
      setToastMsg('✅ Skill added!');
      setShowToast(true);
    } catch (err) {
      setToastMsg('❌ Failed to add skill.');
      setShowToast(true);
    }
  };

  const userEmail = auth.currentUser?.email || '';

  const filteredSkills = skills
    .filter((skill) => {
      const emailMatch = tab === 'mine'
        ? skill.email === userEmail
        : skill.email !== userEmail;

      const queryMatch = [skill.offered, skill.requested]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase());

      const s = skill.offered.toLowerCase();
      const categoryMatch =
        category === 'all' ||
        (category === 'code' && s.includes('code')) ||
        (category === 'design' && s.includes('design')) ||
        (category === 'teaching' && s.includes('teach')) ||
        (category === 'other' &&
          !s.includes('code') &&
          !s.includes('design') &&
          !s.includes('teach'));

      return emailMatch && queryMatch && categoryMatch;
    });

  const getSkillIcon = (skill) => {
    const s = skill.toLowerCase();
    if (s.includes('code') || s.includes('programming')) return <CodeIcon fontSize="small" sx={{ mr: 1 }} />;
    if (s.includes('design')) return <DesignServicesIcon fontSize="small" sx={{ mr: 1 }} />;
    if (s.includes('teach') || s.includes('language')) return <SchoolIcon fontSize="small" sx={{ mr: 1 }} />;
    return <BuildIcon fontSize="small" sx={{ mr: 1 }} />;
  };

  return (
    <>
      <Header showLogout={true} />
      <Container maxWidth="md">
        <Box mt={4} mb={2} textAlign="center">
          <Typography variant="h4">Welcome to SkillSwap</Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          mb={4}
          display="flex"
          flexWrap="wrap"
          gap={2}
        >
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

        <TextField
          label="Search Skills"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 3 }}
        />

        <Box mb={3}>
          <Tabs value={tab} onChange={(e, newVal) => setTab(newVal)} centered>
            <Tab value="community" label="🌐 Community Skills" />
            <Tab value="mine" label="👤 My Skills" />
          </Tabs>
        </Box>

        <Box mb={3} display="flex" gap={1} flexWrap="wrap" justifyContent="center">
          {['all', 'code', 'design', 'teaching', 'other'].map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setCategory(cat)}
            >
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Button>
          ))}
        </Box>

        <Grid container spacing={3}>
          {filteredSkills.length === 0 ? (
            <Grid item xs={12}>
              <Typography>No matching skills found.</Typography>
            </Grid>
          ) : (
            filteredSkills.map((skill, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Card elevation={3}>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={1}>
                        <img
                          src={`https://ui-avatars.com/api/?name=${skill.email}&background=random`}
                          alt="Avatar"
                          style={{
                            borderRadius: '50%',
                            width: 40,
                            height: 40,
                            marginRight: 10
                          }}
                        />
                        <Typography variant="subtitle1">
                          <strong>{skill.email}</strong>
                        </Typography>
                      </Box>

                      <Typography>
                        <strong>Offers:</strong> {getSkillIcon(skill.offered)} {skill.offered}
                      </Typography>
                      <Typography>
                        <strong>Wants:</strong> {getSkillIcon(skill.requested)} {skill.requested}
                      </Typography>
                    </CardContent>

                    <Divider />

                    <CardActions>
                      {skill.email !== auth.currentUser?.email && (
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
                </motion.div>
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
