import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Avatar,
  TextField,
  Button,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Header from '../components/Header';

export default function Profile() {
  const [userData, setUserData] = useState({ name: '', bio: '', skills: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const fetchProfileAndSkills = async () => {
      const ref = doc(db, 'profiles', user.email);
      const snap = await getDoc(ref);
      let data = snap.exists() ? snap.data() : {};

      const skillsSnap = await getDocs(
        query(collection(db, 'skills'), where('email', '==', user.email))
      );
      const offeredSkills = [...new Set(skillsSnap.docs.map(doc => doc.data().offered))];
      const skillsStr = offeredSkills.join(', ');

      setUserData({
        name: data.name || '',
        bio: data.bio || '',
        skills: data.skills || skillsStr
      });

      setLoading(false);
    };

    fetchProfileAndSkills();
  }, [user]);

  const handleChange = (e) => {
    setUserData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await setDoc(doc(db, 'profiles', user.email), userData);
    setSaving(false);
    setSnackOpen(true);
  };

  return (
    <>
      <Header showLogout={true} />
      <Container maxWidth="sm">
        <Box mt={4} textAlign="center">
          <Avatar
            src={`https://ui-avatars.com/api/?name=${user?.email}`}
            sx={{ width: 100, height: 100, margin: 'auto', mb: 2 }}
          />
          <Typography variant="h5">My Profile</Typography>
        </Box>

        {loading ? (
          <Box mt={4} textAlign="center">
            <CircularProgress />
          </Box>
        ) : (
          <Box component="form" mt={3} display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Name"
              name="name"
              value={userData.name}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Bio"
              name="bio"
              multiline
              rows={3}
              value={userData.bio}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Skills"
              name="skills"
              placeholder="e.g. Design, Python, Cooking"
              value={userData.skills}
              onChange={handleChange}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        )}

        <Snackbar
          open={snackOpen}
          autoHideDuration={3000}
          onClose={() => setSnackOpen(false)}
          message="✅ Profile updated!"
        />
      </Container>
    </>
  );
}
