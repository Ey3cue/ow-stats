import { url, loading, setLoading, initCanvas } from './modules/utils.js'

//////////////////////////////////////////////////
// Chart settings

Chart.defaults.color = '#AAA'
Chart.defaults.backgroundColor = 'rgba(255,255,255,0.1)'
Chart.defaults.borderColor = 'rgba(255,255,255,0.1)'
Chart.defaults.set('plugins.datalabels', {
  align: 'top',
  offset: 3
})

//////////////////////////////////////////////////
// Axios settings

// Add begin/end filters to plot requests
axios.interceptors.request.use((config) => {
  if (config.url.includes('/api/plot')) {
    if (!config.params) {
      config.params = {}
    }
    config.params.begin = $('#form-date-begin').val()
    config.params.end = $('#form-date-end').val()
  }
  return config
})

//////////////////////////////////////////////////
// Dynamic panel setup

const refresh = async () => {
  setLoading(true)

  if ($('#panel-games').is(':visible')) {
    const games = (await axios.get('/api/plot/games')).data

    let html = '<table class="table"><thead><tr>' +
      '<th>Date</th><th>Queue</th><th>Map</th><th>Players</th><th>Win</th><th>One-sided</th>' +
      '</tr></thead>'
    html += '<tbody>'
    for (const row of games) {
      const [ date, queue, map, players, win, onesided ] = row
      html += `<tr><td>${date}</td><td>${queue}</td><td>${map}</td><td>${players.join(', ')}</td>` +
          `<td>${win ? 'Yes' : 'No'}</td>` +
          `<td>${onesided === null ? '' : (onesided ? 'Yes' : 'No')}</td></tr>`
    }
    html += '</tbody></table>'
    $('#panel-games').html(html)

  } else if ($('#panel-time').is(':visible')) {
    const { dates, totalGames, winRates, fun } = (await axios.get('/api/plot/over-time')).data
    new Chart(initCanvas($('#panel-time')), {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Win Rate',
            data: winRates,
            yAxisID: 'winRate'
          },
          {
            label: 'Fun',
            data: fun,
            yAxisID: 'fun'
          },
          {
            label: 'Total Games',
            data: totalGames,
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
            min: 0,
            max: 1,
            title: {
              display: true,
              text: 'Win Rate'
            }
          },
          fun: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Fun'
            }
          },
          totalGames: {
            type: 'linear',
            display: false,
            position: 'right',
            min: 0,
            title: {
              display: true,
              text: 'Total Games'
            }
          }
        }
      }
    })

  } else if ($('#panel-streaks').is(':visible')) {
    const { dates, winStreaks, loseStreaks } = (await axios.get('/api/plot/streaks')).data
    new Chart(initCanvas($('#panel-streaks')), {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Win Streaks',
            data: winStreaks,
            showLine: false,
            yAxisID: 'count'
          },
          {
            label: 'LoseStreaks',
            data: loseStreaks,
            showLine: false,
            yAxisID: 'count'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        // spanGaps: true,
        scales: {
          count: {
            type: 'linear',
            display: true,
            position: 'left',
            min: 0,
            title: {
              display: true,
              text: 'Streaks'
            }
          }
        }
      }
    })

  } else if ($('#panel-combined').is(':visible')) {
    const first = $('#form-combined-first').val()
    const second = $('#form-combined-second').val() == 'none' ? null : $('#form-combined-second').val()

    const data = (await axios.get('/api/plot/combined', {
        params: { first, second }
      })).data

    const datasets = []
    const plugins = []

    if (second == null) {
      datasets.push({
        label: 'Win Rate',
        data: data.winRates,
        yAxisID: 'winRate'
      })
      datasets.push({
        label: 'Total Games',
        type: 'scatter',
        data: data.totalGames,
        yAxisID: 'totalGames'
      })
      plugins.push(ChartDataLabels)
    } else {
      for (let i = 0; i < data.winRates.length; ++i) {
        datasets.push({
          label: data.seconds[i],
          data: data.winRates[i],
          yAxisID: 'winRate'
        })
      }
    }

    new Chart(initCanvas($('#chart-combined')), {
      type: 'bar',
      plugins,
      data: {
        labels: data.firsts,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          winRate: {
            type: 'linear',
            display: true,
            position: 'left',
            min: 0,
            max: 1,
            title: {
              display: true,
              text: 'Win Rate'
            }
          },
          totalGames: {
            type: 'linear',
            display: false,
            position: 'right',
            min: 0,
            title: {
              display: true,
              text: 'Total Games'
            }
          }
        }
      }
    })
  }

  setLoading(false)
}

//////////////////////////////////////////////////
// Static element initialization

const initPromises = []

$('a').on('click', (e) => e.preventDefault())

// Set up tabs
const activateTab = ($tab) => {
  if (!$tab.length) {
    console.warn('Tried to activate invalid tab')
    return
  }
  $('.tab').removeClass('active')
  $('.panel').hide()
  const $panel = $('#' + $tab.attr('id').replace('tab', 'panel'))
  $tab.addClass('active')
  $panel.show()
  url.set('t', $tab.attr('id').replace('tab-', ''))
  refresh()
}
$('.tab').on('click', (event) => activateTab($(event.currentTarget)))

// Set up date selectors
const setDates = (start, end) => {
  $('#form-date-begin').val(start)
  $('#form-date-end').val(end)
  refresh()
}
$('#form-date-clear').on('click', () => setDates('', ''))
$('#form-date-begin').on('change', refresh)
$('#form-date-end').on('change', refresh)
const seasonsPromise = axios.get('/api/seasons')
initPromises.push(seasonsPromise)
seasonsPromise.then((response) => {
  const seasons = response.data
  for (const s of seasons) {
    const $btn = $(`<button class="btn btn-outline-secondary" type="button">S${s.Id}</button>`)
    $('#form-date-group').append($btn)
    $btn.on('click', () => setDates(s.Begin, s.End || ''))
  }
  // Default to current season on start
  $('#form-date-begin').val(seasons[seasons.length - 1].Begin)
  $('#form-date-end').val('')
})

// Set up combined panel inputs
const combinedOptionsPromise = axios.get('/api/plot/combined/options')
initPromises.push(combinedOptionsPromise)
combinedOptionsPromise.then((response) => {
  const combinedOptions = response.data
  for (const option of combinedOptions) {
    $('#form-combined-first').append(`<option value="${option}">${option}</option>`)
  }
  const formCombinedSecondRefresh = () => {
    const first = $('#form-combined-first').val()
    $('#form-combined-second').html('<option value="none"> </option>')
    for (const option of combinedOptions) {
      if (option != first) {
        $('#form-combined-second').append(`<option value="${option}">${option}</option>`)
      }
    }
  }
  formCombinedSecondRefresh()
  $('#form-combined-first').on('change', formCombinedSecondRefresh)
  $('#form-combined-first').on('change', refresh)
  $('#form-combined-second').on('change', refresh)
})

await Promise.all(initPromises)
setLoading(false)
activateTab($(`#tab-${url.get('t') || 'time'}`))