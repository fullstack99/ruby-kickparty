/* global ResourcesController :true */
/*eslint no-inner-declarations: "off"*/
/*eslint no-unused-vars: "warn"*/

$(document).ready(() => {
  if (document.URL.indexOf('resources') !== -1) {
    var resourceState = {}
    var pricing = {
      _data: {
        baseCost: 0,
        costPerAttendee: 0,
        calculationMethod: 1,
        totalCost: 0
      },
      set (key, value) {
        this._data[key] = value
      },
      get (key) {
        return this._data[key]
      }
    }

    window.pricing = pricing

    var peopleAttending = window.minAttendeeCount || 1
    var costTotalNode = document.getElementById('cost-total')
    var costPPNode = document.getElementById('cost-pp')
    var costBaseNode = document.getElementById('cost-base')
    var flatPriceNode = document.getElementById('flat-price')
    var resourceForm = document.getElementById('resource-form')
    var calculationMethods = document.querySelectorAll('.price-method')
    var cancelBtn = document.querySelector('.resource-cancel')

    cancelBtn.onclick = function () {
      window.history.back()
    }

    flatPriceNode.onchange = calcTotals
    costBaseNode.onchange = calcTotals

    for (let i = 0, j = calculationMethods.length; i < j; i++) {
      calculationMethods[i].onchange = function (ev) {
        pricing.set('calculationMethod', ~~ev.target.value)
        flatPriceNode.classList.toggle('hide')

        if (~~ev.target.value === 1) {
          flatPriceNode.value = null
          calcTotals()
        }
      }
    }

    resourceForm.onsubmit = function (ev) {
      ev.currentTarget.classList.add('disabled')
      ev.preventDefault()

      const mappedData = {
        id: window.slug,
        tiers: [
          {
            baseCost: pricing.get('baseCost'),
            calculationMethod: pricing.get('calculationMethod'),
            costPerAttendee: pricing.get('costPerAttendee')
          }
        ],
        resources: mapResources()
      }

      console.info('MAPPED DATA', mappedData)

      Api.post(`/events/${mappedData.id}/update`, mappedData).then(
        (data) => {
          window.location = `/events/${mappedData.id}`
        },
        () => {
          ev.currentTarget.classList.remove('disabled')
        }
      )
    }

    var toggleButtons = document.querySelectorAll('.content-toggle')
    for (let i = 0, j = toggleButtons.length; i < j; i++) {
      toggleButtons[i].onclick = (ev) => {
        var button = ev.currentTarget
        var icon = button.querySelector('.fa')
        var wrapper = Utils.findAncestor(button, 'resource-section')
        var content = wrapper.querySelector('.resource-content')

        content.classList.toggle('hidden')
        icon.classList.toggle('fa-minus-square')
        icon.classList.toggle('fa-plus-square')
      }
    }

    var eventResources = document.querySelectorAll('.event-resources')

    for (let i = 0, j = eventResources.length; i < j; i++) {
      var node = eventResources[i]
      var resource = new ResourcesController(null, node, (type, resources, total) => {
        handleChange(type, resources, total)
      })
    }

    function handleChange (type, resources, total) {
      resourceState[type] = { total, resources }
      calcTotals()
    }

    function calcTotals () {
      const baseCost = getBaseCost()
      pricing.set('baseCost', baseCost)

      const resourcesCost = getResourcesCost()
      pricing.set('totalCost', baseCost + resourcesCost)

      const costPerAttendee = getCostPerAttendee()
      pricing.set('costPerAttendee', costPerAttendee)

      renderUpdates()
    }

    function getBaseCost () {
      let tempTotal = 0
      if (costBaseNode && costBaseNode.value) {
        tempTotal = Utils.tryParseFloat(costBaseNode.value)
      }
      return tempTotal
    }

    function getResourcesCost () {
      let tempTotal = 0
      for (var resource in resourceState) {
        if (resourceState.hasOwnProperty(resource)) {
          tempTotal += resourceState[resource].total
        }
      }
      return tempTotal
    }

    function getCostPerAttendee () {
      let tempTotal = 0

      if (pricing.get('calculationMethod') === 2) {
        tempTotal = Utils.tryParseFloat(flatPriceNode.value)
      } else {
        tempTotal = pricing.get('totalCost') / peopleAttending
      }

      return tempTotal
    }

    function renderUpdates () {
      costTotalNode.textContent = Utils.formatCurrency(pricing.get('totalCost'))
      costPPNode.textContent = Utils.formatCurrency(pricing.get('costPerAttendee'))
    }

    function mapResources () {
      let resources = []

      for (let resourceTypeId in resourceState) {
        if (resourceState[resourceTypeId].resources instanceof Array) {
          resources = resources.concat(resourceState[resourceTypeId].resources)
        }
      }

      return resources
    }
  } // End if on page logic
})
