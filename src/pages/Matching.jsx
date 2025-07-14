import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  CircularProgress
} from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import {
  collection,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';

import CodeIcon from '@mui/icons-material/Code';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import SchoolIcon from '@mui/icons-material/School';
import BuildIcon from '@mui/icons-material/Build';

import Header from '../components/Header';
import Toast from '../components/Toast';

export default function Matching() {
  const [skills, setSkills] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [onlyMutual, setOnlyMutual] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);

  const userEmail = auth.currentUser?.email;
  const navigate = useNavigate();

  useEffect(() => {
    if (!userEmail) return;

    const q = query(collection(db, 'skills'), orderBy('offered'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((doc) => doc.data());
      setSkills(list);
      setLoading(false);
    });

    return () => unsub();
  }, [userEmail]);

  const getIcon = (cat) => {
    if (cat === 'code') return <CodeIcon fontSize="small" sx={{ mr: 1 }} />;
    if (cat === 'design') return <DesignServicesIcon fontSize="small" sx={{ mr: 1 }} />;
    if (cat === 'teaching') return <SchoolIcon fontSize="small" sx={{ mr: 1 }} />;
    return <BuildIcon fontSize="small" sx={{ mr: 1 }} />;
  };

  const filteredMatches = useMemo(() => {
    return skills.filter((skill) => {
      if (skill.email === userEmail) return false;

      const matchSearch =
        skill.offered.toLowerCase().includes(search.toLowerCase()) ||
        skill.requested.toLowerCase().includes(search.toLowerCase());

      const matchCategory = category === 'all' || skill.category === category;

      const mutual = skills.some(
        (s) =>
          s.email === userEmail &&
          s.offered.toLowerCase() === skill.requested.toLowerCase() &&
          s.requested.toLowerCase() === skill.offered.toLowerCase()
      );

      return matchSearch && matchCategory && (!onlyMutual || mutual);
    });
  }, [skills, search, category, onlyMutual, userEmail]);

  return (
    <>
      <Header showLogout={true} />
      <Container maxWidth="md">
        <Box mt={4} mb={3} textAlign="center">
          <Typography variant="h4">Find Matching Skills</Typography>
        </Box>

        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2} mb={3}>
          <TextField
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              label="Category"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="design">Design</MenuItem>
              <MenuItem value="code">Code</MenuItem>
              <MenuItem value="teaching">Teaching</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={onlyMutual}
                onChange={() => setOnlyMutual(!onlyMutual)}
              />
            }
            label="Mutual Only"
          />
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" mt={6}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredMatches.length === 0 ? (
              <Grid item xs={12}>
                <Typography>No matches found.</Typography>
              </Grid>
            ) : (
              filteredMatches.map((skill, i) => (
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
                            alt="avatar"
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              marginRight: 10
                            }}
                          />
                          <Typography variant="subtitle1">{skill.email}</Typography>
                        </Box>

                        <Typography>
                          <strong>Offers:</strong> {getIcon(skill.category)} {skill.offered}
                        </Typography>
                        <Typography>
                          <strong>Wants:</strong> {getIcon(skill.category)} {skill.requested}
                        </Typography>
                      </CardContent>

                      <Divider />

                      <CardActions>
                        <Button size="small" onClick={() => navigate(`/chat?partner=${skill.email}`)}>
                          Chat
                        </Button>
                        <Button size="small" onClick={() => navigate(`/review?user=${skill.email}`)}>
                          Rate
                        </Button>
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
        type="info"
        onHide={() => setShowToast(false)}
      />
    </>
  );
}
