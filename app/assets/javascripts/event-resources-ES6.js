'use strict';

/* global ResourcesController :true */
/*eslint no-inner-declarations: "off"*/
/*eslint no-unused-vars: "warn"*/

$(document).ready(function () {
  if (document.URL.indexOf('resources') !== -1) {
    var resourceState;
    var pricing;
    var peopleAttending;
    var costTotalNode;
    var costPPNode;
    var costBaseNode;
    var flatPriceNode;
    var resourceForm;
    var calculationMethods;
    var cancelBtn;
    var toggleButtons;
    var eventResources;
    var node;
    var resource;

    (function () {
      var handleChange = function handleChange(type, resources, total) {
        resourceState[type] = { total: total, resources: resources };
        calcTotals();
      };

      var calcTotals = function calcTotals() {
        var baseCost = getBaseCost();
        pricing.set('baseCost', baseCost);

        var resourcesCost = getResourcesCost();
        pricing.set('totalCost', baseCost + resourcesCost);

        var costPerAttendee = getCostPerAttendee();
        pricing.set('costPerAttendee', costPerAttendee);

        renderUpdates();
      };

      var getBaseCost = function getBaseCost() {
        var tempTotal = 0;
        if (costBaseNode && costBaseNode.value) {
          tempTotal = Utils.tryParseFloat(costBaseNode.value);
        }
        return tempTotal;
      };

      var getResourcesCost = function getResourcesCost() {
        var tempTotal = 0;
        for (var resource in resourceState) {
          if (resourceState.hasOwnProperty(resource)) {
            tempTotal += resourceState[resource].total;
          }
        }
        return tempTotal;
      };

      var getCostPerAttendee = function getCostPerAttendee() {
        var tempTotal = 0;

        if (pricing.get('calculationMethod') === 2) {
          tempTotal = Utils.tryParseFloat(flatPriceNode.value);
        } else {
          tempTotal = pricing.get('totalCost') / peopleAttending;
        }

        return tempTotal;
      };

      var renderUpdates = function renderUpdates() {
        costTotalNode.textContent = Utils.formatCurrency(pricing.get('totalCost'));
        costPPNode.textContent = Utils.formatCurrency(pricing.get('costPerAttendee'));
      };

      var mapResources = function mapResources() {
        var resources = [];

        for (var resourceTypeId in resourceState) {
          if (resourceState[resourceTypeId].resources instanceof Array) {
            resources = resources.concat(resourceState[resourceTypeId].resources);
          }
        }

        return resources;
      };

      resourceState = {};
      pricing = {
        _data: {
          baseCost: 0,
          costPerAttendee: 0,
          calculationMethod: 1,
          totalCost: 0
        },
        set: function set(key, value) {
          this._data[key] = value;
        },
        get: function get(key) {
          return this._data[key];
        }
      };


      window.pricing = pricing;

      peopleAttending = window.minAttendeeCount || 1;
      costTotalNode = document.getElementById('cost-total');
      costPPNode = document.getElementById('cost-pp');
      costBaseNode = document.getElementById('cost-base');
      flatPriceNode = document.getElementById('flat-price');
      resourceForm = document.getElementById('resource-form');
      calculationMethods = document.querySelectorAll('.price-method');
      cancelBtn = document.querySelector('.resource-cancel');


      cancelBtn.onclick = function () {
        window.history.back();
      };

      flatPriceNode.onchange = calcTotals;
      costBaseNode.onchange = calcTotals;

      for (var i = 0, j = calculationMethods.length; i < j; i++) {
        calculationMethods[i].onchange = function (ev) {
          pricing.set('calculationMethod', ~ ~ev.target.value);
          flatPriceNode.classList.toggle('hide');

          if (~ ~ev.target.value === 1) {
            flatPriceNode.value = null;
            calcTotals();
          }
        };
      }

      resourceForm.onsubmit = function (ev) {
        ev.currentTarget.classList.add('disabled');
        ev.preventDefault();

        var mappedData = {
          id: window.slug,
          tiers: [{
            baseCost: pricing.get('baseCost'),
            calculationMethod: pricing.get('calculationMethod'),
            costPerAttendee: pricing.get('costPerAttendee')
          }],
          resources: mapResources()
        };

        console.info('MAPPED DATA', mappedData);

        Api.post('/events/' + mappedData.id + '/update', mappedData).then(function (data) {
          window.location = '/events/' + mappedData.id;
        }, function () {
          ev.currentTarget.classList.remove('disabled');
        });
      };

      toggleButtons = document.querySelectorAll('.content-toggle');

      for (var _i = 0, _j = toggleButtons.length; _i < _j; _i++) {
        toggleButtons[_i].onclick = function (ev) {
          var button = ev.currentTarget;
          var icon = button.querySelector('.fa');
          var wrapper = Utils.findAncestor(button, 'resource-section');
          var content = wrapper.querySelector('.resource-content');

          content.classList.toggle('hidden');
          icon.classList.toggle('fa-minus-square');
          icon.classList.toggle('fa-plus-square');
        };
      }

      eventResources = document.querySelectorAll('.event-resources');


      for (var _i2 = 0, _j2 = eventResources.length; _i2 < _j2; _i2++) {
        node = eventResources[_i2];
        resource = new ResourcesController(null, node, function (type, resources, total) {
          handleChange(type, resources, total);
        });
      }
    })();
  } // End if on page logic
});