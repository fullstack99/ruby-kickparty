/* global Utils formState google :true */

// GOOGLE MAPS
// if (document && (document.URL.indexOf('events/new') !== -1 || (document.URL.indexOf('events') !== -1 && document.URL.indexOf('edit') !== -1))) {
  function initAutocomplete () {
    const mapDiv = document.getElementById('map')

    if (!mapDiv) { return }

    const ELEVATE_BLUE = { lat: 39.2494644, lng: -119.954313 }
    let center = ELEVATE_BLUE

    const { eventLocation } = window

    let markers = []

    // if rails puts data on the page from an event thats being edited
    // Change the center to the events lat lng
    if (eventLocation) {
      center = {
        lat: parseFloat(eventLocation.locationLat),
        lng: parseFloat(eventLocation.locationLng)
      }
    }

    const OPTIONS = {
      center,
      scrollwheel: true,
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    }

    const map = new google.maps.Map(mapDiv, OPTIONS)

    // if rails puts data on the page from an event thats being edited
    // add a marker from the event
    // Unfortunately we cannot do this in the first if statement as we need the map
    if (eventLocation) {
      markers.push(new google.maps.Marker({
        position: center,
        map: map
      }))
    }

    // Get the search box and link it to the UI element.
    const input = document.getElementById('pac-input')

    // If the enter key is hit, do not submit the form
    google.maps.event.addDomListener(input, 'keydown', function (ev) {
      if (ev.keyCode === 13) {
        ev.preventDefault()
      }
    })

    const searchBox = new google.maps.places.SearchBox(input)

    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input)

    // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', function () {
      searchBox.setBounds(map.getBounds())
    })

    // Listen for the event fired when the user selects a prediction and retrieve more details for that place.
    searchBox.addListener('places_changed', function () {
      var places = searchBox.getPlaces()

      if (places.length === 0) { return }

      // Clear out the old markers.
      markers.forEach(function (marker) {
        marker.setMap(null)
      })

      markers = []

      // For each place, get the icon, name and location.
      var bounds = new google.maps.LatLngBounds()

      places.forEach(function (place) {
        updateFormState(place)

        const icon = {
          url: place.icon,
          size: new google.maps.Size(71, 71),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(17, 34),
          scaledSize: new google.maps.Size(25, 25)
        }

        // Create a marker for each place.
        markers.push(new google.maps.Marker({
          map: map,
          icon: icon,
          title: place.name,
          position: place.geometry.location
        }))

        if (place.geometry.viewport) {
          // Only geocodes have viewport
          bounds.union(place.geometry.viewport)
        } else {
          bounds.extend(place.geometry.location)
        }
      })

      map.fitBounds(bounds)
    })
  }

  function parseCityStateCountry (place) {
    if (!place || !place.address_components) {
      return {}
    }

    const mappedTypesToLongName = mapTypesToLongName(place.address_components)

    return {
      country: mappedTypesToLongName['country'],
      state: mappedTypesToLongName['administrative_area_level_1'],
      city: mappedTypesToLongName['locality']
    }
  }

  function mapTypesToLongName (address_components) {
    const mapped = {}

    for (let index = 0; index < address_components.length; index++) {
      let component = address_components[index]

      if (component.types && component.types.length > 0) {
        mapped[component.types[0]] = component.long_name
      }
    }

    return mapped
  }

  function updateFormState (place) {
    const lat = place.geometry.location.lat()
    const lng = place.geometry.location.lng()
    const address = place.formatted_address
    const name = place.name
    const cityStateCountry = parseCityStateCountry(place)

    deathToAll('locationAddress', address.split(', ')[0])
    deathToAll('locationLat', lat)
    deathToAll('locationLng', lng)
    deathToAll('locationName', name)
    deathToAll('locationCity', cityStateCountry.city)
    deathToAll('locationState', cityStateCountry.state)
    deathToAll('locationCountry', cityStateCountry.country)
  }

  function deathToAll (key, val) {
    formState.update(key, val)
    document.getElementById(key).value = val
  }

  Utils.loadScript('https://maps.googleapis.com/maps/api/js?key=AIzaSyBCfiFHdbE6wZKKjdAP2o88DCiYZsifpsg&libraries=places&callback=initAutocomplete')
// }
