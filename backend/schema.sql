-- Levelroot database schema

CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  username      TEXT NOT NULL UNIQUE,
  password      TEXT NOT NULL,
  display_name  TEXT,
  bio           TEXT,
  avatar        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE games (
  id              TEXT PRIMARY KEY,
  rawg_id         INTEGER NOT NULL UNIQUE,
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  cover           TEXT,
  release_date    DATE,
  description     TEXT,
  average_rating  REAL,
  rating_count    INTEGER NOT NULL DEFAULT 0,
  genres          TEXT[],
  developers      TEXT[],
  publishers      TEXT[],
  -- ---
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE logs (
  id                 TEXT PRIMARY KEY,
  user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id            TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  status             TEXT NOT NULL CHECK (status IN ('backlog','playing','beat','completed','dropped')),
  rating             REAL CHECK (rating IS NULL OR (rating >= 0.5 AND rating <= 5)),
  review             TEXT,
  quick_take         TEXT,
  played_on          TEXT,
  started_at         TIMESTAMPTZ,
  beat_at            TIMESTAMPTZ,
  completed_at       TIMESTAMPTZ,
  is_replay          BOOLEAN NOT NULL DEFAULT FALSE,
  contains_spoilers  BOOLEAN NOT NULL DEFAULT FALSE,
  like_count         INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX logs_user_id_idx ON logs(user_id);
CREATE INDEX logs_game_id_idx ON logs(game_id);
CREATE INDEX logs_status_idx ON logs(status);

CREATE TABLE lists (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  slug         TEXT NOT NULL,
  description  TEXT,
  is_ranked    BOOLEAN NOT NULL DEFAULT FALSE,
  is_public    BOOLEAN NOT NULL DEFAULT TRUE,
  like_count   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, slug)
);

CREATE TABLE list_items (
  id        TEXT PRIMARY KEY,
  list_id   TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  game_id   TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  position  INTEGER NOT NULL,
  UNIQUE (list_id, position)
);

CREATE TABLE follows (
  id            TEXT PRIMARY KEY,
  follower_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE TABLE favorites (
  id        TEXT PRIMARY KEY,
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id   TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  position  INTEGER NOT NULL CHECK (position BETWEEN 1 AND 5),
  UNIQUE (user_id, position),
  UNIQUE (user_id, game_id)
);