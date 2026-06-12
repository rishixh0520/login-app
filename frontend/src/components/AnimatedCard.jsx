import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedCard({ children, className = '', delay = 0, onClick }) {
  return (
    <motion.div
      className={`card ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay }}
      whileHover={onClick ? { scale: 1.02 } : {}}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {children}
    </motion.div>
  );
}
