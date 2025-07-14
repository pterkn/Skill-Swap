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
  Tab,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Avatar
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import CodeIcon from '@mui/icons-material/Code';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import SchoolIcon from '@mui/icons-material/School';
import DeleteIcon from '@mui/icons-material/Delete';
import { motion } from 'framer-motion';
import { auth, db } from '../firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
  getDocs
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
  const [profiles, setProfiles] = useState({});

  const navigate = useNavigate();
  const userEmail = auth.currentUser?.email || '';

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/');
      return;
    }

    const q = query(collection(db, 'skills'), orderBy('offered'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSkills(list);
    });

    const fetchProfiles = async () => {
      const snap = await getDocs(collection(db, 'profiles'));
      const map = {};
      snap.forEach((doc) => {
        map[doc.id] = doc.data();
      });
      setProfiles(map);
    };

    fetchProfiles();
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

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'skills', id));
    setToastMsg('🗑️ Skill deleted');
    setShowToast(true);
  };

  const filteredSkills = skills.filter((skill) => {
    const matchEmail = tab === 'mine'
      ? skill.email === userEmail
      : skill.email !== userEmail;

    const matchQuery = [skill.offered, skill.requested]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchEmail && matchQuery;
  });

  const getSkillIcon = (cat) => {
    if (cat === 'code') return <CodeIcon fontSize="small" sx={{ mr: 1 }} />;
    if (cat === 'design') return <DesignServicesIcon fontSize="small" sx={{ mr: 1 }} />;
    if (cat === 'teaching') return <SchoolIcon fontSize="small" sx={{ mr: 1 }} />;
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
          <Tabs value={tab} onChange={(e, val) => setTab(val)} centered>
            <Tab value="community" label="🌐 Community Skills" />
            <Tab value="mine" label="👤 My Skills" />
          </Tabs>
        </Box>

        <Grid container spacing={3}>
          {filteredSkills.length === 0 ? (
            <Grid item xs={12}>
              <Typography>No matching skills found.</Typography>
            </Grid>
          ) : (
            filteredSkills.map((skill, i) => (
              <Grid item xs={12} sm={6} md={4} key={skill.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Card elevation={3}>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Avatar
                          src={`https://ui-avatars.com/api/?name=${skill.email}`}
                          sx={{ width: 40, height: 40, mr: 1 }}
                        />
                        <Box>
                          <Typography variant="subtitle1">
                            <strong>{profiles[skill.email]?.name || skill.email}</strong>
                          </Typography>
                          {profiles[skill.email]?.bio && (
                            <Typography variant="caption">{profiles[skill.email].bio}</Typography>
                          )}
                        </Box>
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
                      {skill.email === userEmail ? (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleDelete(skill.id)}
                        >
                          <DeleteIcon fontSize="small" /> Delete
                        </Button>
                      ) : (
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
