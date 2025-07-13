
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase';
import '../style.css';

export default function Header({ showLogout = false }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="header-left">
        <img src="/logo.png" alt="SkillSwap Logo" className="logo" />
        <h1 className="site-title">
          <Link to="/dashboard">SkillSwap</Link>
        </h1>
      </div>

      {showLogout && (
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      )}
    </header>
  );
}
