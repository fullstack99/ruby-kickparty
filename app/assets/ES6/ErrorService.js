// Error Reporting Service
/*
Expects to work with the following template that must be in your code
<div id="error-reporter">
  <h3>Form Errors<h3>
  <div id="errors"></div>
</div>
*/
var ErrorService = {
  errors: [],
  report () {
    var errorReporter = document.getElementById('error-reporter')
    var errors = document.getElementById('errors')

    if (!errorReporter || !errors) {
      return
    }

    errorReporter.style.display = (this.errors.length === 0) ? 'none' : 'block'

    var ul = document.createElement('ul')

    for (let i = 0; i < this.errors.length; i++) {
      var error = this.errors[i]
      var li = document.createElement('li')
      li.textContent = error.message
      ul.appendChild(li)
    }

    while (errors.firstChild) {
      errors.removeChild(errors.firstChild)
    }

    errors.appendChild(ul)
  },
  add (key, message) {
    var isNew = true

    // Loop over all the existing errors and make sure this is not a dup
    for (let i = 0, j = this.errors.length; i < j; i++) {
      if (this.errors[i].name === key) {
        isNew = false
        break
      }
    }

    if (isNew) {
      this.errors.push({
        name: key,
        message: message
      })
    }

    this.report()
  },
  remove (key) {
    for (var i = 0; i < this.errors.length; i++) {
      var error = this.errors[i]
      if (error.name === key) {
        this.errors.splice(i, 1)
        break
      }
    }

    this.report()
  }
}
