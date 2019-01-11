(function () {
  var leaveButton = document.getElementById('leave-event-btn')

  if (leaveButton) {
    leaveButton.addEventListener('click', function (e) {
      e.preventDefault()
      Api.delete('/events/' + window.id + '/attendees')
      window.location.reload()
    })
  }
})()
