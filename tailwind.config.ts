import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brutal: {
          black: "#000000",
          white: "#FFFFFF",
          green: "#00FF00",
          pink: "#FF00FF",
          yellow: "#FFFF00",
        },
      },
      boxShadow: {
        brutal: "4px 4px 0px 0px #000000",
        "brutal-lg": "6px 6px 0px 0px #000000",
        "brutal-hover": "6px 6px 0px 0px #000000",
        "brutal-active": "2px 2px 0px 0px #000000",
      },
      borderWidth: {
        brutal: "4px",
        "brutal-lg": "6px",
      },
      fontFamily: {
        brutal: ["system-ui", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
