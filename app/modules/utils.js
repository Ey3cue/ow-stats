// Loader
let loading = false
const setLoading = (newLoading) => {
  loading = newLoading
  // Charts flicker when adjusting size; timeout hides it
  loading ? $('.loading').show() : setTimeout(() => $('.loading').hide(), 20)
}

// Query params
const url = {
  set: (key, val) => {
    const params = new URLSearchParams(location.search)
    params.set(key, val)
    history.replaceState(null, '', location.href.replace(location.search, '') + '?' + params.toString())
  },
  get: (key) => new URLSearchParams(location.search).get(key)
}

const initCanvas = ($elem) => {
  $elem.html('')
  const $canvas = $('<canvas></canvas>')
  const $canvasContainer = $('<div class="chart-resizer d-flex justify-content-center"></div>')
  $canvasContainer.append($canvas)
  $elem.append($canvasContainer)
  return $canvas[0]
}

export {
  url,
  loading,
  setLoading,
  initCanvas
}