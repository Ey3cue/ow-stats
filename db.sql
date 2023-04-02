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


CREATE TABLE IF NOT EXISTS MapTypes(
  MapType TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO MapTypes (MapType) VALUES ('Unknown');
INSERT OR IGNORE INTO MapTypes (MapType) VALUES ('Escort');
INSERT OR IGNORE INTO MapTypes (MapType) VALUES ('Assault');
INSERT OR IGNORE INTO MapTypes (MapType) VALUES ('Capture the Flag');
INSERT OR IGNORE INTO MapTypes (MapType) VALUES ('Control');
INSERT OR IGNORE INTO MapTypes (MapType) VALUES ('Deathmatch');
INSERT OR IGNORE INTO MapTypes (MapType) VALUES ('Elimination');
INSERT OR IGNORE INTO MapTypes (MapType) VALUES ('Hybrid');
INSERT OR IGNORE INTO MapTypes (MapType) VALUES ('Push');

CREATE TABLE IF NOT EXISTS Maps(
  MapName TEXT PRIMARY KEY,
  MapType INTEGER,

  FOREIGN KEY (MapType) REFERENCES MapTypes(MapType)
);
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Unknown', 'Unknown');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Antarctic Peninsula', 'Control');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Ayutthaya', 'Capture the Flag');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Black Forest', 'Elimination');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Blizzard World', 'Hybrid');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Busan', 'Control');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Castillo', 'Elimination');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Chateau Guillard', 'Deathmatch');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Circuit Royal', 'Escort');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Colosseo', 'Push');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Dorado', 'Escort');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Ecopoint: Antarctica', 'Elimination');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Eichenwalde', 'Hybrid');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Esperanca', 'Push');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Hanamura', 'Assault');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Havana', 'Escort');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Hollywood', 'Hybrid');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Horizon Lunar Colony', 'Assault');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Ilios', 'Control');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Junkertown', 'Escort');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Kanezaka', 'Deathmatch');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('King''s Row', 'Hybrid');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Lijiang Tower', 'Control');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Malevento', 'Deathmatch');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Midtown', 'Hybrid');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Necropolis', 'Elimination');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Nepal', 'Control');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('New Queen Street', 'Push');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Numbani', 'Hybrid');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Oasis', 'Control');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Paraiso', 'Hybrid');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Paris', 'Assault');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Petra', 'Deathmatch');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Rialto', 'Escort');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Route 66', 'Escort');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Shambali', 'Escort');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Temple of Anubis', 'Assault');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Volskaya Industries', 'Assault');
INSERT OR IGNORE INTO Maps (MapName, MapType) VALUES ('Watchpoint: Gibraltar', 'Escort');

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
  FOREIGN KEY(Map) REFERENCES Maps(MapName),
  FOREIGN KEY(Player1) REFERENCES Players(Player),
  FOREIGN KEY(Player2) REFERENCES Players(Player),
  FOREIGN KEY(Player3) REFERENCES Players(Player),
  FOREIGN KEY(Player4) REFERENCES Players(Player),
  FOREIGN KEY(Player5) REFERENCES Players(Player)
);