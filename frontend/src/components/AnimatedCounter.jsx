import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function AnimatedCounter({ value, prefix = '', suffix = '', duration = 1 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    let endStr = value ? value.toString().replace(/,/g, '') : '0';
    let end = parseFloat(endStr) || 0;
    
    if (start === end) {
      setDisplayValue(end);
      return;
    }
    
    let totalMilSecDur = duration * 1000;
    let incrementTime = (totalMilSecDur / end);
    if (incrementTime < 10) incrementTime = 30; // Max 30ms update rate

    let timer = setInterval(() => {
      start += end > 100 ? Math.ceil(end / (totalMilSecDur/incrementTime)) : 1;
      
      if (start >= end) {
        clearInterval(timer);
        setDisplayValue(end);
      } else {
        setDisplayValue(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  const formattedValue = typeof value === 'string' && value.includes(',') 
    ? displayValue.toLocaleString('en-IN') 
    : displayValue;

  return (
    <motion.span
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {prefix}{formattedValue}{suffix}
    </motion.span>
  );
}
