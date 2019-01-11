var Utils = {}

Utils.formatCurrency = function (num, symbol = '$') {
  if (typeof num === 'string') {
    num = this.tryParseFloat(num)
  }

  if (!num) {
    return '$0'
  }

  return (num) ? symbol + (num.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,')) : symbol
}

Utils.truncate = function (string) {
  return (string.length > 5) ? string.substring(0, 100) + '...' : string
}

Utils.tryParseBool = function (val) {
  if (val && typeof (val) === 'boolean') {
    return val
  } else {
    return false
  }
}

Utils.tryParseString = function (val) {
  if (val && typeof (val) === 'string') {
    return val
  } else {
    return ''
  }
}

Utils.tryParseFloat = function (val) {
  const parsedNum = parseFloat(val)
  return (!isNaN(parsedNum)) ? parsedNum : false
}

Utils.tryParseInt = function (val) {
  const parsedNum = parseFloat(val)
  return (!isNaN(parsedNum)) ? parsedNum : false
}

Utils.commaSeparated = function (value) {
  return value.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

Utils.loadScript = function (url, cb) {
  var script = document.createElement('script')
  script.type = 'text/javascript'

  if (script.readyState) {
    // IE
    script.onreadystatechange = function () {
      if (script.readyState === 'loaded' || script.readyState === 'complete') {
        script.onreadystatechange = null

        if (cb && cb instanceof Function) {
          cb()
        }
      }
    }
  } else {
    script.onload = function () {
      if (cb && cb instanceof Function) {
        cb()
      }
    }
  }

  script.src = url
  document.getElementsByTagName('head')[0].appendChild(script)
}

// Searches up the DOM to find an ancestor by class name
Utils.findAncestor = function (el, className) {
  while (el.className.indexOf(className) === -1) {
    el = el.parentElement
  }

  return el
}

// Creates DOM nodes
Utils.nodeFactory = function (tag, classes, content, attrs) {
  const node = document.createElement(tag)

  if (classes) {
    for (let i = 0, j = classes.length; i < j; i++) {
      node.classList.add(classes[i])
    }
  }

  if (content) {
    node.innerHTML = content
  }

  if (attrs) {
    for (let key in attrs) {
      if (attrs.hasOwnProperty(key)) {
        node.setAttribute(key, attrs[key])
      }
    }
  }

  return node
}
