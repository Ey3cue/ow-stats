// Helper functions
let loading = false
const setLoading = (newLoading) => {
  loading = newLoading
  // Charts flicker when adjusting size; timeout hides it
  loading ? $('.loading').show() : setTimeout(() => $('.loading').hide(), 20)
}
setLoading(true)

Chart.defaults.color = '#AAA'
Chart.defaults.backgroundColor = 'rgba(255,255,255,0.1)'
Chart.defaults.borderColor = 'rgba(255,255,255,0.1)'
Chart.defaults.set('plugins.datalabels', {
  align: 'top',
  offset: 3
});

const activate = {}

// buildPanel: (axiosResponse, $panel) => void <function to build $panel contents>
const panelActivation = (id, title, buildPanel) => {
  $('#toggle-list').append(`<li class="nav-item me-2"><a id="toggle-${id}" ` +
      `class="toggle-panel-btn nav-link" aria-current="page" href="#">${title}</a></li>`)
  if ($(`#panel-${id}`).length === 0) {  // Was not added by `chartActivation`
    $('#panel-container').append(`<div id="panel-${id}" class="col data-panel"></div>`)
  }
  activate[id] = () => {
    setLoading(true)
    axios.get(`/api/plot/${id}`, {
        params: { start: $('#form-date-start').val(), end: $('#form-date-end').val() }
      })
      .then((res) => {
        buildPanel(res, $(`#panel-${id}`))
        setLoading(false)
      })
      .catch((e) => {
        console.error(e?.response?.data || e)
        $(`#panel-${id}`).html('<h1>Failed to load content.</h1>')
        setLoading(false)
      })
  }
}

// genChartConfig: (axiosResponse) => chartConfig object passed to Chart.js constructor 
const chartActivation = (id, title, genChartConfig) => {
  $('#panel-container').append(`<div id="panel-${id}" class="col chart data-panel"></div>`)
  panelActivation(id, title, (res, $panel) => {
    const $canvas = $('<canvas></canvas>')
    const $canvasContainer = $('<div class="chart-resizer d-flex justify-content-center"></div>')
    $canvasContainer.append($canvas)
    $panel.append($canvasContainer)
    new Chart($canvas[0], genChartConfig(res))
  })
}

panelActivation('games', 'Games', (res) => {
  const rows = res.data
  let html = '<table class="table"><thead><tr>' +
      '<td>' + rows.shift().join('</td><td>') + '</td>' +
      '</tr></thead>'

  html += '<tbody>'
  for (const row of rows) {
    html += '<tr><td>' + row.join('</td><td>') + '</td></tr>'
  }
  html += '</tbody></table>'
      
  $('#panel-games').html(html)
}),

chartActivation('wins-over-time', 'Wins',
  (res) => ({
    type: 'line',
    data: {
      labels: res.data.dates,
      datasets: [
        {
          label: 'Win Rate',
          data: res.data.winRates,
          yAxisID: 'winRate'
        },
        {
          label: 'Total Games',
          data: res.data.totalGames,
          type: 'scatter',
          yAxisID: 'totalGames'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        winRate: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Win Rate'
          }
        },
        totalGames: {
          type: 'linear',
          display: true,
          position: 'right',
          min: 0,
          title: {
            display: true,
            text: 'Total Games'
          }
        }
      }
    }
  }))

chartActivation('fun-over-time', 'Fun',
  (res) => ({
    type: 'line',
    data: {
      labels: res.data.dates,
      datasets: [
        {
          label: 'Fun',
          data: res.data.fun
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true
    }
  }))

chartActivation('wins-over-group-size', 'Group Size',
  (res) => ({
    type: 'bar',
    plugins: [ChartDataLabels],
    data: {
      labels: res.data.groupSize,
      datasets: [
        {
          label: 'Win Rate',
          data: res.data.winRates,
          yAxisID: 'winRate',
        },
        {
          label: 'Total Games',
          type: 'scatter',
          data: res.data.totalGames,
          yAxisID: 'totalGames'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        winRate: {
          type: 'linear',
          position: 'left',
          min: 0,
          max: 1
        },
        totalGames: {
          type: 'linear',
          position: 'right'
        }
      }
    }
  }))

chartActivation('wins-over-mode', 'Modes',
  (res) => ({
    type: 'bar',
    plugins: [ChartDataLabels],
    data: {
      labels: res.data.modes,
      datasets: [
        {
          label: 'Win Rate',
          data: res.data.winRates,
          yAxisID: 'winRate',
        },
        {
          label: 'Total Games',
          type: 'scatter',
          data: res.data.totalGames,
          yAxisID: 'totalGames'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        winRate: {
          type: 'linear',
          position: 'left',
          min: 0,
          max: 1
        },
        totalGames: {
          type: 'linear',
          position: 'right'
        }
      }
    }
  }))

const refreshAllPanels = () => {
  for (const id in activate) {
    if ($(`#toggle-${id}`).hasClass('active')) {
      $(`#panel-${id}`).html('')  // Deactivate
      activate[id]()
    }
  }
}

const initError = () => $('#main').html('<h1>ERROR</h1>')
const initPromises = []
initPromises.push(axios.get('/api/modes')
  .then((res) => $('#form-game-mode').html(res.data.map((val) => `<option value="${val}">${val}</option>`).join('')))
  .catch(initError))
initPromises.push(axios.get('/api/maps')
  .then((res) => $('#form-game-map').html(res.data.map((val) => `<option value="${val}">${val}</option>`).join('')))
  .catch(initError))
initPromises.push(axios.get('/api/players')
  .then((res) => {
    $('#form-game-players').html(res.data.map((val) => 
        `<input type="checkbox" class="btn-check" id="form-game-player-${val.toLowerCase()}">` +
        `<label class="btn btn-outline-secondary mb-1 form-game-player" for="form-game-player-${val.toLowerCase()}">${val}</label>`)
      .join('&nbsp;')
    )
  })
  .catch(initError))
initPromises.push(axios.get('/api/allowed')
  .then((res) => {
    if (res.data) {
      $('.form-game-allowed').show()
    }
  })
  .catch(initError))

Promise.all(initPromises).then(() => setLoading(false))

// Nav buttons init to show/hide each panel
const toggleAddGameForm = (enable) => {
  if (enable === undefined) {
    enable = !$('#toggle-form-game').hasClass('active')
  }

  if (enable) {
    $('#toggle-form-game').addClass('active')
    $('#panel-form-game').show()
  } else {
    $('#toggle-form-game').removeClass('active')
    $('#panel-form-game').hide()
  }
}
$('#toggle-form-game').on('click', (e) => {
  e.preventDefault()
  toggleAddGameForm()
})

const togglePanel = (id, enable) => {
  if (enable === undefined) {
    enable = !$(`#toggle-${id}`).hasClass('active')
  }

  // Deactivate others
  $('.data-panel').each(function () {
    const id = $(this).attr('id').match(/panel-(.*)/)[1]
    $(`#toggle-${id}`).removeClass('active')
    $(`#panel-${id}`).hide()
    $(`#panel-${id}`).html('')
  })

  if (enable) {
    $(`#toggle-${id}`).addClass('active')
    $(`#panel-${id}`).show()
    activate[id]()
  } else {
    $(`#toggle-${id}`).removeClass('active')
    $(`#panel-${id}`).hide()
    $(`#panel-${id}`).html('')
  }
}

$('.toggle-panel-btn').each(function () {
  const $btn = $(this)
  const id = $btn.attr('id').replace('toggle-', '')

  if ($btn.hasClass('active')) {
    togglePanel(id, true)
  }

  $btn.on('click', (e) => {
    e.preventDefault()
    togglePanel(id)
  })
})

// Add new game form init
$('#form-game-submit-btn').on('click', () => {
  if (loading) {
    return
  }

  const players = []
  $('.form-game-player').each(function () {
    const player = $(this).text()
    if ($(`#form-game-player-${player.toLowerCase()}`).is(':checked')) {
      players.push(player)
    }
  })
  if (players.length < 1 || players.length > 5) {
    alert('Between 1 and 5 players must be selected')
    return
  }

  setLoading(true)
  axios({
    method: 'POST',
    url: '/api/game',
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      mode: $('#form-game-mode').val(),
      map: $('#form-game-map').val(),
      players,
      win: $('#form-game-win').val() === 'Yes',
      onesided: $('#form-game-onesided').val() === 'n/a' ? null : $('#form-game-onesided').val() === 'Yes'
    }
  })
    .then(() => {
      alert('Successfully added game.')
      refreshAllPanels()
    })
    .catch((e) => {
      console.error(e.response)
      if (e.response.status === 400) {
        alert(e.response.data)
      } else if (e.response.status === 403) {
        alert('You are not allowed to add games.')
      } else {
        alert('Failed to add game.')
      }
      setLoading(false)
    })
})

// Date form init
const dateChange = () => {
  refreshAllPanels()
}
const setDates = (start, end) => {
  $('#form-date-start').val(start)
  $('#form-date-end').val(end)
  dateChange()
}

$('#form-date-clear').on('click', () => {
  $('#form-date-start').val('')
  $('#form-date-end').val('')
  dateChange()
})
$('#form-date-start').on('change', dateChange)
$('#form-date-end').on('change', dateChange)
$('#form-date-s1').on('click', () => setDates('2022-10-04', '2022-12-05'))
$('#form-date-s2').on('click', () => setDates('2022-12-06', '2023-02-06'))
$('#form-date-s3').on('click', () => setDates('2023-02-07', ''))

// Startup, default to current season
$('#form-date-start').val('2023-02-07')
togglePanel('wins-over-time')