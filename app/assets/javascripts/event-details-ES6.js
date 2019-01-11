'use strict';

$(document).ready(function () {
  if (document.URL.indexOf('events') !== -1) {
    (function () {
      var initEventListeners = function initEventListeners() {
        var deleteEventBtn = document.querySelector('.delete-event');
        if (deleteEventBtn) {
          deleteEventBtn.onclick = deleteEvent;
        }
      };

      var deleteEvent = function deleteEvent(ev) {
        Api.delete('/events/' + window.slug).then(function (res) {
          window.location = '/events';
        }, function (err) {
          console.log(err);
        });
      };

      initEventListeners();
    })();
  }
});