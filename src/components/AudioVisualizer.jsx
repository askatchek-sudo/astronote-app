import React, { useState, useEffect } from 'react';

const AudioVisualizer = ({ isPlaying, color = "var(--cyan)" }) => {
  const [heights, setHeights] = useState([30, 50, 40, 60, 35]);
  
  useEffect(() => {
    if (!isPlaying) {
      setHeights([30, 30, 30, 30, 30]);
      return;
    }
    
    const interval = setInterval(() => {
      setHeights([
        Math.random() * 80 + 20,
        Math.random() * 80 + 20,
        Math.random() * 80 + 20,
        Math.random() * 80 + 20,
        Math.random() * 80 + 20
      ]);
    }, 150);
    
    return () => clearInterval(interval);
  }, [isPlaying]);
  
  return (
    <div style={{ 
      display: "flex", 
      alignItems: "flex-end", 
      gap: "2px", 
      height: "20px",
      width: "28px",
      justifyContent: "center"
    }}>
      {heights.map((height, index) => (
        <div
          key={index}
          style={{
            width: "4px",
            background: color,
            borderRadius: "2px",
            height: `${height}%`,
            transition: "height 0.15s ease",
            minHeight: "4px"
          }}
        />
      ))}
    </div>
  );
};

export default AudioVisualizer;