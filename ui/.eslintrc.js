module.exports = {
  extends: ["next", "next/core-web-vitals"],
  rules: {
    "react/no-unescaped-entities": 0,
    "react-hooks/exhaustive-deps": 0,
  },
  settings: {
    next: {
      rootDir: "ui",
    },
  },
}
