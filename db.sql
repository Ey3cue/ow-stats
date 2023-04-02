-- Created for Sqlite3

CREATE TABLE IF NOT EXISTS Queues(
  Queue TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO Queues (Queue) VALUES ('Unknown');
INSERT OR IGNORE INTO Queues (Queue) VALUES ('Quick Play: Open Queue');
INSERT OR IGNORE INTO Queues (Queue) VALUES ('Quick Play: Mystery');
INSERT OR IGNORE INTO Queues (Queue) VALUES ('Quick Play: Role Queue');
INSERT OR IGNORE INTO Queues (Queue) VALUES ('Competitive: Mystery');
INSERT OR IGNORE INTO Queues (Queue) VALUES ('Competitive: Open Queue');
INSERT OR IGNORE INTO Queues (Queue) VALUES ('Competitive: Role Queue');


CREATE TABLE IF NOT EXISTS Modes(
  Mode TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO Modes (Mode) VALUES ('Unknown');
INSERT OR IGNORE INTO Modes (Mode) VALUES ('Escort');
INSERT OR IGNORE INTO Modes (Mode) VALUES ('Assault');
INSERT OR IGNORE INTO Modes (Mode) VALUES ('Capture the Flag');
INSERT OR IGNORE INTO Modes (Mode) VALUES ('Control');
INSERT OR IGNORE INTO Modes (Mode) VALUES ('Deathmatch');
INSERT OR IGNORE INTO Modes (Mode) VALUES ('Elimination');
INSERT OR IGNORE INTO Modes (Mode) VALUES ('Hybrid');
INSERT OR IGNORE INTO Modes (Mode) VALUES ('Push');

CREATE TABLE IF NOT EXISTS Maps(
  Map TEXT PRIMARY KEY,
  Mode TEXT,

  FOREIGN KEY (Mode) REFERENCES Modes(Mode)
);
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Unknown', 'Unknown');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Antarctic Peninsula', 'Control');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Ayutthaya', 'Capture the Flag');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Black Forest', 'Elimination');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Blizzard World', 'Hybrid');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Busan', 'Control');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Castillo', 'Elimination');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Chateau Guillard', 'Deathmatch');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Circuit Royal', 'Escort');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Colosseo', 'Push');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Dorado', 'Escort');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Ecopoint: Antarctica', 'Elimination');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Eichenwalde', 'Hybrid');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Esperanca', 'Push');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Hanamura', 'Assault');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Havana', 'Escort');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Hollywood', 'Hybrid');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Horizon Lunar Colony', 'Assault');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Ilios', 'Control');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Junkertown', 'Escort');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Kanezaka', 'Deathmatch');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('King''s Row', 'Hybrid');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Lijiang Tower', 'Control');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Malevento', 'Deathmatch');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Midtown', 'Hybrid');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Necropolis', 'Elimination');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Nepal', 'Control');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('New Queen Street', 'Push');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Numbani', 'Hybrid');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Oasis', 'Control');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Paraiso', 'Hybrid');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Paris', 'Assault');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Petra', 'Deathmatch');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Rialto', 'Escort');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Route 66', 'Escort');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Shambali', 'Escort');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Temple of Anubis', 'Assault');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Volskaya Industries', 'Assault');
INSERT OR IGNORE INTO Maps (Map, Mode) VALUES ('Watchpoint: Gibraltar', 'Escort');

CREATE TABLE IF NOT EXISTS Players(
  Player TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS Games(
  GameId INTEGER PRIMARY KEY AUTOINCREMENT,
  GameDate TEXT NOT NULL,
  Queue TEXT NOT NULL,
  Map TEXT NOT NULL,
  Player1 TEXT,
  Player2 TEXT,
  Player3 TEXT,
  Player4 TEXT,
  Player5 TEXT,
  Win INTEGER CHECK (Win == 0 OR Win == 1),
  OneSided INTEGER CHECK (OneSided == 0 OR OneSided == 1 OR OneSided == 2),

  FOREIGN KEY(Queue) REFERENCES Queues(Queue),
  FOREIGN KEY(Map) REFERENCES Maps(Map),
  FOREIGN KEY(Player1) REFERENCES Players(Player),
  FOREIGN KEY(Player2) REFERENCES Players(Player),
  FOREIGN KEY(Player3) REFERENCES Players(Player),
  FOREIGN KEY(Player4) REFERENCES Players(Player),
  FOREIGN KEY(Player5) REFERENCES Players(Player)
);