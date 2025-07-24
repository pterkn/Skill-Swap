
import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Box, TextField, Button, Typography, Grid, Card, CardContent, CardActions,
  Divider, Tabs, Tab, MenuItem, Select, InputLabel, FormControl, CircularProgress,
  IconButton, Pagination, Chip, Avatar, Popover, Tooltip
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import CodeIcon from '@mui/icons-material/Code';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import SchoolIcon from '@mui/icons-material/School';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import { Rating } from '@mui/material';
import { motion } from 'framer-motion';
import { auth, db } from '../firebase';
import {
  collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, getDoc, where
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Toast from '../components/Toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

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
  const [users, setUsers] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [hoveredUser, setHoveredUser] = useState(null);

  const perPage = 6;
  const navigate = useNavigate();
  const userEmail = auth.currentUser?.email || '';

  useEffect(() => {
    const q = query(collection(db, 'skills'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, async (snap) => {
      const skillList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSkills(skillList);
      setLoading(false);

      const userEmails = [...new Set(skillList.map(skill => skill.email))];
      const userProfiles = {};

      for (const email of userEmails) {
        const docSnap = await getDoc(doc(db, 'users', email));
        if (docSnap.exists()) userProfiles[email] = docSnap.data();
      }

      setUsers(userProfiles);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!offered.trim() || !requested.trim()) {
      setToastMsg('Please enter valid skills');
      setShowToast(true);
      return;
    }

    try {
      if (editingSkill) {
        await updateDoc(doc(db, 'skills', editingSkill), { offered, requested, category });
        setToastMsg('✅ Skill updated!');
      } else {
        await addDoc(collection(db, 'skills'), {
          email: userEmail,
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
    } catch {
      setToastMsg('❌ Failed to save skill.');
      setShowToast(true);
    }
  };

  const sortedSkills = useMemo(() => {
    const filtered = skills.filter(skill => {
      const matchEmail = tab === 'mine' ? skill.email === userEmail : skill.email !== userEmail;
      const matchSearch = [skill.offered, skill.requested].join(' ').toLowerCase().includes(search.toLowerCase());
      return matchEmail && matchSearch;
    });
    return sort === 'newest'
      ? filtered.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
      : filtered.sort((a, b) => a.offered.localeCompare(b.offered));
  }, [skills, search, sort, tab, userEmail]);

  const paginatedSkills = useMemo(() => {
    const start = (page - 1) * perPage;
    return sortedSkills.slice(start, start + perPage);
  }, [sortedSkills, page]);

  const handlePopoverOpen = (event, email) => {
    setAnchorEl(event.currentTarget);
    setHoveredUser(users[email]);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    setHoveredUser(null);
  };

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
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Welcome to SkillSwap</Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Box mb={3} display="flex" flexWrap="wrap" gap={2}>
            <TextField label="Skill You Offer" value={offered} onChange={e => setOffered(e.target.value)} required fullWidth />
            <TextField label="Skill You Want" value={requested} onChange={e => setRequested(e.target.value)} required fullWidth />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select value={category} onChange={e => setCategory(e.target.value)} label="Category">
                <MenuItem value="design">Design</MenuItem>
                <MenuItem value="code">Code</MenuItem>
                <MenuItem value="teaching">Teaching</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <Button type="submit" variant="contained" color="primary">{editingSkill ? 'Update' : 'Add'}</Button>
          </Box>
        </form>

        <Box mb={3} display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <TextField label="Search Skills" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1 }} />
          <FormControl>
            <InputLabel>Sort</InputLabel>
            <Select value={sort} onChange={(e) => setSort(e.target.value)} label="Sort">
              <MenuItem value="offered">Alphabetical</MenuItem>
              <MenuItem value="newest">Newest</MenuItem>
            </Select>
          </FormControl>
          <Tabs value={tab} onChange={(e, val) => setTab(val)}>
            <Tab value="community" label="Community Skills" />
            <Tab value="mine" label="My Skills" />
          </Tabs>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>
        ) : (
          <>
            <Grid container spacing={3}>
              {paginatedSkills.map((skill, i) => {
                const profile = users[skill.email] || {};
                const online = profile.status === 'online';
                const lastSeen = profile.lastSeen ? dayjs(profile.lastSeen.toDate()).fromNow() : 'unknown';
                return (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <motion.div whileHover={{ scale: 1.03 }}>
                      <Card>
                        <CardContent>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar src={`https://ui-avatars.com/api/?name=${profile.name || skill.email}`} />
                            <Box onMouseEnter={(e) => handlePopoverOpen(e, skill.email)} onMouseLeave={handlePopoverClose}>
                              <Typography
                                variant="subtitle2"
                                sx={{ cursor: 'pointer' }}
                                onClick={() => navigate(`/profile/${skill.email}`)}
                              >
                                <strong>{profile.name || skill.email}</strong>
                                <Tooltip title={online ? 'Online' : `Last seen: ${lastSeen}`}>
                                  <Chip
                                    size="small"
                                    label={online ? '🟢 Online' : `🕓 ${lastSeen}`}
                                    color={online ? 'success' : 'default'}
                                    sx={{ ml: 1 }}
                                  />
                                </Tooltip>
                              </Typography>
                              <Popover open={Boolean(anchorEl)} anchorEl={anchorEl} onClose={handlePopoverClose}>
                                <Box p={2} maxWidth={250}>
                                  <Typography fontWeight="bold">{profile.name}</Typography>
                                  <Typography variant="body2">📍 {profile.location}</Typography>
                                  <Typography variant="body2">💬 {profile.bio}</Typography>
                                  <Typography variant="body2">🌟 Avg Rating: {profile.rating?.toFixed(1) || 'N/A'}</Typography>
                                </Box>
                              </Popover>
                            </Box>
                          </Box>
                          <Typography><strong>Offers:</strong> {getSkillIcon(skill.category)} {skill.offered}</Typography>
                          <Typography><strong>Wants:</strong> {getSkillIcon(skill.category)} {skill.requested}</Typography>
                          <Box mt={1} display="flex" gap={1}>
                            <Chip size="small" label={skill.availability || 'Anytime'} color="primary" />
                            <Chip size="small" label={skill.skillLevel || 'Intermediate'} variant="outlined" />
                          </Box>
                        </CardContent>
                        <Divider />
                        <CardActions>
                          {skill.email === userEmail ? (
                            <>
                              <IconButton onClick={() => setEditingSkill(skill.id)}><EditIcon /></IconButton>
                              <IconButton onClick={() => handleDelete(skill.id)}><DeleteIcon /></IconButton>
                            </>
                          ) : (
                            <>
                              <Button onClick={() => navigate(`/chat?partner=${skill.email}`)}>Chat</Button>
                              <Button onClick={() => navigate(`/review?user=${skill.email}`)}>Rate</Button>
                              <Rating value={profile.rating || 0} precision={0.5} readOnly size="small" />
                            </>
                          )}
                        </CardActions>
                      </Card>
                    </motion.div>
                  </Grid>
                );
              })}
            </Grid>
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination count={Math.ceil(sortedSkills.length / perPage)} page={page} onChange={(e, val) => setPage(val)} />
            </Box>
          </>
        )}
      </Container>
      <Toast message={toastMsg} visible={showToast} onHide={() => setShowToast(false)} type="info" />
    </>
  );
}
