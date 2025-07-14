import React, { useState, useEffect, useMemo } from 'react';
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
  Tab,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  CircularProgress
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
  const [category, setCategory] = useState('other');
  const [search, setSearch] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [tab, setTab] = useState('community');
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    });

    return () => unsub();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;

    if (!offered.trim() || !requested.trim()) {
      setToastMsg('Please enter valid skills');
      setShowToast(true);
      return;
    }

    try {
      await addDoc(collection(db, 'skills'), {
        email: user.email,
        offered,
        requested,
        category,
        createdAt: new Date()
      });
      setOffered('');
      setRequested('');
      setCategory('other');
      setToastMsg('✅ Skill added!');
      setShowToast(true);
    } catch (err) {
      setToastMsg('❌ Failed to add skill.');
      setShowToast(true);
    }
  };

  const userEmail = auth.currentUser?.email || '';

  const filteredSkills = useMemo(() => {
    return skills.filter((skill) => {
      const emailMatch = tab === 'mine'
        ? skill.email === userEmail
        : skill.email !== userEmail;

      const queryMatch = [skill.offered, skill.requested]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase());

      return emailMatch && queryMatch;
    });
  }, [skills, tab, userEmail, search]);

  const getSkillIcon = (category) => {
    if (category === 'code') return <CodeIcon fontSize="small" sx={{ mr: 1 }} />;
    if (category === 'design') return <DesignServicesIcon fontSize="small" sx={{ mr: 1 }} />;
    if (category === 'teaching') return <SchoolIcon fontSize="small" sx={{ mr: 1 }} />;
    return <BuildIcon fontSize="small" sx={{ mr: 1 }} />;
  };

  return (
    <>
      <Header showLogout={true} />
      <Container maxWidth="md">
        <Box mt={4} mb={2} textAlign="center">
          <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'bold', fontFamily: 'Georgia, serif' }}>
            Welcome to SkillSwap
          </Typography>
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
            variant="outlined"
          />
          <TextField
            label="Skill You Want"
            value={requested}
            onChange={(e) => setRequested(e.target.value)}
            required
            fullWidth
            variant="outlined"
          />
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              label="Category"
            >
              <MenuItem value="design">Design</MenuItem>
              <MenuItem value="code">Code</MenuItem>
              <MenuItem value="teaching">Teaching</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" type="submit" color="primary">
            Add
          </Button>
        </Box>

        <TextField
          label="Search Skills"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          variant="outlined"
          sx={{ mb: 3 }}
        />

        <Box mb={3}>
          <Tabs value={tab} onChange={(e, newVal) => setTab(newVal)} centered>
            <Tab value="community" label="🌐 Community Skills" />
            <Tab value="mine" label="👤 My Skills" />
          </Tabs>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress />
          </Box>
        ) : (
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
                    <Card elevation={3} sx={{ backgroundColor: '#FEFFEC' }}>
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
                          <strong>Offers:</strong> {getSkillIcon(skill.category)} {skill.offered}
                        </Typography>
                        <Typography>
                          <strong>Wants:</strong> {getSkillIcon(skill.category)} {skill.requested}
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
                  </motion.div>
                </Grid>
              ))
            )}
          </Grid>
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
