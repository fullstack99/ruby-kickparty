'use strict';

$(document).ready(function () {
  var inputs = {
    address: $('#address'),
    cvc: $('#cc-cvc'),
    default: $('#default-payment'),
    exp: $('#cc-exp'),
    name: $('#name'),
    number: $('#cc-number'),
    zipCode: $('#zip-code')
  };
  var paymentForm = $('#payment-form');
  var submitFormButton = $('#payment-submit-btn');

  // Format payment input fields
  // https://github.com/stripe/jquery.payment
  inputs.number.payment('formatCardNumber');
  inputs.cvc.payment('formatCardCVC');
  inputs.exp.payment('formatCardExpiry');

  // Helper function to add .has-error to the .form-group div
  // This probably shouldn't be a jQuery function, I'm not sure
  $.fn.toggleInputError = function (hasError) {
    this.parent('.form-group').toggleClass('has-error', hasError);
    return this;
  };

  inputs.number.blur(function (e) {
    var displayedCardType = $('.cc-brand');

    if (!$.payment.validateCardNumber(this.value)) {
      $(this).toggleInputError(true);
      displayedCardType.text('');
    } else {
      $(this).toggleInputError(false);
      var cardType = $.payment.cardType($(this).val());
      displayedCardType.text(cardType);
    }
  });

  inputs.cvc.blur(function (e) {
    var cardType = $.payment.cardType(inputs.number.val());
    $(this).toggleInputError(!$.payment.validateCardCVC(this.value, cardType));
  });

  inputs.exp.blur(function (e) {
    var expiration = $(this).payment('cardExpiryVal');
    inputs.exp.toggleInputError(!$.payment.validateCardExpiry(expiration));
  });

  inputs.name.blur(function (e) {
    // Check that there is at least two words
    if (this.value.split(' ').length < 2) {
      $(this).toggleInputError(true);
    } else {
      $(this).toggleInputError(false);
    }
  });

  inputs.address.blur(function (e) {
    // Todo: validate address
    if (!this.value) {
      $(this).toggleInputError(true);
    } else {
      $(this).toggleInputError(false);
    }
  });

  inputs.zipCode.blur(function (e) {
    if (this.value && this.value.length === 5) {
      $(this).toggleInputError(false);
    } else {
      $(this).toggleInputError(true);
    }
  });

  paymentForm.submit(function (e) {
    e.preventDefault();

    // remove previous status message
    $('.validation').removeClass('form-success form-error form-saving');

    var errors = $('.has-error');
    var inputsArray = $.map(inputs, function (input) {
      return [input];
    }); // useful to map/filter/etc over
    var emptyInputs = inputsArray.filter(function (input) {
      return !input.val();
    });

    // input fields must not have any errors, and every field is required
    if (!errors.length && emptyInputs.length === 0) {
      submitFormButton.prop('disabled', true);
      $('.validation').addClass('form-saving');

      var data = {
        cvc: inputs.cvc.val(),
        exp_month: inputs.exp.payment('cardExpiryVal').month,
        exp_year: inputs.exp.payment('cardExpiryVal').year,
        default: inputs.default.is(':checked'),
        line1: inputs.address.val(),
        name: inputs.name.val(),
        number: inputs.number.val().replace(/ /g, ''), // gets rid of whitespace
        postal_code: inputs.zipCode.val()
      };
      console.log('payment form data', data);

      // submit payment information
      Api.post('/payments', data).then(function () {
        console.info('Payment information successfully saved');
        $('.validation').removeClass('form-saving');
        $('.validation').addClass('form-success');
      }, function (error) {
        console.error('Error saving payment information', error);
        $('.validation').removeClass('form-saving');
        $('.validation').addClass('form-error');
        // TODO: Display server error?

        // enable submit button again
        submitFormButton.prop('disabled', false);
      }).catch(function (error) {
        console.error('Caught error in API promise:', error);
        $('.validation').removeClass('form-saving');
        $('.validation').addClass('form-error');
      });
    } else {
      $('.validation').addClass('form-error');
    }
  });
});