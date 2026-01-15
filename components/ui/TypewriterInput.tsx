"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface TypewriterInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const PROMPTS = [
  "e.g., Fix my Smart Contract...",
  "e.g., Design a Logo...",
  "e.g., Write a Twitter Bot...",
];

export function TypewriterInput({
  value,
  onChange,
  placeholder = "Describe your bounty",
  className = "",
}: TypewriterInputProps) {
  const [displayText, setDisplayText] = useState("");
  const [promptIndex, setPromptIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isFocused || value) return;

    const currentPrompt = PROMPTS[promptIndex];
    const speed = isDeleting ? 30 : 50;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentPrompt.length) {
          setDisplayText(currentPrompt.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setPromptIndex((prev) => (prev + 1) % PROMPTS.length);
        }
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, promptIndex, isFocused, value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={isFocused || value ? placeholder : displayText}
        className={`
          w-full p-4 border-4 border-black bg-white text-black
          placeholder:text-gray-400 placeholder:font-semibold
          focus:outline-none focus:ring-0
          transition-all duration-100
          ${className}
        `}
        style={{
          boxShadow: "4px 4px 0px 0px #000000",
        }}
      />
    </motion.div>
  );
}
