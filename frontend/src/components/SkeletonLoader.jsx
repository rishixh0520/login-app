import React from 'react';
import { motion } from 'framer-motion';

export default function SkeletonLoader({ type = 'card', count = 1 }) {
  const skeletons = Array(count).fill(0);

  return (
    <>
      {skeletons.map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: 0.7 }}
          transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }}
          style={{
            background: 'var(--border-color)',
            borderRadius: type === 'circle' ? '50%' : '8px',
            width: type === 'circle' ? '40px' : type === 'text' ? '100%' : '100%',
            height: type === 'circle' ? '40px' : type === 'text' ? '20px' : '150px',
            marginBottom: '10px'
          }}
        />
      ))}
    </>
  );
}
