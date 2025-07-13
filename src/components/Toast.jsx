
import React, { useEffect } from 'react';
import '../style.css';

export default function Toast({ message, visible, type = 'info', onHide }) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onHide();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onHide]);

  if (!visible) return null;

  return (
    <div className={`toast ${type}`} role="alert">
      {message}
    </div>
  );
}
