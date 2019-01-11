'use strict';

/* global moment :true */
if (document && (document.URL.indexOf('events/new') !== -1 || document.URL.indexOf('events') !== -1 && document.URL.indexOf('edit') !== -1)) {
  var formState = {
    VALIDATIONS: {
      name: {
        isRequiredMessage: 'Event name is required',
        isRequired: true,
        invalidMessage: 'What the name?',
        test: function test(value) {
          return true;
        }
      },
      eventTypeId: {
        isRequiredMessage: 'Event type is required',
        isRequired: true,
        invalidMessage: '',
        test: function test(value) {
          return true;
        }
      },
      description: {
        isRequiredMessage: 'Description is required',
        isRequired: true,
        invalidMessage: '',
        test: function test(value) {
          return true;
        }
      },
      status: {
        isRequiredMessage: 'Event status is required',
        isRequired: true,
        invalidMessage: '',
        test: function test(value) {
          return true;
        }
      },
      headerImg: {
        isRequiredMessage: '',
        isRequired: false,
        invalidMessage: '',
        test: function test(value) {
          return true;
        }
      },
      locationAddress: {
        isRequiredMessage: 'Address is required',
        isRequired: true,
        invalidMessage: '',
        test: function test(value) {
          return true;
        }
      },
      locationLat: {
        isRequiredMessage: '',
        isRequired: true,
        invalidMessage: '',
        test: function test(value) {
          return true;
        }
      },
      locationLng: {
        isRequiredMessage: '',
        isRequired: true,
        invalidMessage: '',
        test: function test(value) {
          return true;
        }
      },
      locationName: {
        isRequiredMessage: '',
        isRequired: true,
        invalidMessage: '',
        test: function test(value) {
          return true;
        }
      },
      locationCity: {
        isRequiredMessage: '',
        isRequired: true,
        invalidMessage: '',
        test: function test(value) {
          return true;
        }
      },
      locationState: {
        isRequiredMessage: '',
        isRequired: true,
        invalidMessage: '',
        test: function test(value) {
          return true;
        }
      },
      locationCountry: {
        isRequiredMessage: '',
        isRequired: true,
        invalidMessage: '',
        test: function test(value) {
          return true;
        }
      },
      startDate: {
        isRequiredMessage: 'Start Date is required',
        isRequired: true,
        invalidMessage: '',
        test: function test(value) {
          // start date must be before end date
          return true;
        }
      },
      startTime: {
        isRequiredMessage: 'Start Time is required',
        isRequired: true,
        invalidMessage: '',
        test: function test(value) {
          return true;
        }
      },
      endDate: {
        isRequiredMessage: '',
        isRequired: false,
        invalidMessage: 'End date needs to be after the start date',
        test: function test(value) {
          var isValid = true;

          if (formState.data.startDate && value) {
            var enddate = moment(value);
            var startDate = moment(formState.data.startDate);
            isValid = enddate.diff(startDate) >= 0;
          }

          return isValid;
        }
      },
      endTime: {
        isRequiredMessage: '',
        isRequired: false,
        invalidMessage: '',
        test: function test(value) {
          return true;
        }
      },
      deadline: {
        isRequiredMessage: 'Funding deadline is required',
        isRequired: true,
        invalidMessage: 'Funding deadline needs to be before the start date',
        test: function test(value) {
          var isValid = true;

          if (formState.data.startDate && value) {
            var deadline = moment(value);
            var startDate = moment(formState.data.startDate);
            isValid = startDate.diff(deadline) >= 0;
          }

          return isValid;
        }
      },
      contactPhone: {
        isRequiredMessage: '',
        isRequired: false,
        invalidMessage: 'A valid phone number is required',
        test: function test(value) {
          var re = /[(]?\d{3}[-.)]?[ ]?\d{3}[-.]?\d{4}\b/;
          return re.test(value);
        }
      },
      contactEmail: {
        isRequiredMessage: '',
        isRequired: false,
        invalidMessage: 'A valid email address is required',
        test: function test(value) {
          var re = /[_a-z0-9\.-]*[a-z0-9]+@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})/i;
          return re.test(value);
        }
      },
      attendeeCount: {
        isRequiredMessage: 'Attendee Count is required',
        isRequired: true,
        invalidMessage: '',
        test: function test(value) {
          return true;
        }
      },
      maxAttendeeCount: {
        isRequiredMessage: '',
        isRequired: false,
        invalidMessage: 'Max attendees must be more than your attendee count',
        test: function test(value) {
          var isValid = true;

          if (formState.data.attendeeCount) {
            if (~ ~formState.data.attendeeCount > ~ ~value) {
              isValid = false;
            }
          }

          return isValid;
        }
      },
      contribution: {
        isRequiredMessage: '',
        isRequired: false,
        invalidMessage: 'Contribution about must be a number',
        test: function test(value) {
          return true;
        }
      },
      contributionNote: {
        isRequiredMessage: '',
        isRequired: false,
        invalidMessage: '',
        test: function test(value) {
          return true;
        }
      }
    },
    data: {
      'status': '1' // A pristine form loads this way so we need to trigger a state update
    },
    validate: function validate(key, value) {
      var validation = this.VALIDATIONS[key];
      var valid;

      if (validation) {
        valid = {
          isMissing: false,
          hasBadData: false,
          message: ''
        };

        if (validation.isRequired && !value) {
          valid.isMissing = true;
          valid.message = validation.isRequiredMessage;
        } else if (value && !validation.test(value)) {
          valid.hasBadData = true;
          valid.message = validation.invalidMessage;
        }
      }

      return valid;
    },
    update: function update(key, value) {
      var validObj = this.validate(key, value);

      this.data[key] = value;

      if (validObj && (validObj.isMissing || validObj.hasBadData)) {
        return validObj.message;
      } else {
        return true;
      }
    },
    initState: function initState() {
      for (var key in this.VALIDATIONS) {
        var el = document.querySelector('#' + key);
        if (el) {
          this.update(key, el.value);
        }
      }
    },
    setState: function setState(state) {
      for (var key in state) {
        if (state.hasOwnProperty(key)) {
          this.update(key, state[key]);
        }
      }
    }
  };

  // If data was preloaded as in event editing
  if (window.isEditing) {
    formState.initState();
    formState.setState(window.eventLocation);
  }
}