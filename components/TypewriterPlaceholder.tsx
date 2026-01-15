"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface TypewriterPlaceholderProps {
  phrases: string[];
  speed?: number;
  pauseDuration?: number;
}

export function TypewriterPlaceholder({
  phrases,
  speed = 50,
  pauseDuration = 2000,
}: TypewriterPlaceholderProps) {
  const [displayText, setDisplayText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting && charIndex < currentPhrase.length) {
      // Typing
      timeout = setTimeout(() => {
        setDisplayText(currentPhrase.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, speed);
    } else if (isDeleting && charIndex > 0) {
      // Deleting
      timeout = setTimeout(() => {
        setDisplayText(currentPhrase.slice(0, charIndex - 1));
        setCharIndex(charIndex - 1);
      }, speed / 2);
    } else if (!isDeleting && charIndex === currentPhrase.length) {
      // Pause before deleting
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, pauseDuration);
    } else if (isDeleting && charIndex === 0) {
      // Move to next phrase
      setIsDeleting(false);
      setPhraseIndex((phraseIndex + 1) % phrases.length);
    }

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, phraseIndex, phrases, speed, pauseDuration]);

  return (
    <span>
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="inline-block w-0.5 h-5 bg-brutal-black ml-1"
      />
    </span>
  );
}
