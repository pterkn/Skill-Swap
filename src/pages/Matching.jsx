import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
  CardActions,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import {
  collection,
  query,
  onSnapshot,
  getDocs,
  addDoc
} from 'firebase/firestore';
import Header from '../components/Header';
import CodeIcon from '@mui/icons-material/Code';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import SchoolIcon from '@mui/icons-material/School';
import BuildIcon from '@mui/icons-material/Build';

export default function Matching() {
  const [skills, setSkills] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [mutualOnly, setMutualOnly] = useState(false);
  const navigate = useNavigate();
  const currentUser = auth.currentUser?.email;

  useEffect(() => {
    const q = query(collection(db, 'skills'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((doc) => doc.data());
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
  }, []);

  const currentUserSkills = skills.filter(s => s.email === currentUser);

  const matched = skills.filter(s => {
    if (s.email === currentUser) return false;

    const offeredToMe = currentUserSkills.some(m =>
      m.requested.toLowerCase() === s.offered.toLowerCase()
    );

    const wantsWhatIOffer = currentUserSkills.some(m =>
      m.offered.toLowerCase() === s.requested.toLowerCase()
    );

    const mutual = offeredToMe && wantsWhatIOffer;
    if (mutualOnly && !mutual) return false;

    const categoryMatch = category === 'all' || s.category === category;

    const textMatch = [s.offered, s.requested].join(' ').toLowerCase().includes(search.toLowerCase());

    return (offeredToMe || wantsWhatIOffer) && categoryMatch && textMatch;
  });

  const getSkillIcon = (cat) => {
    if (cat === 'code') return <CodeIcon fontSize="small" sx={{ mr: 1 }} />;
    if (cat === 'design') return <DesignServicesIcon fontSize="small" sx={{ mr: 1 }} />;
    if (cat === 'teaching') return <SchoolIcon fontSize="small" sx={{ mr: 1 }} />;
    return <BuildIcon fontSize="small" sx={{ mr: 1 }} />;
  };

  const handleSaveMatch = async (matchEmail) => {
    try {
      await addDoc(collection(db, 'savedMatches'), {
        user: currentUser,
        match: matchEmail,
        savedAt: new Date()
      });
      alert('Match saved!');
    } catch (err) {
      alert('Failed to save match.');
    }
  };

  return (
    <>
      <Header showLogout={true} />
      <Container maxWidth="md">
        <Box mt={4} textAlign="center">
          <Typography variant="h4">Skill Matches</Typography>
        </Box>

        <Box display="flex" justifyContent="center" gap={2} mt={4} mb={3} flexWrap="wrap">
          <FormControl>
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              label="Category"
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="code">Code</MenuItem>
              <MenuItem value="design">Design</MenuItem>
              <MenuItem value="teaching">Teaching</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          <TextField
            placeholder="Search skills"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <FormControlLabel
            control={<Checkbox checked={mutualOnly} onChange={(e) => setMutualOnly(e.target.checked)} />}
            label="Show only mutual matches"
          />
        </Box>

        <Grid container spacing={3}>
          {matched.length === 0 ? (
            <Grid item xs={12}>
              <Typography>No matches found</Typography>
            </Grid>
          ) : (
            matched.map((s, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Avatar
                        src={`https://ui-avatars.com/api/?name=${s.email}`}
                        sx={{ width: 40, height: 40, mr: 1 }}
                      />
                      <Box>
                        <Typography variant="subtitle1">
                          <strong>{profiles[s.email]?.name || s.email}</strong>
                        </Typography>
                        {profiles[s.email]?.bio && (
                          <Typography variant="caption">{profiles[s.email].bio}</Typography>
                        )}
                      </Box>
                    </Box>
                    <Typography>
                      <strong>Offers:</strong> {getSkillIcon(s.category)} {s.offered}
                    </Typography>
                    <Typography>
                      <strong>Wants:</strong> {getSkillIcon(s.category)} {s.requested}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate(`/chat?partner=${s.email}`)}>Chat</Button>
                    <Button size="small" onClick={() => navigate(`/review?user=${s.email}`)}>Rate</Button>
                    <Button size="small" onClick={() => handleSaveMatch(s.email)}>Save</Button>
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
