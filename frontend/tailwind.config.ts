import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Toss Blue — 유일한 인터랙션 색상
        blue: {
          50: "#e8f3ff",
          500: "#3182f6",
          600: "#2272eb",
        },
        // Toss 그레이 스케일 (warm undertone)
        grey: {
          50: "#f9fafb",
          100: "#f2f4f6",
          200: "#e5e8eb",
          300: "#d1d6db",
          400: "#b0b8c1",
          500: "#8b95a1",
          600: "#6b7684",
          700: "#4e5968",
          800: "#333d4b",
          900: "#191f28",
        },
        // 시맨틱
        success: "#03b26c",
        error: "#f04452",
        warning: "#fe9800",
      },
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "Noto Sans KR",
          "sans-serif",
        ],
        mono: ["SF Mono", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      borderRadius: {
        compact: "4px",
        sm: "8px",
        DEFAULT: "12px",
        lg: "16px",
        pill: "9999px",
      },
      boxShadow: {
        subtle: "0px 1px 3px rgba(0,0,0,0.06)",
        card: "0px 2px 8px rgba(0,0,0,0.08)",
        elevated: "0px 4px 12px rgba(0,0,0,0.12)",
        modal: "0px 8px 24px rgba(0,0,0,0.16)",
      },
      transitionTimingFunction: {
        enter: "cubic-bezier(0.0, 0.0, 0.2, 1)",
        exit: "cubic-bezier(0.4, 0.0, 1, 1)",
        standard: "cubic-bezier(0.4, 0.0, 0.2, 1)",
      },
      transitionDuration: {
        fast: "150ms",
        standard: "250ms",
        slow: "400ms",
      },
    },
  },
  plugins: [],
};

export default config;
