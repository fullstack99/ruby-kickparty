/* global Utils tinymce formState :true */
// TINY MCE

(function () {
  if (!isValidPage()) { return }

  Utils.loadScript('//cdn.tinymce.com/4/tinymce.min.js', function () {
    tinymce.init({
      setup: function (editor) {
        editor.on('change', function (ev) {
          var content = editor.getContent()
          formState.update('description', content)
        })
      },
      invalid_elements: 'script',
      selector: '#description',
      plugins: [
        'advlist autolink lists link image charmap print preview hr anchor pagebreak',
        'searchreplace wordcount visualblocks visualchars code fullscreen',
        'insertdatetime media nonbreaking save table contextmenu directionality',
        'emoticons template paste textcolor colorpicker textpattern imagetools'
      ],
      toolbar1: 'insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image | preview media | forecolor backcolor emoticons'
    })
  })

  function isValidPage () {
    var isValidPage = false

    if (document) {
      var url = document.URL

      if (url.indexOf('events/new') !== -1) {
        isValidPage = true
      } else if (url.indexOf('events') !== -1 && url.indexOf('edit') !== -1) {
        isValidPage = true
      }
    }

    return isValidPage
  }
})()
