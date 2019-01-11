/* global ErrorService formState :true */

// Form Handler
if (document && (document.URL.indexOf('events/new') !== -1 || (document.URL.indexOf('events') !== -1 && document.URL.indexOf('edit') !== -1))) {
  $(document).ready(() => {
    var eventForm = document.querySelector('#event-form')

    eventForm.addEventListener('change', (ev) => {
      var updateResult = formState.update(ev.target.name, ev.target.value)

      // string returned means an error message
      if (typeof updateResult === 'string') {
        ev.target.classList.add('error')
      } else {
        ev.target.classList.remove('error')
      }
    })

    var imageUpload = eventForm.querySelector('#headerImg')
    imageUpload.onchange = function () {
      var file = this.files[0]

      console.log('name : ' + file.name)
      console.log('size : ' + file.size)
      console.log('type : ' + file.type)
      console.log('date : ' + file.lastModified)
      console.groupEnd()

      previewImage(file)
    }

    function previewImage (file) {
      var gallery = document.getElementById('img-preview')
      var imageType = /image.*/

      if (!file.type.match(imageType)) {
        console.error('File Type must be an image')
      }

      var thumb = document.createElement('div')
      thumb.classList.add('thumbnail')

      var img = document.createElement('img')
      img.file = file
      thumb.appendChild(img)
      gallery.textContent = ''
      gallery.appendChild(thumb)

      // Using FileReader to display the image content
      var reader = new FileReader()
      reader.onload = (function (aImg) {
        return function (e) {
          aImg.src = e.target.result
        }
      })(img)
      reader.readAsDataURL(file)
    }

    eventForm.onsubmit = (ev) => {
      for (var key in formState.VALIDATIONS) {
        ErrorService.remove(key)

        var validation = formState.VALIDATIONS[key]
        var inputValue = formState.data[key]

        if (!inputValue || inputValue === '') {
          // No value and has a isRequiredMessage
          // We use this over isRequired bc some of the values are not visible
          // to the user like lat and lng
          if (validation.isRequiredMessage) {
            ErrorService.add(key, validation.isRequiredMessage)
          }
        } else if (inputValue) {
          // if we have a value it needs to be valid
          if (!validation.test(inputValue)) {
            ErrorService.add(key, validation.invalidMessage)
          }
        }
      }

      return (ErrorService.errors.length === 0)
    }

    const cancelBtn = eventForm.querySelector('.eventForm-cancel')
    cancelBtn.onclick = function () {
      window.history.back()
    }
  })
}
