"use client";

import { motion } from "framer-motion";

interface CurtainTransitionProps {
  show: boolean;
}

export function CurtainTransition({ show }: CurtainTransitionProps) {
  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        pointerEvents: 'none', 
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'row'
      }}
    >
      {/* Left Curtain */}
      <motion.div 
        initial={{ x: "-100%" }}
        animate={{ x: show ? "0%" : "-100%" }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }} // smooth ease
        style={{ 
          width: "50%", 
          height: "100%", 
          background: "linear-gradient(90deg, #370b0b 0%, #741b1b 100%)", // Deep Velvet Red
          boxShadow: "10px 0 50px rgba(0,0,0,0.8)",
          position: 'relative'
        }} 
      >
        {/* Fabric Texture / Folds simulation */}
        <div style={{
            position: 'absolute', inset: 0, 
            background: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.2) 40px, rgba(0,0,0,0.2) 80px)',
            opacity: 0.3
        }} />
      </motion.div>

      {/* Right Curtain */}
      <motion.div 
        initial={{ x: "100%" }}
        animate={{ x: show ? "0%" : "100%" }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        style={{ 
          width: "50%", 
          height: "100%", 
          background: "linear-gradient(-90deg, #370b0b 0%, #741b1b 100%)",
          boxShadow: "-10px 0 50px rgba(0,0,0,0.8)",
          position: 'relative'
        }} 
      >
        <div style={{
            position: 'absolute', inset: 0, 
            background: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.2) 40px, rgba(0,0,0,0.2) 80px)',
            opacity: 0.3
        }} />
      </motion.div>
    </div>
  );
}
