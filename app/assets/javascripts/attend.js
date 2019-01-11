if (document.URL.indexOf('attend') !== -1) {
  (function () {
    var attendEventButton = document.getElementById('attend-event-btn')
    var contributionInput = document.getElementById('contribution-input')
    var eventCostEle = document.getElementById('event-cost')
    var processingFeeEle = document.getElementById('processing-fee')
    var totalPriceEle = document.getElementById('total-price')

    var eventCost = parseFloat(eventCostEle.innerHTML.replace('$', ''))
    // If event is free, eventsCostEle.innerHTML is "Free!" instead of e.g. $23.00
    if (isNaN(eventCost)) {
      eventCost = 0
    }

    // Update fee and total event price on contribution change
    contributionInput.addEventListener('change', function (e) {
      // Parse contribution amount
      var contribution = e.target.value
        ? parseFloat(e.target.value)
        : 0

      // If first char is NaN, parseFloat returns NaN; otherwise it parses until the non-numeric char
      if (isNaN(contribution)) {
        contribution = 0
        contributionInput.value = ''
      }

      // Update fee
      var processingFee = (eventCost + contribution) * 0.05
      if (processingFee !== 0 && processingFee < 1) {
        processingFee = 1
      }
      processingFeeEle.innerHTML = Utils.formatCurrency(processingFee)

      // Update total (field and button)
      var totalPrice = eventCost + contribution + processingFee
      totalPriceEle.innerHTML = Utils.formatCurrency(totalPrice)
      attendEventButton.innerHTML = totalPrice
        ? 'Yes, I agree to contribute ' + Utils.formatCurrency(totalPrice)
        : 'Yes, I\'d like to attend for free!'
    })

    // TODO: IMPORTANT
    // Disable submit button upon click (Better to debounce though)
    // Does not work, disables w/o submitting
    // attendEventButton.addEventListener('click', function (e) {
    //   attendEventButton.disabled = true
    // })
  })()
}
