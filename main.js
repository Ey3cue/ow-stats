const fs = require('fs')
const path = require('path')

const express = require('express')
const sqlite3 = require('sqlite3')

const round = (val) => Math.round(val * 100) / 100

const main = async () => {
  const cfg = require(fs.existsSync(process.env.CONFIG) ? process.env.CONFIG : './config.js')

  const port = process.env.PORT || cfg.port || 5000
  
  const db = await new Promise((resolve, reject) => {
    const db = new sqlite3.Database(cfg.db, sqlite3.OPEN_READWRITE,
      (e) => e ? reject(e) : resolve(db))
  })

  const app = express()
  app.set('trust proxy', true)  // Behind nginx
  app.use(express.json())
  app.use((req, res, next) => {
    console.log(`${req.ip} ${req.method} ${req.originalUrl} ${JSON.stringify(req.body)}`);
    next()
  })
  app.use(express.static(path.join(__dirname, 'app')))

  // Options for form input
  const handleDbList = (column, table) => {
    return (req, res) => {
      db.all(`SELECT ${column} FROM ${table} ORDER BY ${column};`, (e, rows) => {
        if (e) {
          console.error(`Error selecting [${column}] from [${table}]: [${e}]`)
          res.sendStatus(500)
          return
        }
        res.json(rows.map((row) => row[column]))
      })
    }
  }
  app.get('/api/modes', handleDbList('Mode', 'Modes'))
  app.get('/api/maps', handleDbList('MapName', 'Maps'))
  app.get('/api/players', handleDbList('Player', 'Players'))

  // TVL; 0 = false, 1 = true, 2 = null
  const boolToInt = (v) => v === null ? 2 : (v ? 1 : 0)
  const intToBool = (v) => v === 2 ? null : v === 1

  app.get('/api/allowed', (req, res) => {
    res.json(cfg.allowAddsFrom.includes(req.ip))
  })
 
  // Add new game
  // POST /api/game { mode: string, map: string, players: string[], win: bool, onesided: bool|null }
  app.post('/api/game', (req, res) => {
    if (!cfg.allowAddsFrom.includes(req.ip)) {
      res.sendStatus(403)
      return
    }

    const date = new Date()
    date.setHours(date.getHours() - cfg.timezoneOffset)
    // Count anything after midnight to ~4am as part of the previous day's session
    if (date.getHours() <= 3) {
      date.setDate(date.getDate() - 1)
    }

    const { mode, map, players, win, onesided } = req.body

    if (typeof mode !== 'string' || typeof map !== 'string') {
      res.status(400).send('Mode and Map should be strings')
      return
    }
    if (Object.prototype.toString.call(players) !== '[object Array]') {
      res.status(400).send('Players should be an array')
      return
    }
    for (const player of players) {
      if (typeof player != 'string') {
        res.status(400).send('Players should be an array of strings')
        return
      }
    }
    while (players.length <= 5) {
      players.push(null)
    }
    if (typeof win !== 'boolean') {
      res.status(400).send('Win should be a boolean')
      return
    }
    if (typeof onesided !== 'boolean' && onesided !== null) {
      res.status(400).send('Onesided should be a boolean or null')
      return
    }

    db.run(`INSERT INTO Games (GameDate, Mode, Map, Player1, Player2, Player3, Player4, Player5, Win, OneSided)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        date.toISOString().substring(0, 10), mode, map, players[0], players[1], players[2], players[3], players[4], boolToInt(win), boolToInt(onesided),
        (e) => {
          if (e) {
            console.error(e)
            res.status(500).send(e)
          } else {
            res.sendStatus(200)
          }
        })
  })

  app.get('/api/plot/games', (req, res) => {
    db.all(`SELECT GameDate, Mode, Map, Player1, Player2, Player3, Player4, Player5, Win, OneSided
          FROM Games WHERE GameDate >= ? AND GameDate <= ? ORDER BY GameDate DESC`,
        req.query.start || '0000-00-00', req.query.end || '9999-99-99',
        (e, rows) => {
          if (e) {
            console.error(e)
            res.status(500).send(e)
          } else {
            const resRows = rows.map((row) => [
                  row.GameDate,
                  (row.Mode === 'Unknown' ? null : row.Mode),
                  (row.Map === 'Unknown' ? null : row.Map),
                  row.Player1,
                  row.Player2,
                  row.Player3,
                  row.Player4,
                  row.Player5,
                  intToBool(row.Win),
                  intToBool(row.OneSided)
                ])
            resRows.unshift(['Date', 'Mode', 'Map', 'Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Win', 'One-sided'])
            res.json(resRows)
          }
        })
  })

  app.get('/api/plot/wins-over-time', (req, res) => {
    const dates = []
    const winRates = []
    const totalGames = []
    db.each(`SELECT
          GameDate,
          SUM(CASE WHEN Win = 1 THEN 1 ELSE 0 END) As Wins, 
          COUNT(GameDate) AS TotalGames
          FROM Games WHERE GameDate >= ? AND GameDate <= ? GROUP BY GameDate ORDER BY GameDate;`,
        req.query.start || '0000-00-00', req.query.end || '9999-99-99',
        (e, row) => {
          if (e) {
            console.error(e)
            res.status(500).send(e)
          } else {
            dates.push(row.GameDate)
            winRates.push(round(row.Wins / row.TotalGames))
            totalGames.push(row.TotalGames)
          }
        },
        (e) => {
          if (e) {
            console.error(e)
            res.status(500).send(e)
          } else {
            res.json({ dates, winRates, totalGames })
          }
        })
  })

  app.get('/api/plot/fun-over-time', (req, res) => {
    const dates = []
    const fun = []
    db.each(`SELECT
          GameDate,
          SUM(CASE WHEN Win = 1 THEN 1 ELSE 0 END) As Wins,
          SUM(CASE WHEN WIN = 0 AND OneSided != 1 THEN 1 ELSE 0 END) AS NormalLosses,
          SUM(CASE WHEN Win = 0 AND OneSided = 1 THEN 1 ELSE 0 END) AS OneSidedLosses,
          COUNT(GameDate) AS TotalGames
          FROM Games WHERE GameDate >= ? AND GameDate <= ? GROUP BY GameDate ORDER BY GameDate;`,
          req.query.start || '0000-00-00', req.query.end || '9999-99-99',
        (e, row) => {
          if (e) {
            console.error(e)
            res.status(500).send(e)
          } else {
            dates.push(row.GameDate)
            fun.push(((row.Wins / (row.TotalGames + row.OneSidedLosses)) - 0.5) * row.TotalGames)
          }
        },
        (e) => {
          if (e) {
            console.error(e)
            res.status(500).send(e)
          } else {
            res.json({ dates, fun })
          }
        })
  })

  app.get('/api/plot/wins-over-group-size', (req, res) => {
    const wins = [0, 0, 0, 0, 0]
    const totalGames = [0, 0, 0, 0, 0]
    db.each(`SELECT Player1, Player2, Player3, Player4, Player5, Win
          FROM Games WHERE GameDate >= ? AND GameDate <= ?;`,
          req.query.start || '0000-00-00', req.query.end || '9999-99-99',
        (e, row) => {
          if (e) {
            console.error(e)
            res.status(500).send(e)
          } else {
            let groupSize = 0
            for (let i = 1; i <= 5; ++i) {
              if (row['Player' + i] != null) {
                groupSize++
              }
              if (row.Win == 1) {
                wins[groupSize - 1]++
              }
              totalGames[groupSize - 1]++
            }
          }
        },
        (e) => {
          if (e) {
            console.error(e)
            res.status(500).send(e)
          } else {
            const winRates = []
            for (let i = 0; i < wins.length; i++) {
              winRates[i] = round(wins[i] / totalGames[i])
            }
            res.json({ groupSize: [1, 2, 3, 4, 5], winRates, totalGames })
          }
        }
    )
  })

  app.get('/api/plot/wins-over-mode', (req, res) => {
    const modes = []
    const winRates = []
    const totalGames = []

    db.each(`SELECT
          Mode,
          SUM(CASE WHEN Win = 1 THEN 1 ELSE 0 END) As Wins,
          COUNT(GameDate) AS TotalGames
          FROM Games WHERE GameDate >= ? AND GameDate <= ? GROUP BY Mode ORDER BY Mode;`,
          req.query.start || '0000-00-00', req.query.end || '9999-99-99',
        (e, row) => {
          if (e) {
            console.error(e)
            res.status(500).send(e)
          } else {
            modes.push(row.Mode)
            winRates.push(round(row.Wins / row.TotalGames))
            totalGames.push(row.TotalGames)
          }
        },
        (e) => {
          if (e) {
            console.error(e)
            res.status(500).send(e)
          } else {
            res.json({ modes, winRates, totalGames })
          }
        })
  })

  process.on('SIGINT', () => {
    console.log('Closing DB')
    db.close(() => process.exit())
  })

  app.listen(port, () => console.log(`Running on port [${port}]`))
}

main()
