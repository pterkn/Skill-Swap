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
  CircularProgress,
  IconButton,
  Pagination
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import CodeIcon from '@mui/icons-material/Code';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import SchoolIcon from '@mui/icons-material/School';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
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
  updateDoc
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
  const [sort, setSort] = useState('offered');
  const [page, setPage] = useState(1);
  const [editingSkill, setEditingSkill] = useState(null);
  const perPage = 6;
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/');
      return;
    }

    const q = query(collection(db, 'skills'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
      if (editingSkill) {
        await updateDoc(doc(db, 'skills', editingSkill), {
          offered,
          requested,
          category
        });
        setToastMsg('✅ Skill updated!');
      } else {
        await addDoc(collection(db, 'skills'), {
          email: user.email,
          offered,
          requested,
          category,
          createdAt: new Date()
        });
        setToastMsg('✅ Skill added!');
      }

      setOffered('');
      setRequested('');
      setCategory('other');
      setEditingSkill(null);
      setShowToast(true);
    } catch (err) {
      setToastMsg('❌ Failed to save skill.');
      setShowToast(true);
    }
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'skills', id));
    setToastMsg('🗑️ Skill deleted');
    setShowToast(true);
  };

  const handleEdit = (skill) => {
    setEditingSkill(skill.id);
    setOffered(skill.offered);
    setRequested(skill.requested);
    setCategory(skill.category);
  };

  const userEmail = auth.currentUser?.email || '';

  const sortedSkills = useMemo(() => {
    const filtered = skills.filter((skill) => {
      const emailMatch = tab === 'mine' ? skill.email === userEmail : skill.email !== userEmail;
      const queryMatch = [skill.offered, skill.requested].join(' ').toLowerCase().includes(search.toLowerCase());
      return emailMatch && queryMatch;
    });

    if (sort === 'newest') {
      return filtered.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
    } else {
      return filtered.sort((a, b) => a.offered.localeCompare(b.offered));
    }
  }, [skills, tab, userEmail, search, sort]);

  const paginatedSkills = useMemo(() => {
    const start = (page - 1) * perPage;
    return sortedSkills.slice(start, start + perPage);
  }, [sortedSkills, page]);

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

        <Box component="form" onSubmit={handleSubmit} mb={4} display="flex" flexWrap="wrap" gap={2}>
          <TextField label="Skill You Offer" value={offered} onChange={(e) => setOffered(e.target.value)} required fullWidth variant="outlined" />
          <TextField label="Skill You Want" value={requested} onChange={(e) => setRequested(e.target.value)} required fullWidth variant="outlined" />
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select value={category} onChange={(e) => setCategory(e.target.value)} label="Category">
              <MenuItem value="design">Design</MenuItem>
              <MenuItem value="code">Code</MenuItem>
              <MenuItem value="teaching">Teaching</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" type="submit" color="primary">
            {editingSkill ? 'Update' : 'Add'}
          </Button>
        </Box>

        <Box mb={3} display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <TextField label="Search Skills" value={search} onChange={(e) => setSearch(e.target.value)} variant="outlined" sx={{ flex: 1 }} />
          <FormControl>
            <InputLabel>Sort</InputLabel>
            <Select value={sort} onChange={(e) => setSort(e.target.value)} label="Sort">
              <MenuItem value="offered">Alphabetical</MenuItem>
              <MenuItem value="newest">Newest</MenuItem>
            </Select>
          </FormControl>
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
          <>
            <Grid container spacing={3}>
              {paginatedSkills.length === 0 ? (
                <Grid item xs={12}>
                  <Typography>No matching skills found.</Typography>
                </Grid>
              ) : (
                paginatedSkills.map((skill, i) => (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
                      <Card elevation={3} sx={{ backgroundColor: '#FEFFEC' }}>
                        <CardContent>
                          <Box display="flex" alignItems="center" mb={1}>
                            <img
                              src={`https://ui-avatars.com/api/?name=${skill.email}&background=random`}
                              alt="Avatar"
                              style={{ borderRadius: '50%', width: 40, height: 40, marginRight: 10 }}
                            />
                            <Typography variant="subtitle1"><strong>{skill.email}</strong></Typography>
                          </Box>
                          <Typography><strong>Offers:</strong> {getSkillIcon(skill.category)} {skill.offered}</Typography>
                          <Typography><strong>Wants:</strong> {getSkillIcon(skill.category)} {skill.requested}</Typography>
                          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            📅 Added on {new Date(skill.createdAt?.seconds * 1000).toDateString()}
                          </Typography>
                        </CardContent>
                        <Divider />
                        <CardActions>
                          {skill.email === userEmail ? (
                            <>
                              <IconButton onClick={() => handleEdit(skill)}><EditIcon fontSize="small" /></IconButton>
                              <IconButton onClick={() => handleDelete(skill.id)}><DeleteIcon fontSize="small" /></IconButton>
                            </>
                          ) : (
                            <>
                              <Button size="small" onClick={() => navigate(`/chat?partner=${skill.email}`)}>Chat</Button>
                              <Button size="small" onClick={() => navigate(`/review?user=${skill.email}`)}>Rate</Button>
                              <IconButton><StarIcon fontSize="small" color="warning" /></IconButton>
                            </>
                          )}
                        </CardActions>
                      </Card>
                    </motion.div>
                  </Grid>
                ))
              )}
            </Grid>

            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={Math.ceil(sortedSkills.length / perPage)}
                page={page}
                onChange={(e, val) => setPage(val)}
                color="primary"
              />
            </Box>
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
