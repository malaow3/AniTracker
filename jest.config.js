module.exports = {
  "roots": [
    "<rootDir>"
  ],
  "testMatch": [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/?(*.)+(spec|test).+(ts|tsx|js)"
  ],
  "testPathIgnorePatterns": [
    "/node_modules/",
    "/dist/"
  ],
  "transform": {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
}