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
  app.get('/api/queues', handleDbList('Queue', 'Queues'))
  app.get('/api/maps', handleDbList('Map', 'Maps'))
  app.get('/api/players', handleDbList('Player', 'Players'))

  app.get('/api/seasons', (req, res) => {
    db.all('SELECT id, begin, end FROM Seasons ORDER BY id;',
        (e, rows) => {
          if (e) {
            console.error(`Error selecting from [Seasons]: [${e}]`)
            res.sendStatus(500)
            return
          }
          res.json(rows)
        })
  })
  
  app.get('/api/allowed', (req, res) => {
    res.json(cfg.allowAddsFrom.includes(req.ip))
  })

  // TVL; 0 = false, 1 = true, 2 = null
  const boolToInt = (v) => v === null ? 2 : (v ? 1 : 0)
  const intToBool = (v) => v === 2 ? null : v === 1
 
  // Add new game
  // POST /api/game { queue: string, map: string, players: string[], win: bool, onesided: bool|null }
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

    const { queue, map, players, win, onesided } = req.body

    if (typeof queue !== 'string' || typeof map !== 'string') {
      res.status(400).send('Queue and Map should be strings')
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

    db.run(`INSERT INTO Games (GameDate, Queue, Map, Player1, Player2, Player3, Player4, Player5, Win, OneSided)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        date.toISOString().substring(0, 10), queue, map, players[0], players[1], players[2], players[3], players[4], boolToInt(win), boolToInt(onesided),
        (e) => {
          if (e) {
            console.error(e)
            res.status(500).send(e)
          } else {
            res.sendStatus(200)
          }
        })
  })

  app.get('/api/games', (req, res) => {
    const games = []
    db.each('SELECT GameDate, Queue, Map, Player1, Player2, Player3, Player4, Player5, Win, OneSided FROM Games',
        (e, row) => {
          if (e) {
            console.error(e)
            res.status(500).send(e)
          } else {
            const { GameDate, Queue, Map, Win, OneSided } = row

            const players = []
            for (let i = 1; i <= 5; ++i) {
              const player = row[`Player${i}`]
              if (player) {
                players.push(player)
              }
            }

            games.push([GameDate, Queue, Map, players, intToBool(Win), intToBool(OneSided)])
          }
        },
        (e) => {
          if (e) {
            console.error(e)
            res.status(500).send(e)
          } else {
            res.json(games)
          }
        })
  })

  app.get('/api/plot/games', (req, res) => {
    db.all(`SELECT GameDate, Queue, Map, Player1, Player2, Player3, Player4, Player5, Win, OneSided
          FROM Games WHERE GameDate >= ? AND GameDate <= ? ORDER BY GameDate DESC`,
        req.query.begin || '0000-00-00', req.query.end || '9999-99-99',
        (e, rows) => {
          if (e) {
            console.error(e)
            res.status(500).send(e)
          } else {
            const resRows = rows.map((row) => {
                const players = []
                for (let i = 1; i <= 5; ++i) {
                  const player = row['Player' + i]
                  if (player) {
                    players.push(player)
                  }
                }

                return [
                  row.GameDate,
                  (row.Queue === 'Unknown' ? null : row.Queue),
                  (row.Map === 'Unknown' ? null : row.Map),
                  players,
                  intToBool(row.Win),
                  intToBool(row.OneSided)
                ]
              })
            res.json(resRows)
          }
        })
  })

  app.get('/api/plot/over-time', (req, res) => {
    const dates = []
    const winRates = []
    const totalGames = []
    const fun = []
    db.each(`SELECT
          GameDate,
          SUM(CASE WHEN Win = 1 THEN 1 ELSE 0 END) As Wins,
          SUM(CASE WHEN WIN = 0 AND OneSided != 1 THEN 1 ELSE 0 END) AS NormalLosses,
          SUM(CASE WHEN Win = 0 AND OneSided = 1 THEN 1 ELSE 0 END) AS OneSidedLosses,
          COUNT(GameDate) AS TotalGames
          FROM Games WHERE GameDate >= ? AND GameDate <= ? GROUP BY GameDate ORDER BY GameDate;`,
        req.query.begin || '0000-00-00', req.query.end || '9999-99-99',
        (e, row) => {
          if (e) {
            console.error(e)
            res.status(500).send(e)
          } else {
            dates.push(row.GameDate)
            winRates.push(round(row.Wins / row.TotalGames))
            totalGames.push(row.TotalGames)
            fun.push(((row.Wins / (row.TotalGames + row.OneSidedLosses)) - 0.5) * row.TotalGames)
          }
        },
        (e) => {
          if (e) {
            console.error(e)
            res.status(500).send(e)
          } else {
            res.json({ dates, winRates, totalGames, fun })
          }
        })
  })

  app.get('/api/plot/streaks', (req, res) => {
    const dates = []
    const winStreaks = []
    const loseStreaks = []

    const minStreak = 3

    let winDate = null
    let winStreak = 0
    let wonLast = null
    let loseDate = null
    let loseStreak = 0
    let lostLast = null

    const endWinningStreak = () => {
      if (winStreak >= minStreak) {
        if (wonLast && winStreak > 0) {
          // End of winning streak, add to data
          if (dates[dates.length - 1] === winDate && winStreaks[winStreaks.length - 1] == null) {
            winStreaks[winStreaks.length - 1] = winStreak
          } else {
            dates.push(winDate)
            winStreaks.push(winStreak)
            loseStreaks.push(null)
          }
        }
      }
      winDate = null
      winStreak = 0
      wonLast = false
    }

    const endLosingStreak = () => {
      if (loseStreak >= minStreak) {
        if (lostLast && loseStreak > 0) {
          // End of losing streak, add to data
          if (dates[dates.length - 1] === loseDate && loseStreaks[loseStreaks.length - 1] == null) {
            loseStreaks[loseStreaks.length - 1] = loseStreak
          } else {
            dates.push(loseDate)
            loseStreaks.push(loseStreak)
            winStreaks.push(null)
          }
        }
      }
      loseDate = null
      loseStreak = 0
      lostLast = false
    }

    db.each(`SELECT
          GameDate,
          Win
          FROM Games WHERE GameDate >= ? AND GameDate <= ? ORDER BY GameDate;`,
        req.query.begin || '0000-00-00', req.query.end || '9999-99-99',
        (e, row) => {
          if (e) {
            console.error(e)
            res.status(500).send(e)
          } else {
            // if (parseInt(row.GameDate.replaceAll('-', '')) > 20221205) { return }
            // console.log(JSON.stringify(row))

            if (row.Win === 1) {
              endLosingStreak()

              if (wonLast) {
                // Currently in a streak
                winStreak++
              } else {
                // Start of new win streak
                winDate = row.GameDate
                winStreak = 1
                wonLast = true
              }
            } else {  // Lost
              endWinningStreak()

              if (lostLast) {
                // Currently in a streak
                loseStreak++
              } else {
                // Start of new lose streak
                loseDate = row.GameDate
                loseStreak = 1
                lostLast = true
              }
            }
          }
        },
        (e) => {
          if (e) {
            console.error(e)
            res.status(500).send(e)
          } else {
            endLosingStreak()
            endWinningStreak()
            res.json({ dates, winStreaks, loseStreaks })
          }
        })
  })

  const combinedValues = ['Queue', 'Map', 'Mode', 'GroupSize']
  app.get('/api/plot/combined/options', (req, res) => res.json(combinedValues))
  app.get('/api/plot/combined', (req, res) => {
    const { first, second, begin, end } = req.query

    // Sanitizing by making sure first and second are one of the valid values; can't bind parameters
    // as column names apparently
    if (!combinedValues.includes(first) || (second != null && !combinedValues.includes(second))) {
      res.status(400).send(`first and second must be one of [${combinedValues.join(', ')}]`)
      return
    }

    if (second == null) {
      const firsts = []
      const winRates = []
      const totalGames = []

      db.each(`SELECT
          ${first},
          SUM(CASE WHEN Win = 1 THEN 1 ELSE 0 END) As Wins,
          COUNT(*) AS TotalGames
          FROM GamesFull WHERE GameDate >= ? AND GameDate <= ? GROUP BY ${first} ORDER BY ${first};`,
        begin || '0000-00-00', end || '9999-99-99',
        (e, row) => {
          if (e) {
            console.error(e)
            res.status(500).send(e)
          } else {
            firsts.push(row[first])
            winRates.push(round(row.Wins / row.TotalGames))
            totalGames.push(row.TotalGames)
          }
        },
        (e) => {
          if (e) {
            console.error(e)
            res.status(500).send(e)
          } else {
            res.json({ firsts, winRates, totalGames })
          }
        })
    } else {
      const firsts = new Set()
      const seconds = new Set()
      const data = {}

      db.each(`SELECT
          ${first},
          ${second},
          SUM(CASE WHEN Win = 1 THEN 1 ELSE 0 END) As Wins,
          COUNT(*) AS TotalGames
          FROM GamesFull WHERE GameDate >= ? AND GameDate <= ?
          GROUP BY ${first}, ${second} ORDER BY ${first}, ${second};`,
        begin || '0000-00-00', end || '9999-99-99',
        (e, row) => {
          if (e) {
            console.error(e)
            res.status(500).send(e)
          } else {
            firsts.add(row[first])
            seconds.add(row[second])
            if (!data[row[first]]) {
              data[row[first]] = {}
            }
            if (!data[row[first]][row[second]]) {
              data[row[first]][row[second]] = {
                wins: row.Wins,
                totalGames: row.TotalGames
              }
            }
          }
        },
        (e) => {
          if (e) {
            console.error(e)
            res.status(500).send(e)
          } else {
            const winRates = []
            const totalGames = []
            for (const second of seconds) {
              const subWinRates = []
              const subTotalGames = []
              winRates.push(subWinRates)
              totalGames.push(subTotalGames)
              for (const first of firsts)  {
                if (data[first] && data[first][second]) {
                  const entry = data[first][second]
                  subWinRates.push(entry.wins / entry.totalGames)
                  subTotalGames.push(entry.totalGames)
                } else {
                  subWinRates.push(0)
                  subTotalGames.push(0)
                }
              }
            }

            res.json({ firsts: Array.from(firsts), seconds: Array.from(seconds), winRates, totalGames })
          }
        })
    }
  })

  process.on('SIGINT', () => {
    console.log('Closing DB')
    db.close(() => process.exit())
  })

  app.listen(port, () => console.log(`Running on port [${port}]`))
}

main()
