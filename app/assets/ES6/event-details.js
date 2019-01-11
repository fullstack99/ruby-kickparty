$(document).ready(() => {
  if (document.URL.indexOf('events') !== -1) {
    const initEventListeners = function () {
      const deleteEventBtn = document.querySelector('.delete-event')
      if (deleteEventBtn) {
        deleteEventBtn.onclick = deleteEvent
      }
    }

    const deleteEvent = function (ev) {
      Api.delete(`/events/${window.slug}`).then(
        (res) => {
          window.location = '/events'
        },
        (err) => {
          console.log(err)
        }
      )
    }

    initEventListeners()
  }
})
