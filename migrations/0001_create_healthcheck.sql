CREATE TABLE IF NOT EXISTS healthcheck (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  ip        TEXT,
  country   TEXT,
  user_agent TEXT,
  ray_id    TEXT,
  timestamp TEXT NOT NULL
);
