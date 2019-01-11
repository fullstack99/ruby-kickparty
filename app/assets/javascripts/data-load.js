/* global view Api eventsTmpl $ :true */

var Utils = window.Utils

function showCommentModal(e, isLoggedIn) {
  if (!isLoggedIn) {
    e.preventDefault()
    $('#modal-comment').modal('show')
  }
}

function loadEventPosts (id) {
  // Api comes from scripts/api.js
  Api.get('/posts/' + id).then(
    function (posts) {
      // console.log("POSTS")
      // console.log(posts)
      $('#event-posts-loader').remove()
      var html = postsTmpl.render(posts)
      $('#event-posts').html(html)
    },
    function (err) {
      console.log(err)
    })
}

$(document).ready(function () {
  // View comes from views/partials/head.ejs
  // It dynamically loads a script file

  // loadUser()

  switch (window.view) {
    // TODO: should just put this on event details page
    case 'event-details':
      var id = window.id
      loadEventDetails(id)
      loadEventPosts(id)
      loadEventAttendees(id)
      break
    default:
      // ?
  }

  function loadUser () {
    Api.get('/current_session').then(
      function (user) {
        console.log(user)
      },
      function (err) {
        console.log(err)
      })
  }

  function loadEventDetails () {
    $('#event-description').readmore({
      moreLink: '<a href="#">Show more</a>',
      lessLink: '<a href="#">Show less</a>'
    })

    // Event Totals
    // var committedCount = eventDetail.committedCount
    // var totalCost = tier.tierTotal
    // var peopleNeededCount = tier.minAttendeeCount - committedCount
    // peopleNeededCount = (peopleNeededCount > 0) ? peopleNeededCount : 0 // Event has kicked!
    // var totalRaised = tier.costPerPerson * committedCount
    // var amountShort = tier.costPerPerson * peopleNeededCount
    // var displayCost = (totalCost <= 0) ? 'Free' : Utils.formatCurrency(totalCost)
    //
    // $('.kick-by-term').html(eventDetail.kickBy === 1 ? 'Guests' : 'Funds')
    // $('#total-needed').html(eventDetail.kickBy === 1 ? tier.minAttendeeCount : displayCost)
    // $('#committed').html(eventDetail.kickBy === 1 ? committedCount : Utils.formatCurrency(totalRaised))
    // $('#addtl-needed').html(eventDetail.kickBy === 1 ? peopleNeededCount : Utils.format.currency(amountShort))
    //

  }

  function loadEventAttendees (id) {
    // Api comes from scripts/api.js
    Api.get('/events/' + id + '/attendees').then(
      function (attendees) {
        console.log(attendees)
        $('#event-attendees-loader').remove()
        var html = attendeesTmpl.render(attendees.attendees)
        $('#event-attendees').html(html)
      },
      function (err) {
        console.log(err)
      })
  }

  $('#message-subject, #message-body').keyup(function () {
    var subject = $('#message-subject').val()
    var body = $('#message-body').val()

    if (subject !== '' && body !== '') {
      $('#message-send').removeProp('disabled')
    } else {
      $('#message-send').prop('disabled', 'disabled')
    }
  })

  $('#message-send').click(function () {
    var subject = $('#message-subject').val()
    var body = $('#message-body').val()

    Api.post('/emails/', {
      id: window.id,
      subject: subject,
      body: body
    }).then(function (res) {
      if (res.response.code === 201) {
        $('#modal-message').modal('hide')

        $.notify({
          message: 'Your message has been sent'
        }, {
          type: 'success',
          delay: 3000
        })

        $('#message-subject').val('')
        $('#message-body').val('')
        $('#message-send').prop('disabled', 'disabled')
      }
    })
  })
})
