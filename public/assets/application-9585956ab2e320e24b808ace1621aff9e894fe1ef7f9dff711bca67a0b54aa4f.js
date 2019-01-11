(function($, undefined) {

/**
 * Unobtrusive scripting adapter for jQuery
 * https://github.com/rails/jquery-ujs
 *
 * Requires jQuery 1.8.0 or later.
 *
 * Released under the MIT license
 *
 */

  // Cut down on the number of issues from people inadvertently including jquery_ujs twice
  // by detecting and raising an error when it happens.
  'use strict';

  if ( $.rails !== undefined ) {
    $.error('jquery-ujs has already been loaded!');
  }

  // Shorthand to make it a little easier to call public rails functions from within rails.js
  var rails;
  var $document = $(document);

  $.rails = rails = {
    // Link elements bound by jquery-ujs
    linkClickSelector: 'a[data-confirm], a[data-method], a[data-remote]:not([disabled]), a[data-disable-with], a[data-disable]',

    // Button elements bound by jquery-ujs
    buttonClickSelector: 'button[data-remote]:not([form]):not(form button), button[data-confirm]:not([form]):not(form button)',

    // Select elements bound by jquery-ujs
    inputChangeSelector: 'select[data-remote], input[data-remote], textarea[data-remote]',

    // Form elements bound by jquery-ujs
    formSubmitSelector: 'form',

    // Form input elements bound by jquery-ujs
    formInputClickSelector: 'form input[type=submit], form input[type=image], form button[type=submit], form button:not([type]), input[type=submit][form], input[type=image][form], button[type=submit][form], button[form]:not([type])',

    // Form input elements disabled during form submission
    disableSelector: 'input[data-disable-with]:enabled, button[data-disable-with]:enabled, textarea[data-disable-with]:enabled, input[data-disable]:enabled, button[data-disable]:enabled, textarea[data-disable]:enabled',

    // Form input elements re-enabled after form submission
    enableSelector: 'input[data-disable-with]:disabled, button[data-disable-with]:disabled, textarea[data-disable-with]:disabled, input[data-disable]:disabled, button[data-disable]:disabled, textarea[data-disable]:disabled',

    // Form required input elements
    requiredInputSelector: 'input[name][required]:not([disabled]), textarea[name][required]:not([disabled])',

    // Form file input elements
    fileInputSelector: 'input[type=file]:not([disabled])',

    // Link onClick disable selector with possible reenable after remote submission
    linkDisableSelector: 'a[data-disable-with], a[data-disable]',

    // Button onClick disable selector with possible reenable after remote submission
    buttonDisableSelector: 'button[data-remote][data-disable-with], button[data-remote][data-disable]',

    // Up-to-date Cross-Site Request Forgery token
    csrfToken: function() {
     return $('meta[name=csrf-token]').attr('content');
    },

    // URL param that must contain the CSRF token
    csrfParam: function() {
     return $('meta[name=csrf-param]').attr('content');
    },

    // Make sure that every Ajax request sends the CSRF token
    CSRFProtection: function(xhr) {
      var token = rails.csrfToken();
      if (token) xhr.setRequestHeader('X-CSRF-Token', token);
    },

    // Make sure that all forms have actual up-to-date tokens (cached forms contain old ones)
    refreshCSRFTokens: function(){
      $('form input[name="' + rails.csrfParam() + '"]').val(rails.csrfToken());
    },

    // Triggers an event on an element and returns false if the event result is false
    fire: function(obj, name, data) {
      var event = $.Event(name);
      obj.trigger(event, data);
      return event.result !== false;
    },

    // Default confirm dialog, may be overridden with custom confirm dialog in $.rails.confirm
    confirm: function(message) {
      return confirm(message);
    },

    // Default ajax function, may be overridden with custom function in $.rails.ajax
    ajax: function(options) {
      return $.ajax(options);
    },

    // Default way to get an element's href. May be overridden at $.rails.href.
    href: function(element) {
      return element[0].href;
    },

    // Checks "data-remote" if true to handle the request through a XHR request.
    isRemote: function(element) {
      return element.data('remote') !== undefined && element.data('remote') !== false;
    },

    // Submits "remote" forms and links with ajax
    handleRemote: function(element) {
      var method, url, data, withCredentials, dataType, options;

      if (rails.fire(element, 'ajax:before')) {
        withCredentials = element.data('with-credentials') || null;
        dataType = element.data('type') || ($.ajaxSettings && $.ajaxSettings.dataType);

        if (element.is('form')) {
          method = element.data('ujs:submit-button-formmethod') || element.attr('method');
          url = element.data('ujs:submit-button-formaction') || element.attr('action');
          data = $(element[0]).serializeArray();
          // memoized value from clicked submit button
          var button = element.data('ujs:submit-button');
          if (button) {
            data.push(button);
            element.data('ujs:submit-button', null);
          }
          element.data('ujs:submit-button-formmethod', null);
          element.data('ujs:submit-button-formaction', null);
        } else if (element.is(rails.inputChangeSelector)) {
          method = element.data('method');
          url = element.data('url');
          data = element.serialize();
          if (element.data('params')) data = data + '&' + element.data('params');
        } else if (element.is(rails.buttonClickSelector)) {
          method = element.data('method') || 'get';
          url = element.data('url');
          data = element.serialize();
          if (element.data('params')) data = data + '&' + element.data('params');
        } else {
          method = element.data('method');
          url = rails.href(element);
          data = element.data('params') || null;
        }

        options = {
          type: method || 'GET', data: data, dataType: dataType,
          // stopping the "ajax:beforeSend" event will cancel the ajax request
          beforeSend: function(xhr, settings) {
            if (settings.dataType === undefined) {
              xhr.setRequestHeader('accept', '*/*;q=0.5, ' + settings.accepts.script);
            }
            if (rails.fire(element, 'ajax:beforeSend', [xhr, settings])) {
              element.trigger('ajax:send', xhr);
            } else {
              return false;
            }
          },
          success: function(data, status, xhr) {
            element.trigger('ajax:success', [data, status, xhr]);
          },
          complete: function(xhr, status) {
            element.trigger('ajax:complete', [xhr, status]);
          },
          error: function(xhr, status, error) {
            element.trigger('ajax:error', [xhr, status, error]);
          },
          crossDomain: rails.isCrossDomain(url)
        };

        // There is no withCredentials for IE6-8 when
        // "Enable native XMLHTTP support" is disabled
        if (withCredentials) {
          options.xhrFields = {
            withCredentials: withCredentials
          };
        }

        // Only pass url to `ajax` options if not blank
        if (url) { options.url = url; }

        return rails.ajax(options);
      } else {
        return false;
      }
    },

    // Determines if the request is a cross domain request.
    isCrossDomain: function(url) {
      var originAnchor = document.createElement('a');
      originAnchor.href = location.href;
      var urlAnchor = document.createElement('a');

      try {
        urlAnchor.href = url;
        // This is a workaround to a IE bug.
        urlAnchor.href = urlAnchor.href;

        // If URL protocol is false or is a string containing a single colon
        // *and* host are false, assume it is not a cross-domain request
        // (should only be the case for IE7 and IE compatibility mode).
        // Otherwise, evaluate protocol and host of the URL against the origin
        // protocol and host.
        return !(((!urlAnchor.protocol || urlAnchor.protocol === ':') && !urlAnchor.host) ||
          (originAnchor.protocol + '//' + originAnchor.host ===
            urlAnchor.protocol + '//' + urlAnchor.host));
      } catch (e) {
        // If there is an error parsing the URL, assume it is crossDomain.
        return true;
      }
    },

    // Handles "data-method" on links such as:
    // <a href="/users/5" data-method="delete" rel="nofollow" data-confirm="Are you sure?">Delete</a>
    handleMethod: function(link) {
      var href = rails.href(link),
        method = link.data('method'),
        target = link.attr('target'),
        csrfToken = rails.csrfToken(),
        csrfParam = rails.csrfParam(),
        form = $('<form method="post" action="' + href + '"></form>'),
        metadataInput = '<input name="_method" value="' + method + '" type="hidden" />';

      if (csrfParam !== undefined && csrfToken !== undefined && !rails.isCrossDomain(href)) {
        metadataInput += '<input name="' + csrfParam + '" value="' + csrfToken + '" type="hidden" />';
      }

      if (target) { form.attr('target', target); }

      form.hide().append(metadataInput).appendTo('body');
      form.submit();
    },

    // Helper function that returns form elements that match the specified CSS selector
    // If form is actually a "form" element this will return associated elements outside the from that have
    // the html form attribute set
    formElements: function(form, selector) {
      return form.is('form') ? $(form[0].elements).filter(selector) : form.find(selector);
    },

    /* Disables form elements:
      - Caches element value in 'ujs:enable-with' data store
      - Replaces element text with value of 'data-disable-with' attribute
      - Sets disabled property to true
    */
    disableFormElements: function(form) {
      rails.formElements(form, rails.disableSelector).each(function() {
        rails.disableFormElement($(this));
      });
    },

    disableFormElement: function(element) {
      var method, replacement;

      method = element.is('button') ? 'html' : 'val';
      replacement = element.data('disable-with');

      if (replacement !== undefined) {
        element.data('ujs:enable-with', element[method]());
        element[method](replacement);
      }

      element.prop('disabled', true);
      element.data('ujs:disabled', true);
    },

    /* Re-enables disabled form elements:
      - Replaces element text with cached value from 'ujs:enable-with' data store (created in `disableFormElements`)
      - Sets disabled property to false
    */
    enableFormElements: function(form) {
      rails.formElements(form, rails.enableSelector).each(function() {
        rails.enableFormElement($(this));
      });
    },

    enableFormElement: function(element) {
      var method = element.is('button') ? 'html' : 'val';
      if (element.data('ujs:enable-with') !== undefined) {
        element[method](element.data('ujs:enable-with'));
        element.removeData('ujs:enable-with'); // clean up cache
      }
      element.prop('disabled', false);
      element.removeData('ujs:disabled');
    },

   /* For 'data-confirm' attribute:
      - Fires `confirm` event
      - Shows the confirmation dialog
      - Fires the `confirm:complete` event

      Returns `true` if no function stops the chain and user chose yes; `false` otherwise.
      Attaching a handler to the element's `confirm` event that returns a `falsy` value cancels the confirmation dialog.
      Attaching a handler to the element's `confirm:complete` event that returns a `falsy` value makes this function
      return false. The `confirm:complete` event is fired whether or not the user answered true or false to the dialog.
   */
    allowAction: function(element) {
      var message = element.data('confirm'),
          answer = false, callback;
      if (!message) { return true; }

      if (rails.fire(element, 'confirm')) {
        try {
          answer = rails.confirm(message);
        } catch (e) {
          (console.error || console.log).call(console, e.stack || e);
        }
        callback = rails.fire(element, 'confirm:complete', [answer]);
      }
      return answer && callback;
    },

    // Helper function which checks for blank inputs in a form that match the specified CSS selector
    blankInputs: function(form, specifiedSelector, nonBlank) {
      var foundInputs = $(),
        input,
        valueToCheck,
        radiosForNameWithNoneSelected,
        radioName,
        selector = specifiedSelector || 'input,textarea',
        requiredInputs = form.find(selector),
        checkedRadioButtonNames = {};

      requiredInputs.each(function() {
        input = $(this);
        if (input.is('input[type=radio]')) {

          // Don't count unchecked required radio as blank if other radio with same name is checked,
          // regardless of whether same-name radio input has required attribute or not. The spec
          // states https://www.w3.org/TR/html5/forms.html#the-required-attribute
          radioName = input.attr('name');

          // Skip if we've already seen the radio with this name.
          if (!checkedRadioButtonNames[radioName]) {

            // If none checked
            if (form.find('input[type=radio]:checked[name="' + radioName + '"]').length === 0) {
              radiosForNameWithNoneSelected = form.find(
                'input[type=radio][name="' + radioName + '"]');
              foundInputs = foundInputs.add(radiosForNameWithNoneSelected);
            }

            // We only need to check each name once.
            checkedRadioButtonNames[radioName] = radioName;
          }
        } else {
          valueToCheck = input.is('input[type=checkbox],input[type=radio]') ? input.is(':checked') : !!input.val();
          if (valueToCheck === nonBlank) {
            foundInputs = foundInputs.add(input);
          }
        }
      });
      return foundInputs.length ? foundInputs : false;
    },

    // Helper function which checks for non-blank inputs in a form that match the specified CSS selector
    nonBlankInputs: function(form, specifiedSelector) {
      return rails.blankInputs(form, specifiedSelector, true); // true specifies nonBlank
    },

    // Helper function, needed to provide consistent behavior in IE
    stopEverything: function(e) {
      $(e.target).trigger('ujs:everythingStopped');
      e.stopImmediatePropagation();
      return false;
    },

    //  Replace element's html with the 'data-disable-with' after storing original html
    //  and prevent clicking on it
    disableElement: function(element) {
      var replacement = element.data('disable-with');

      if (replacement !== undefined) {
        element.data('ujs:enable-with', element.html()); // store enabled state
        element.html(replacement);
      }

      element.bind('click.railsDisable', function(e) { // prevent further clicking
        return rails.stopEverything(e);
      });
      element.data('ujs:disabled', true);
    },

    // Restore element to its original state which was disabled by 'disableElement' above
    enableElement: function(element) {
      if (element.data('ujs:enable-with') !== undefined) {
        element.html(element.data('ujs:enable-with')); // set to old enabled state
        element.removeData('ujs:enable-with'); // clean up cache
      }
      element.unbind('click.railsDisable'); // enable element
      element.removeData('ujs:disabled');
    }
  };

  if (rails.fire($document, 'rails:attachBindings')) {

    $.ajaxPrefilter(function(options, originalOptions, xhr){ if ( !options.crossDomain ) { rails.CSRFProtection(xhr); }});

    // This event works the same as the load event, except that it fires every
    // time the page is loaded.
    //
    // See https://github.com/rails/jquery-ujs/issues/357
    // See https://developer.mozilla.org/en-US/docs/Using_Firefox_1.5_caching
    $(window).on('pageshow.rails', function () {
      $($.rails.enableSelector).each(function () {
        var element = $(this);

        if (element.data('ujs:disabled')) {
          $.rails.enableFormElement(element);
        }
      });

      $($.rails.linkDisableSelector).each(function () {
        var element = $(this);

        if (element.data('ujs:disabled')) {
          $.rails.enableElement(element);
        }
      });
    });

    $document.delegate(rails.linkDisableSelector, 'ajax:complete', function() {
        rails.enableElement($(this));
    });

    $document.delegate(rails.buttonDisableSelector, 'ajax:complete', function() {
        rails.enableFormElement($(this));
    });

    $document.delegate(rails.linkClickSelector, 'click.rails', function(e) {
      var link = $(this), method = link.data('method'), data = link.data('params'), metaClick = e.metaKey || e.ctrlKey;
      if (!rails.allowAction(link)) return rails.stopEverything(e);

      if (!metaClick && link.is(rails.linkDisableSelector)) rails.disableElement(link);

      if (rails.isRemote(link)) {
        if (metaClick && (!method || method === 'GET') && !data) { return true; }

        var handleRemote = rails.handleRemote(link);
        // Response from rails.handleRemote() will either be false or a deferred object promise.
        if (handleRemote === false) {
          rails.enableElement(link);
        } else {
          handleRemote.fail( function() { rails.enableElement(link); } );
        }
        return false;

      } else if (method) {
        rails.handleMethod(link);
        return false;
      }
    });

    $document.delegate(rails.buttonClickSelector, 'click.rails', function(e) {
      var button = $(this);

      if (!rails.allowAction(button) || !rails.isRemote(button)) return rails.stopEverything(e);

      if (button.is(rails.buttonDisableSelector)) rails.disableFormElement(button);

      var handleRemote = rails.handleRemote(button);
      // Response from rails.handleRemote() will either be false or a deferred object promise.
      if (handleRemote === false) {
        rails.enableFormElement(button);
      } else {
        handleRemote.fail( function() { rails.enableFormElement(button); } );
      }
      return false;
    });

    $document.delegate(rails.inputChangeSelector, 'change.rails', function(e) {
      var link = $(this);
      if (!rails.allowAction(link) || !rails.isRemote(link)) return rails.stopEverything(e);

      rails.handleRemote(link);
      return false;
    });

    $document.delegate(rails.formSubmitSelector, 'submit.rails', function(e) {
      var form = $(this),
        remote = rails.isRemote(form),
        blankRequiredInputs,
        nonBlankFileInputs;

      if (!rails.allowAction(form)) return rails.stopEverything(e);

      // Skip other logic when required values are missing or file upload is present
      if (form.attr('novalidate') === undefined) {
        if (form.data('ujs:formnovalidate-button') === undefined) {
          blankRequiredInputs = rails.blankInputs(form, rails.requiredInputSelector, false);
          if (blankRequiredInputs && rails.fire(form, 'ajax:aborted:required', [blankRequiredInputs])) {
            return rails.stopEverything(e);
          }
        } else {
          // Clear the formnovalidate in case the next button click is not on a formnovalidate button
          // Not strictly necessary to do here, since it is also reset on each button click, but just to be certain
          form.data('ujs:formnovalidate-button', undefined);
        }
      }

      if (remote) {
        nonBlankFileInputs = rails.nonBlankInputs(form, rails.fileInputSelector);
        if (nonBlankFileInputs) {
          // Slight timeout so that the submit button gets properly serialized
          // (make it easy for event handler to serialize form without disabled values)
          setTimeout(function(){ rails.disableFormElements(form); }, 13);
          var aborted = rails.fire(form, 'ajax:aborted:file', [nonBlankFileInputs]);

          // Re-enable form elements if event bindings return false (canceling normal form submission)
          if (!aborted) { setTimeout(function(){ rails.enableFormElements(form); }, 13); }

          return aborted;
        }

        rails.handleRemote(form);
        return false;

      } else {
        // Slight timeout so that the submit button gets properly serialized
        setTimeout(function(){ rails.disableFormElements(form); }, 13);
      }
    });

    $document.delegate(rails.formInputClickSelector, 'click.rails', function(event) {
      var button = $(this);

      if (!rails.allowAction(button)) return rails.stopEverything(event);

      // Register the pressed submit button
      var name = button.attr('name'),
        data = name ? {name:name, value:button.val()} : null;

      var form = button.closest('form');
      if (form.length === 0) {
        form = $('#' + button.attr('form'));
      }
      form.data('ujs:submit-button', data);

      // Save attributes from button
      form.data('ujs:formnovalidate-button', button.attr('formnovalidate'));
      form.data('ujs:submit-button-formaction', button.attr('formaction'));
      form.data('ujs:submit-button-formmethod', button.attr('formmethod'));
    });

    $document.delegate(rails.formSubmitSelector, 'ajax:send.rails', function(event) {
      if (this === event.target) rails.disableFormElements($(this));
    });

    $document.delegate(rails.formSubmitSelector, 'ajax:complete.rails', function(event) {
      if (this === event.target) rails.enableFormElements($(this));
    });

    $(function(){
      rails.refreshCSRFTokens();
    });
  }

})( jQuery );
(function(){var t,e,n,r,a,o,i,l,u,s,c,h,p,g,v,f,d,m,y,C,T,w,$,D,S=[].slice,k=[].indexOf||function(t){for(var e=0,n=this.length;n>e;e++)if(e in this&&this[e]===t)return e;return-1};t=window.jQuery||window.Zepto||window.$,t.payment={},t.payment.fn={},t.fn.payment=function(){var e,n;return n=arguments[0],e=2<=arguments.length?S.call(arguments,1):[],t.payment.fn[n].apply(this,e)},a=/(\d{1,4})/g,t.payment.cards=r=[{type:"visaelectron",patterns:[4026,417500,4405,4508,4844,4913,4917],format:a,length:[16],cvcLength:[3],luhn:!0},{type:"maestro",patterns:[5018,502,503,506,56,58,639,6220,67],format:a,length:[12,13,14,15,16,17,18,19],cvcLength:[3],luhn:!0},{type:"forbrugsforeningen",patterns:[600],format:a,length:[16],cvcLength:[3],luhn:!0},{type:"dankort",patterns:[5019],format:a,length:[16],cvcLength:[3],luhn:!0},{type:"elo",patterns:[4011,4312,4389,4514,4573,4576,5041,5066,5067,509,6277,6362,6363,650,6516,6550],format:a,length:[16],cvcLength:[3],luhn:!0},{type:"visa",patterns:[4],format:a,length:[13,16],cvcLength:[3],luhn:!0},{type:"mastercard",patterns:[51,52,53,54,55,22,23,24,25,26,27],format:a,length:[16],cvcLength:[3],luhn:!0},{type:"amex",patterns:[34,37],format:/(\d{1,4})(\d{1,6})?(\d{1,5})?/,length:[15],cvcLength:[3,4],luhn:!0},{type:"dinersclub",patterns:[30,36,38,39],format:/(\d{1,4})(\d{1,6})?(\d{1,4})?/,length:[14],cvcLength:[3],luhn:!0},{type:"discover",patterns:[60,64,65,622],format:a,length:[16],cvcLength:[3],luhn:!0},{type:"unionpay",patterns:[62,88],format:a,length:[16,17,18,19],cvcLength:[3],luhn:!1},{type:"jcb",patterns:[35],format:a,length:[16],cvcLength:[3],luhn:!0}],e=function(t){var e,n,a,o,i,l,u,s;for(t=(t+"").replace(/\D/g,""),o=0,l=r.length;l>o;o++)for(e=r[o],s=e.patterns,i=0,u=s.length;u>i;i++)if(a=s[i],n=a+"",t.substr(0,n.length)===n)return e},n=function(t){var e,n,a;for(n=0,a=r.length;a>n;n++)if(e=r[n],e.type===t)return e},p=function(t){var e,n,r,a,o,i;for(r=!0,a=0,n=(t+"").split("").reverse(),o=0,i=n.length;i>o;o++)e=n[o],e=parseInt(e,10),(r=!r)&&(e*=2),e>9&&(e-=9),a+=e;return a%10===0},h=function(t){var e;return null!=t.prop("selectionStart")&&t.prop("selectionStart")!==t.prop("selectionEnd")?!0:null!=("undefined"!=typeof document&&null!==document&&null!=(e=document.selection)?e.createRange:void 0)&&document.selection.createRange().text?!0:!1},$=function(t,e){var n,r,a,o,i,l;try{r=e.prop("selectionStart")}catch(u){o=u,r=null}return i=e.val(),e.val(t),null!==r&&e.is(":focus")?(r===i.length&&(r=t.length),i!==t&&(l=i.slice(r-1,+r+1||9e9),n=t.slice(r-1,+r+1||9e9),a=t[r],/\d/.test(a)&&l===""+a+" "&&n===" "+a&&(r+=1)),e.prop("selectionStart",r),e.prop("selectionEnd",r)):void 0},m=function(t){var e,n,r,a,o,i,l,u;for(null==t&&(t=""),r="０１２３４５６７８９",a="0123456789",i="",e=t.split(""),l=0,u=e.length;u>l;l++)n=e[l],o=r.indexOf(n),o>-1&&(n=a[o]),i+=n;return i},d=function(e){var n;return n=t(e.currentTarget),setTimeout(function(){var t;return t=n.val(),t=m(t),t=t.replace(/\D/g,""),$(t,n)})},v=function(e){var n;return n=t(e.currentTarget),setTimeout(function(){var e;return e=n.val(),e=m(e),e=t.payment.formatCardNumber(e),$(e,n)})},l=function(n){var r,a,o,i,l,u,s;return o=String.fromCharCode(n.which),!/^\d+$/.test(o)||(r=t(n.currentTarget),s=r.val(),a=e(s+o),i=(s.replace(/\D/g,"")+o).length,u=16,a&&(u=a.length[a.length.length-1]),i>=u||null!=r.prop("selectionStart")&&r.prop("selectionStart")!==s.length)?void 0:(l=a&&"amex"===a.type?/^(\d{4}|\d{4}\s\d{6})$/:/(?:^|\s)(\d{4})$/,l.test(s)?(n.preventDefault(),setTimeout(function(){return r.val(s+" "+o)})):l.test(s+o)?(n.preventDefault(),setTimeout(function(){return r.val(s+o+" ")})):void 0)},o=function(e){var n,r;return n=t(e.currentTarget),r=n.val(),8!==e.which||null!=n.prop("selectionStart")&&n.prop("selectionStart")!==r.length?void 0:/\d\s$/.test(r)?(e.preventDefault(),setTimeout(function(){return n.val(r.replace(/\d\s$/,""))})):/\s\d?$/.test(r)?(e.preventDefault(),setTimeout(function(){return n.val(r.replace(/\d$/,""))})):void 0},f=function(e){var n;return n=t(e.currentTarget),setTimeout(function(){var e;return e=n.val(),e=m(e),e=t.payment.formatExpiry(e),$(e,n)})},u=function(e){var n,r,a;return r=String.fromCharCode(e.which),/^\d+$/.test(r)?(n=t(e.currentTarget),a=n.val()+r,/^\d$/.test(a)&&"0"!==a&&"1"!==a?(e.preventDefault(),setTimeout(function(){return n.val("0"+a+" / ")})):/^\d\d$/.test(a)?(e.preventDefault(),setTimeout(function(){var t,e;return t=parseInt(a[0],10),e=parseInt(a[1],10),e>2&&0!==t?n.val("0"+t+" / "+e):n.val(""+a+" / ")})):void 0):void 0},s=function(e){var n,r,a;return r=String.fromCharCode(e.which),/^\d+$/.test(r)?(n=t(e.currentTarget),a=n.val(),/^\d\d$/.test(a)?n.val(""+a+" / "):void 0):void 0},c=function(e){var n,r,a;return a=String.fromCharCode(e.which),"/"===a||" "===a?(n=t(e.currentTarget),r=n.val(),/^\d$/.test(r)&&"0"!==r?n.val("0"+r+" / "):void 0):void 0},i=function(e){var n,r;return n=t(e.currentTarget),r=n.val(),8!==e.which||null!=n.prop("selectionStart")&&n.prop("selectionStart")!==r.length?void 0:/\d\s\/\s$/.test(r)?(e.preventDefault(),setTimeout(function(){return n.val(r.replace(/\d\s\/\s$/,""))})):void 0},g=function(e){var n;return n=t(e.currentTarget),setTimeout(function(){var t;return t=n.val(),t=m(t),t=t.replace(/\D/g,"").slice(0,4),$(t,n)})},w=function(t){var e;return t.metaKey||t.ctrlKey?!0:32===t.which?!1:0===t.which?!0:t.which<33?!0:(e=String.fromCharCode(t.which),!!/[\d\s]/.test(e))},C=function(n){var r,a,o,i;return r=t(n.currentTarget),o=String.fromCharCode(n.which),/^\d+$/.test(o)&&!h(r)?(i=(r.val()+o).replace(/\D/g,""),a=e(i),a?i.length<=a.length[a.length.length-1]:i.length<=16):void 0},T=function(e){var n,r,a;return n=t(e.currentTarget),r=String.fromCharCode(e.which),/^\d+$/.test(r)&&!h(n)?(a=n.val()+r,a=a.replace(/\D/g,""),a.length>6?!1:void 0):void 0},y=function(e){var n,r,a;return n=t(e.currentTarget),r=String.fromCharCode(e.which),/^\d+$/.test(r)&&!h(n)?(a=n.val()+r,a.length<=4):void 0},D=function(e){var n,a,o,i,l;return n=t(e.currentTarget),l=n.val(),i=t.payment.cardType(l)||"unknown",n.hasClass(i)?void 0:(a=function(){var t,e,n;for(n=[],t=0,e=r.length;e>t;t++)o=r[t],n.push(o.type);return n}(),n.removeClass("unknown"),n.removeClass(a.join(" ")),n.addClass(i),n.toggleClass("identified","unknown"!==i),n.trigger("payment.cardType",i))},t.payment.fn.formatCardCVC=function(){return this.on("keypress",w),this.on("keypress",y),this.on("paste",g),this.on("change",g),this.on("input",g),this},t.payment.fn.formatCardExpiry=function(){return this.on("keypress",w),this.on("keypress",T),this.on("keypress",u),this.on("keypress",c),this.on("keypress",s),this.on("keydown",i),this.on("change",f),this.on("input",f),this},t.payment.fn.formatCardNumber=function(){return this.on("keypress",w),this.on("keypress",C),this.on("keypress",l),this.on("keydown",o),this.on("keyup",D),this.on("paste",v),this.on("change",v),this.on("input",v),this.on("input",D),this},t.payment.fn.restrictNumeric=function(){return this.on("keypress",w),this.on("paste",d),this.on("change",d),this.on("input",d),this},t.payment.fn.cardExpiryVal=function(){return t.payment.cardExpiryVal(t(this).val())},t.payment.cardExpiryVal=function(t){var e,n,r,a;return a=t.split(/[\s\/]+/,2),e=a[0],r=a[1],2===(null!=r?r.length:void 0)&&/^\d+$/.test(r)&&(n=(new Date).getFullYear(),n=n.toString().slice(0,2),r=n+r),e=parseInt(e,10),r=parseInt(r,10),{month:e,year:r}},t.payment.validateCardNumber=function(t){var n,r;return t=(t+"").replace(/\s+|-/g,""),/^\d+$/.test(t)?(n=e(t),n?(r=t.length,k.call(n.length,r)>=0&&(n.luhn===!1||p(t))):!1):!1},t.payment.validateCardExpiry=function(e,n){var r,a,o;return"object"==typeof e&&"month"in e&&(o=e,e=o.month,n=o.year),e&&n?(e=t.trim(e),n=t.trim(n),/^\d+$/.test(e)&&/^\d+$/.test(n)&&e>=1&&12>=e?(2===n.length&&(n=70>n?"20"+n:"19"+n),4!==n.length?!1:(a=new Date(n,e),r=new Date,a.setMonth(a.getMonth()-1),a.setMonth(a.getMonth()+1,1),a>r)):!1):!1},t.payment.validateCardCVC=function(e,r){var a,o;return e=t.trim(e),/^\d+$/.test(e)?(a=n(r),null!=a?(o=e.length,k.call(a.cvcLength,o)>=0):e.length>=3&&e.length<=4):!1},t.payment.cardType=function(t){var n;return t?(null!=(n=e(t))?n.type:void 0)||null:null},t.payment.formatCardNumber=function(n){var r,a,o,i;return n=n.replace(/\D/g,""),(r=e(n))?(o=r.length[r.length.length-1],n=n.slice(0,o),r.format.global?null!=(i=n.match(r.format))?i.join(" "):void 0:(a=r.format.exec(n),null!=a?(a.shift(),a=t.grep(a,function(t){return t}),a.join(" ")):void 0)):n},t.payment.formatExpiry=function(t){var e,n,r,a;return(n=t.match(/^\D*(\d{1,2})(\D+)?(\d{1,4})?/))?(e=n[1]||"",r=n[2]||"",a=n[3]||"",a.length>0?r=" / ":" /"===r?(e=e.substring(0,1),r=""):2===e.length||r.length>0?r=" / ":1===e.length&&"0"!==e&&"1"!==e&&(e="0"+e,r=" / "),e+r+a):""}}).call(this);
'use strict';

var Utils = {};

Utils.formatCurrency = function (num) {
  var symbol = arguments.length <= 1 || arguments[1] === undefined ? '$' : arguments[1];

  if (typeof num === 'string') {
    num = this.tryParseFloat(num);
  }

  if (!num) {
    return '$0';
  }

  return num ? symbol + num.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,') : symbol;
};

Utils.truncate = function (string) {
  return string.length > 5 ? string.substring(0, 100) + '...' : string;
};

Utils.tryParseBool = function (val) {
  if (val && typeof val === 'boolean') {
    return val;
  } else {
    return false;
  }
};

Utils.tryParseString = function (val) {
  if (val && typeof val === 'string') {
    return val;
  } else {
    return '';
  }
};

Utils.tryParseFloat = function (val) {
  var parsedNum = parseFloat(val);
  return !isNaN(parsedNum) ? parsedNum : false;
};

Utils.tryParseInt = function (val) {
  var parsedNum = parseFloat(val);
  return !isNaN(parsedNum) ? parsedNum : false;
};

Utils.commaSeparated = function (value) {
  return value.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
};

Utils.loadScript = function (url, cb) {
  var script = document.createElement('script');
  script.type = 'text/javascript';

  if (script.readyState) {
    // IE
    script.onreadystatechange = function () {
      if (script.readyState === 'loaded' || script.readyState === 'complete') {
        script.onreadystatechange = null;

        if (cb && cb instanceof Function) {
          cb();
        }
      }
    };
  } else {
    script.onload = function () {
      if (cb && cb instanceof Function) {
        cb();
      }
    };
  }

  script.src = url;
  document.getElementsByTagName('head')[0].appendChild(script);
};

// Searches up the DOM to find an ancestor by class name
Utils.findAncestor = function (el, className) {
  while (el.className.indexOf(className) === -1) {
    el = el.parentElement;
  }

  return el;
};

// Creates DOM nodes
Utils.nodeFactory = function (tag, classes, content, attrs) {
  var node = document.createElement(tag);

  if (classes) {
    for (var i = 0, j = classes.length; i < j; i++) {
      node.classList.add(classes[i]);
    }
  }

  if (content) {
    node.innerHTML = content;
  }

  if (attrs) {
    for (var key in attrs) {
      if (attrs.hasOwnProperty(key)) {
        node.setAttribute(key, attrs[key]);
      }
    }
  }

  return node;
};
'use strict';

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
  report: function report() {
    var errorReporter = document.getElementById('error-reporter');
    var errors = document.getElementById('errors');

    if (!errorReporter || !errors) {
      return;
    }

    errorReporter.style.display = this.errors.length === 0 ? 'none' : 'block';

    var ul = document.createElement('ul');

    for (var i = 0; i < this.errors.length; i++) {
      var error = this.errors[i];
      var li = document.createElement('li');
      li.textContent = error.message;
      ul.appendChild(li);
    }

    while (errors.firstChild) {
      errors.removeChild(errors.firstChild);
    }

    errors.appendChild(ul);
  },
  add: function add(key, message) {
    var isNew = true;

    // Loop over all the existing errors and make sure this is not a dup
    for (var i = 0, j = this.errors.length; i < j; i++) {
      if (this.errors[i].name === key) {
        isNew = false;
        break;
      }
    }

    if (isNew) {
      this.errors.push({
        name: key,
        message: message
      });
    }

    this.report();
  },
  remove: function remove(key) {
    for (var i = 0; i < this.errors.length; i++) {
      var error = this.errors[i];
      if (error.name === key) {
        this.errors.splice(i, 1);
        break;
      }
    }

    this.report();
  }
};
'use strict';

/* global moment :true */
if (document && document.URL.indexOf('events/new') !== -1) {
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
    data: {},
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
    initState: function initState(state) {
      for (var key in state) {
        if (state.hasOwnProperty(key)) {
          this.update(key, state[key]);
        }
      }
    }
  };

  // The form loads this way so we need to trigger a state update
  formState.initState({
    'status': '1'
  });
}
;
'use strict';

/* global ErrorService formState :true */

// Form Handler
if (document && document.URL.indexOf('events/new') !== -1) {
  $(document).ready(function () {
    var eventForm = document.querySelector('#event-form');

    eventForm.addEventListener('change', function (ev) {
      var updateResult = formState.update(ev.target.name, ev.target.value);

      // string returned means an error message
      if (typeof updateResult === 'string') {
        ev.target.classList.add('error');
      } else {
        ev.target.classList.remove('error');
      }
    });

    eventForm.onsubmit = function (ev) {
      for (var key in formState.VALIDATIONS) {
        ErrorService.remove(key);

        var validation = formState.VALIDATIONS[key];
        var inputValue = formState.data[key];

        if (!inputValue || inputValue === '') {
          // No value and has a isRequiredMessage
          // We use this over isRequired bc some of the values are not visible
          // to the user like lat and lng
          if (validation.isRequiredMessage) {
            ErrorService.add(key, validation.isRequiredMessage);
          }
        } else if (inputValue) {
          // if we have a value it needs to be valid
          if (!validation.test(inputValue)) {
            ErrorService.add(key, validation.invalidMessage);
          }
        }
      }

      if (ErrorService.errors.length === 0) {
        return true;
      } else {
        return false;
      }
    };
  });
}
;
'use strict';

/* global Utils tinymce formState :true */
// TINY MCE

(function () {
  if (document && document.URL.indexOf('events/new') === -1) {
    return;
  }

  Utils.loadScript('//cdn.tinymce.com/4/tinymce.min.js', function () {
    tinymce.init({
      setup: function setup(editor) {
        editor.on('change', function (ev) {
          var content = editor.getContent();
          formState.update('description', content);
        });
      },
      invalid_elements: 'script',
      selector: '#description',
      plugins: ['advlist autolink lists link image charmap print preview hr anchor pagebreak', 'searchreplace wordcount visualblocks visualchars code fullscreen', 'insertdatetime media nonbreaking save table contextmenu directionality', 'emoticons template paste textcolor colorpicker textpattern imagetools'],
      toolbar1: 'insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image | preview media | forecolor backcolor emoticons'
    });
  });
})();
'use strict';

/* global Utils formState google :true */

// GOOGLE MAPS
function initAutocomplete() {
  var mapDiv = document.getElementById('map');

  if (!mapDiv) {
    return;
  }

  var ELEVATE_BLUE = { lat: 39.2494644, lng: -119.954313 };
  var OPTIONS = {
    center: ELEVATE_BLUE,
    scrollwheel: true,
    zoom: 15,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  var map = new google.maps.Map(mapDiv, OPTIONS);

  // Get the search box and link it to the UI element.
  var input = document.getElementById('pac-input');

  // If the enter key is hit, do not submit the form
  google.maps.event.addDomListener(input, 'keydown', function (ev) {
    if (ev.keyCode === 13) {
      ev.preventDefault();
    }
  });

  var searchBox = new google.maps.places.SearchBox(input);

  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

  // Bias the SearchBox results towards current map's viewport.
  map.addListener('bounds_changed', function () {
    searchBox.setBounds(map.getBounds());
  });

  var markers = [];

  // Listen for the event fired when the user selects a prediction and retrieve more details for that place.
  searchBox.addListener('places_changed', function () {
    var places = searchBox.getPlaces();

    if (places.length === 0) {
      return;
    }

    // Clear out the old markers.
    markers.forEach(function (marker) {
      marker.setMap(null);
    });

    markers = [];

    // For each place, get the icon, name and location.
    var bounds = new google.maps.LatLngBounds();

    places.forEach(function (place) {
      updateFormState(place);

      var icon = {
        url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25)
      };

      // Create a marker for each place.
      markers.push(new google.maps.Marker({
        map: map,
        icon: icon,
        title: place.name,
        position: place.geometry.location
      }));

      if (place.geometry.viewport) {
        // Only geocodes have viewport
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });

    map.fitBounds(bounds);
  });
}

function parseCityStateCountry(place) {
  if (!place || !place.address_components) {
    return {};
  }

  var mappedTypesToLongName = mapTypesToLongName(place.address_components);

  return {
    country: mappedTypesToLongName['country'],
    state: mappedTypesToLongName['administrative_area_level_1'],
    city: mappedTypesToLongName['locality']
  };
}

function mapTypesToLongName(address_components) {
  var mapped = {};

  for (var index = 0; index < address_components.length; index++) {
    var component = address_components[index];

    if (component.types && component.types.length > 0) {
      mapped[component.types[0]] = component.long_name;
    }
  }

  return mapped;
}

function updateFormState(place) {
  var lat = place.geometry.location.lat();
  var lng = place.geometry.location.lng();
  var address = place.formatted_address;
  var name = place.name;
  var cityStateCountry = parseCityStateCountry(place);

  formState.update('locationAddress', address);
  formState.update('locationLat', lat);
  formState.update('locationLng', lng);
  formState.update('locationName', name);
  formState.update('locationCity', cityStateCountry.city);
  formState.update('locationState', cityStateCountry.state);
  formState.update('locationCountry', cityStateCountry.country);
}

Utils.loadScript('https://maps.googleapis.com/maps/api/js?key=AIzaSyBCfiFHdbE6wZKKjdAP2o88DCiYZsifpsg&libraries=places&callback=initAutocomplete');
'use strict';

var ResourcesController = function ResourcesController(id, node, cb) {
  if (node) {
    this.node = node;
  } else if (id) {
    this.node = document.getElementById(id);
  }

  this.cb = cb;

  this._resources = [];
  this.resourceType = this.node.dataset.type;
  this.resourceTotal = 0;

  this.name = this.node.querySelector('.resource-name');
  this.description = this.node.querySelector('.resource-description');
  this.price = this.node.querySelector('.resource-cost');
  this.private = this.node.querySelector('.resource-private');
  this.addButton = this.node.querySelector('.btn-add');
  this.renderedResources = this.node.querySelector('.added-resources');
  this.addButton.onclick = this.add.bind(this);
  this.preload();
};

ResourcesController.prototype.preload = function () {
  var preloadedResources = this.renderedResources.querySelectorAll('.row');

  if (preloadedResources.length > 0) {
    for (var i = 0, j = preloadedResources.length; i < j; i++) {
      var resourceRow = preloadedResources[i];
      var name = resourceRow.querySelector('.name').innerText;
      var description = resourceRow.querySelector('.description').innerText;
      var price = resourceRow.querySelector('.price').innerText;
      var tierResourceId = ~ ~resourceRow.dataset.tierresourceid;
      var removeLink = resourceRow.querySelector('.remove');
      removeLink.onclick = this.remove.bind(this);

      var resource = {
        name: name,
        description: description,
        tierResourceId: tierResourceId,
        price: price.replace('$', ''),
        resource_type_id: ~ ~this.resourceType,
        'private': true
      };

      this._resources.push(resource);
    }

    this.updateTotal();
  }

  console.info(this._resources);
};

ResourcesController.prototype.add = function (ev) {
  this._resources.push({
    name: this.name.value,
    description: this.description.value,
    price: Utils.tryParseFloat(this.price.value),
    'private': true, //this.private.value,
    resource_type_id: ~ ~this.resourceType
  });

  this.name.value = '';
  this.description.value = '';
  this.price.value = '';

  this.update();
};

ResourcesController.prototype.renderResources = function () {
  while (this.renderedResources.firstChild) {
    this.renderedResources.removeChild(this.renderedResources.firstChild);
  }

  for (var i = 0, j = this._resources.length; i < j; i++) {
    var resource = this._resources[i];
    var divRow = Utils.nodeFactory('div', ['row']);
    var colOne = Utils.nodeFactory('div', ['col-md-1'], '<div class="resource-image">' + resource.name.slice(0, 2) + '</div>');
    var colTwo = Utils.nodeFactory('div', ['col-md-10']);
    var colThree = Utils.nodeFactory('div', ['col-md-1'], '<div class="price">' + Utils.formatCurrency(resource.price) + '</div>');

    var descHeading = Utils.nodeFactory('h5', ['name'], resource.name + ' ');
    var description = Utils.nodeFactory('p', ['description'], resource.description);
    var removeLink = Utils.nodeFactory('a', null, 'Remove', { 'data-i': i });
    removeLink.onclick = this.remove.bind(this);
    descHeading.appendChild(removeLink);

    colTwo.appendChild(descHeading);
    colTwo.appendChild(description);

    divRow.appendChild(colOne);
    divRow.appendChild(colTwo);
    divRow.appendChild(colThree);

    this.renderedResources.appendChild(divRow);
  }
};

ResourcesController.prototype.updateTotal = function () {
  var total = 0;

  for (var i = 0, j = this._resources.length; i < j; i++) {
    var price = Utils.tryParseFloat(this._resources[i].price);

    if (price) {
      total += price;
    }
  }

  this.resourceTotal = total;

  var totalNode = this.node.querySelector('.total');
  totalNode.textContent = this.resourceTotal > 0 ? Utils.formatCurrency(this.resourceTotal) : 'FREE';
};

ResourcesController.prototype.remove = function (ev) {
  var index = ev.target.dataset.i;
  var removedResource = this._resources.splice(index, 1);

  console.info(removedResource);

  if (removedResource[0] && removedResource[0].tierResourceId) {
    var resourceTypeId = removedResource[0].tierResourceId;
    var tierId = window.tierId;
    var eventSlug = window.slug;

    Api.delete('/resources/' + eventSlug, { resourceTypeId: resourceTypeId, tierId: tierId });
  }

  this.update();
};

ResourcesController.prototype.update = function () {
  this.renderResources();
  this.updateTotal();

  if (this.cb instanceof Function) {
    this.cb(this.resourceType, this._resources, this.resourceTotal);
  }
};
/* global _ fetch :true */
/* exceptions Api */


var rootUrl = 'http://localhost:3001/api'
// var rootUrl = 'https://testapi.kickparty.com/api'
// var rootUrl = 'http://localhost:3001/api'

console.warn('JS API URL: ' + rootUrl)

function errorMessage (json) {
  if (json.errors) {
    var message = _.map(json.errors, (errorText, property) => {
      return property + ' ' + errorText
    })

    return message.join('\n')
  }

  return 'There was an error with this request.'
}

var Api = {
  getToken () {
    // http://www.the-art-of-web.com/javascript/getcookie/
    function getCookie(name) {
      var re = new RegExp(name + "=([^;]+)");
      var value = re.exec(document.cookie);
      return (value != null) ? unescape(value[1]) : null;
    }
    return getCookie("auth_token")
    // return window.localStorage.getItem('JWT')
  },

  headers () {
    return {
      'Authorization': this.getToken(),
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  },
  request (url, options) {
    return new Promise((resolve, reject) => {
      return fetch(url, options)
        .then((response) => {
          if (!response.ok) {
            return response.json().then((json) => reject(errorMessage(json)))
          }

          return response.json()
            .then((json) => {
              return resolve(json)
            })
        })
    })
  },
  get (url) {
    var options = {
      headers: this.headers(),
      mode: 'cors'
    }

    return this.request(rootUrl + url, options)
  },
  post (url, data) {
    var options = {
      headers: this.headers(),
      method: 'post',
      body: JSON.stringify(data),
      mode: 'cors'
    }

    return this.request(rootUrl + url, options)
  },
  delete (url) {
    var options = {
      headers: this.headers(),
      method: 'delete',
      mode: 'cors'
    }

    return this.request(rootUrl + url, options)
  },
  postURL (url, data) {
    var options = {
      headers: this.headers(),
      method: 'post',
      body: JSON.stringify(data),
      mode: 'cors'
    }

    return this.request(url, options)
  },
  postToController (url, data) {
    var options = {
      headers: this.headers(),
      method: 'post',
      body: JSON.stringify(data),
      mode: 'cors'
    }

    console.info(options)
    console.info(url)

    fetch(url, options)
  }
}
;
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
;
"use strict";
(function() {
  var slice = [].slice;

  this.ActionCable = {
    INTERNAL: {
      "message_types": {
        "welcome": "welcome",
        "ping": "ping",
        "confirmation": "confirm_subscription",
        "rejection": "reject_subscription"
      },
      "default_mount_path": "/cable",
      "protocols": ["actioncable-v1-json", "actioncable-unsupported"]
    },
    createConsumer: function(url) {
      var ref;
      if (url == null) {
        url = (ref = this.getConfig("url")) != null ? ref : this.INTERNAL.default_mount_path;
      }
      return new ActionCable.Consumer(this.createWebSocketURL(url));
    },
    getConfig: function(name) {
      var element;
      element = document.head.querySelector("meta[name='action-cable-" + name + "']");
      return element != null ? element.getAttribute("content") : void 0;
    },
    createWebSocketURL: function(url) {
      var a;
      if (url && !/^wss?:/i.test(url)) {
        a = document.createElement("a");
        a.href = url;
        a.href = a.href;
        a.protocol = a.protocol.replace("http", "ws");
        return a.href;
      } else {
        return url;
      }
    },
    startDebugging: function() {
      return this.debugging = true;
    },
    stopDebugging: function() {
      return this.debugging = null;
    },
    log: function() {
      var messages;
      messages = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      if (this.debugging) {
        messages.push(Date.now());
        return console.log.apply(console, ["[ActionCable]"].concat(slice.call(messages)));
      }
    }
  };

}).call(this);
(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  ActionCable.ConnectionMonitor = (function() {
    var clamp, now, secondsSince;

    ConnectionMonitor.pollInterval = {
      min: 3,
      max: 30
    };

    ConnectionMonitor.staleThreshold = 6;

    function ConnectionMonitor(connection) {
      this.connection = connection;
      this.visibilityDidChange = bind(this.visibilityDidChange, this);
      this.reconnectAttempts = 0;
    }

    ConnectionMonitor.prototype.start = function() {
      if (!this.isRunning()) {
        this.startedAt = now();
        delete this.stoppedAt;
        this.startPolling();
        document.addEventListener("visibilitychange", this.visibilityDidChange);
        return ActionCable.log("ConnectionMonitor started. pollInterval = " + (this.getPollInterval()) + " ms");
      }
    };

    ConnectionMonitor.prototype.stop = function() {
      if (this.isRunning()) {
        this.stoppedAt = now();
        this.stopPolling();
        document.removeEventListener("visibilitychange", this.visibilityDidChange);
        return ActionCable.log("ConnectionMonitor stopped");
      }
    };

    ConnectionMonitor.prototype.isRunning = function() {
      return (this.startedAt != null) && (this.stoppedAt == null);
    };

    ConnectionMonitor.prototype.recordPing = function() {
      return this.pingedAt = now();
    };

    ConnectionMonitor.prototype.recordConnect = function() {
      this.reconnectAttempts = 0;
      this.recordPing();
      delete this.disconnectedAt;
      return ActionCable.log("ConnectionMonitor recorded connect");
    };

    ConnectionMonitor.prototype.recordDisconnect = function() {
      this.disconnectedAt = now();
      return ActionCable.log("ConnectionMonitor recorded disconnect");
    };

    ConnectionMonitor.prototype.startPolling = function() {
      this.stopPolling();
      return this.poll();
    };

    ConnectionMonitor.prototype.stopPolling = function() {
      return clearTimeout(this.pollTimeout);
    };

    ConnectionMonitor.prototype.poll = function() {
      return this.pollTimeout = setTimeout((function(_this) {
        return function() {
          _this.reconnectIfStale();
          return _this.poll();
        };
      })(this), this.getPollInterval());
    };

    ConnectionMonitor.prototype.getPollInterval = function() {
      var interval, max, min, ref;
      ref = this.constructor.pollInterval, min = ref.min, max = ref.max;
      interval = 5 * Math.log(this.reconnectAttempts + 1);
      return Math.round(clamp(interval, min, max) * 1000);
    };

    ConnectionMonitor.prototype.reconnectIfStale = function() {
      if (this.connectionIsStale()) {
        ActionCable.log("ConnectionMonitor detected stale connection. reconnectAttempts = " + this.reconnectAttempts + ", pollInterval = " + (this.getPollInterval()) + " ms, time disconnected = " + (secondsSince(this.disconnectedAt)) + " s, stale threshold = " + this.constructor.staleThreshold + " s");
        this.reconnectAttempts++;
        if (this.disconnectedRecently()) {
          return ActionCable.log("ConnectionMonitor skipping reopening recent disconnect");
        } else {
          ActionCable.log("ConnectionMonitor reopening");
          return this.connection.reopen();
        }
      }
    };

    ConnectionMonitor.prototype.connectionIsStale = function() {
      var ref;
      return secondsSince((ref = this.pingedAt) != null ? ref : this.startedAt) > this.constructor.staleThreshold;
    };

    ConnectionMonitor.prototype.disconnectedRecently = function() {
      return this.disconnectedAt && secondsSince(this.disconnectedAt) < this.constructor.staleThreshold;
    };

    ConnectionMonitor.prototype.visibilityDidChange = function() {
      if (document.visibilityState === "visible") {
        return setTimeout((function(_this) {
          return function() {
            if (_this.connectionIsStale() || !_this.connection.isOpen()) {
              ActionCable.log("ConnectionMonitor reopening stale connection on visibilitychange. visbilityState = " + document.visibilityState);
              return _this.connection.reopen();
            }
          };
        })(this), 200);
      }
    };

    now = function() {
      return new Date().getTime();
    };

    secondsSince = function(time) {
      return (now() - time) / 1000;
    };

    clamp = function(number, min, max) {
      return Math.max(min, Math.min(max, number));
    };

    return ConnectionMonitor;

  })();

}).call(this);
(function() {
  var i, message_types, protocols, ref, supportedProtocols, unsupportedProtocol,
    slice = [].slice,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ref = ActionCable.INTERNAL, message_types = ref.message_types, protocols = ref.protocols;

  supportedProtocols = 2 <= protocols.length ? slice.call(protocols, 0, i = protocols.length - 1) : (i = 0, []), unsupportedProtocol = protocols[i++];

  ActionCable.Connection = (function() {
    Connection.reopenDelay = 500;

    function Connection(consumer) {
      this.consumer = consumer;
      this.open = bind(this.open, this);
      this.subscriptions = this.consumer.subscriptions;
      this.monitor = new ActionCable.ConnectionMonitor(this);
      this.disconnected = true;
    }

    Connection.prototype.send = function(data) {
      if (this.isOpen()) {
        this.webSocket.send(JSON.stringify(data));
        return true;
      } else {
        return false;
      }
    };

    Connection.prototype.open = function() {
      if (this.isActive()) {
        ActionCable.log("Attempted to open WebSocket, but existing socket is " + (this.getState()));
        throw new Error("Existing connection must be closed before opening");
      } else {
        ActionCable.log("Opening WebSocket, current state is " + (this.getState()) + ", subprotocols: " + protocols);
        if (this.webSocket != null) {
          this.uninstallEventHandlers();
        }
        this.webSocket = new WebSocket(this.consumer.url, protocols);
        this.installEventHandlers();
        this.monitor.start();
        return true;
      }
    };

    Connection.prototype.close = function(arg) {
      var allowReconnect, ref1;
      allowReconnect = (arg != null ? arg : {
        allowReconnect: true
      }).allowReconnect;
      if (!allowReconnect) {
        this.monitor.stop();
      }
      if (this.isActive()) {
        return (ref1 = this.webSocket) != null ? ref1.close() : void 0;
      }
    };

    Connection.prototype.reopen = function() {
      var error, error1;
      ActionCable.log("Reopening WebSocket, current state is " + (this.getState()));
      if (this.isActive()) {
        try {
          return this.close();
        } catch (error1) {
          error = error1;
          return ActionCable.log("Failed to reopen WebSocket", error);
        } finally {
          ActionCable.log("Reopening WebSocket in " + this.constructor.reopenDelay + "ms");
          setTimeout(this.open, this.constructor.reopenDelay);
        }
      } else {
        return this.open();
      }
    };

    Connection.prototype.getProtocol = function() {
      var ref1;
      return (ref1 = this.webSocket) != null ? ref1.protocol : void 0;
    };

    Connection.prototype.isOpen = function() {
      return this.isState("open");
    };

    Connection.prototype.isActive = function() {
      return this.isState("open", "connecting");
    };

    Connection.prototype.isProtocolSupported = function() {
      var ref1;
      return ref1 = this.getProtocol(), indexOf.call(supportedProtocols, ref1) >= 0;
    };

    Connection.prototype.isState = function() {
      var ref1, states;
      states = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return ref1 = this.getState(), indexOf.call(states, ref1) >= 0;
    };

    Connection.prototype.getState = function() {
      var ref1, state, value;
      for (state in WebSocket) {
        value = WebSocket[state];
        if (value === ((ref1 = this.webSocket) != null ? ref1.readyState : void 0)) {
          return state.toLowerCase();
        }
      }
      return null;
    };

    Connection.prototype.installEventHandlers = function() {
      var eventName, handler;
      for (eventName in this.events) {
        handler = this.events[eventName].bind(this);
        this.webSocket["on" + eventName] = handler;
      }
    };

    Connection.prototype.uninstallEventHandlers = function() {
      var eventName;
      for (eventName in this.events) {
        this.webSocket["on" + eventName] = function() {};
      }
    };

    Connection.prototype.events = {
      message: function(event) {
        var identifier, message, ref1, type;
        if (!this.isProtocolSupported()) {
          return;
        }
        ref1 = JSON.parse(event.data), identifier = ref1.identifier, message = ref1.message, type = ref1.type;
        switch (type) {
          case message_types.welcome:
            this.monitor.recordConnect();
            return this.subscriptions.reload();
          case message_types.ping:
            return this.monitor.recordPing();
          case message_types.confirmation:
            return this.subscriptions.notify(identifier, "connected");
          case message_types.rejection:
            return this.subscriptions.reject(identifier);
          default:
            return this.subscriptions.notify(identifier, "received", message);
        }
      },
      open: function() {
        ActionCable.log("WebSocket onopen event, using '" + (this.getProtocol()) + "' subprotocol");
        this.disconnected = false;
        if (!this.isProtocolSupported()) {
          ActionCable.log("Protocol is unsupported. Stopping monitor and disconnecting.");
          return this.close({
            allowReconnect: false
          });
        }
      },
      close: function(event) {
        ActionCable.log("WebSocket onclose event");
        if (this.disconnected) {
          return;
        }
        this.disconnected = true;
        this.monitor.recordDisconnect();
        return this.subscriptions.notifyAll("disconnected", {
          willAttemptReconnect: this.monitor.isRunning()
        });
      },
      error: function() {
        return ActionCable.log("WebSocket onerror event");
      }
    };

    return Connection;

  })();

}).call(this);
(function() {
  var slice = [].slice;

  ActionCable.Subscriptions = (function() {
    function Subscriptions(consumer) {
      this.consumer = consumer;
      this.subscriptions = [];
    }

    Subscriptions.prototype.create = function(channelName, mixin) {
      var channel, params, subscription;
      channel = channelName;
      params = typeof channel === "object" ? channel : {
        channel: channel
      };
      subscription = new ActionCable.Subscription(this.consumer, params, mixin);
      return this.add(subscription);
    };

    Subscriptions.prototype.add = function(subscription) {
      this.subscriptions.push(subscription);
      this.consumer.ensureActiveConnection();
      this.notify(subscription, "initialized");
      this.sendCommand(subscription, "subscribe");
      return subscription;
    };

    Subscriptions.prototype.remove = function(subscription) {
      this.forget(subscription);
      if (!this.findAll(subscription.identifier).length) {
        this.sendCommand(subscription, "unsubscribe");
      }
      return subscription;
    };

    Subscriptions.prototype.reject = function(identifier) {
      var i, len, ref, results, subscription;
      ref = this.findAll(identifier);
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        subscription = ref[i];
        this.forget(subscription);
        this.notify(subscription, "rejected");
        results.push(subscription);
      }
      return results;
    };

    Subscriptions.prototype.forget = function(subscription) {
      var s;
      this.subscriptions = (function() {
        var i, len, ref, results;
        ref = this.subscriptions;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          s = ref[i];
          if (s !== subscription) {
            results.push(s);
          }
        }
        return results;
      }).call(this);
      return subscription;
    };

    Subscriptions.prototype.findAll = function(identifier) {
      var i, len, ref, results, s;
      ref = this.subscriptions;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        s = ref[i];
        if (s.identifier === identifier) {
          results.push(s);
        }
      }
      return results;
    };

    Subscriptions.prototype.reload = function() {
      var i, len, ref, results, subscription;
      ref = this.subscriptions;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        subscription = ref[i];
        results.push(this.sendCommand(subscription, "subscribe"));
      }
      return results;
    };

    Subscriptions.prototype.notifyAll = function() {
      var args, callbackName, i, len, ref, results, subscription;
      callbackName = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      ref = this.subscriptions;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        subscription = ref[i];
        results.push(this.notify.apply(this, [subscription, callbackName].concat(slice.call(args))));
      }
      return results;
    };

    Subscriptions.prototype.notify = function() {
      var args, callbackName, i, len, results, subscription, subscriptions;
      subscription = arguments[0], callbackName = arguments[1], args = 3 <= arguments.length ? slice.call(arguments, 2) : [];
      if (typeof subscription === "string") {
        subscriptions = this.findAll(subscription);
      } else {
        subscriptions = [subscription];
      }
      results = [];
      for (i = 0, len = subscriptions.length; i < len; i++) {
        subscription = subscriptions[i];
        results.push(typeof subscription[callbackName] === "function" ? subscription[callbackName].apply(subscription, args) : void 0);
      }
      return results;
    };

    Subscriptions.prototype.sendCommand = function(subscription, command) {
      var identifier;
      identifier = subscription.identifier;
      return this.consumer.send({
        command: command,
        identifier: identifier
      });
    };

    return Subscriptions;

  })();

}).call(this);
(function() {
  ActionCable.Subscription = (function() {
    var extend;

    function Subscription(consumer, params, mixin) {
      this.consumer = consumer;
      if (params == null) {
        params = {};
      }
      this.identifier = JSON.stringify(params);
      extend(this, mixin);
    }

    Subscription.prototype.perform = function(action, data) {
      if (data == null) {
        data = {};
      }
      data.action = action;
      return this.send(data);
    };

    Subscription.prototype.send = function(data) {
      return this.consumer.send({
        command: "message",
        identifier: this.identifier,
        data: JSON.stringify(data)
      });
    };

    Subscription.prototype.unsubscribe = function() {
      return this.consumer.subscriptions.remove(this);
    };

    extend = function(object, properties) {
      var key, value;
      if (properties != null) {
        for (key in properties) {
          value = properties[key];
          object[key] = value;
        }
      }
      return object;
    };

    return Subscription;

  })();

}).call(this);
(function() {
  ActionCable.Consumer = (function() {
    function Consumer(url) {
      this.url = url;
      this.subscriptions = new ActionCable.Subscriptions(this);
      this.connection = new ActionCable.Connection(this);
    }

    Consumer.prototype.send = function(data) {
      return this.connection.send(data);
    };

    Consumer.prototype.connect = function() {
      return this.connection.open();
    };

    Consumer.prototype.disconnect = function() {
      return this.connection.close({
        allowReconnect: false
      });
    };

    Consumer.prototype.ensureActiveConnection = function() {
      if (!this.connection.isActive()) {
        return this.connection.open();
      }
    };

    return Consumer;

  })();

}).call(this);
(function() {


}).call(this);
/* global view Api eventsTmpl $ :true */


var Utils = window.Utils

function showCommentModal(e, isLoggedIn) {
    if (!isLoggedIn) {
        e.preventDefault();
        $('#modal-comment').modal('show');
    }
}

$(document).ready(function () {
  // View comes from views/partials/head.ejs
  // It dynamically loads a script file

  // loadUser()


  switch (window.view) {
    // TODO: should just put this on event details page
    case 'event-details':
      var id = window.id
      loadEventDetails(id)
      loadEventPosts(id)
      loadEventAttendees(id)
      break
    default:
      // ?
  }

  function loadUser () {
    Api.get('/current_session').then(
      (user) => {
        console.log(user)
      },
      (err) => {
        console.log(err)
      })
  }

  function loadEventDetails () {
    $('#event-description').readmore({
      moreLink: '<a href="#">Show more</a>',
      lessLink: '<a href="#">Show less</a>'
    })

    // Event Totals
    // var committedCount = eventDetail.committedCount
    // var totalCost = tier.tierTotal
    // var peopleNeededCount = tier.minAttendeeCount - committedCount
    // peopleNeededCount = (peopleNeededCount > 0) ? peopleNeededCount : 0 // Event has kicked!
    // var totalRaised = tier.costPerPerson * committedCount
    // var amountShort = tier.costPerPerson * peopleNeededCount
    // var displayCost = (totalCost <= 0) ? 'Free' : Utils.formatCurrency(totalCost)
    //
    // $('.kick-by-term').html(eventDetail.kickBy === 1 ? 'Guests' : 'Funds')
    // $('#total-needed').html(eventDetail.kickBy === 1 ? tier.minAttendeeCount : displayCost)
    // $('#committed').html(eventDetail.kickBy === 1 ? committedCount : Utils.formatCurrency(totalRaised))
    // $('#addtl-needed').html(eventDetail.kickBy === 1 ? peopleNeededCount : Utils.format.currency(amountShort))
    //

  }

  function loadEventPosts (id) {
    // Api comes from scripts/api.js
    Api.get('/posts/' + id).then(
      (posts) => {
        console.log(posts)
        $('#event-posts-loader').remove()
        var html = postsTmpl.render(posts)
        $('#event-posts').html(html)
      },
      (err) => {
        console.log(err)
      })
  }

  function loadEventAttendees (id) {
    // Api comes from scripts/api.js
    Api.get('/events/' + id + '/attendees').then(
      (attendees) => {
        console.log(attendees)
        $('#event-attendees-loader').remove()
        var html = attendeesTmpl.render(attendees.attendees)
        $('#event-attendees').html(html)
      },
      (err) => {
        console.log(err)
      })
  }
})
;
'use strict';

/* global ResourcesController :true */

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
    var toggleButtons;
    var eventResources;
    var node;

    (function () {
      var handleChange = function handleChange(type, resources, total) {
        resourceState[type] = { total: total, resources: resources };
        calcTotals();
      };

      var calcTotals = function calcTotals() {
        calcBaseCost();
        calcCostPerAttendee();
        renderUpdates();
      };

      var calcBaseCost = function calcBaseCost() {
        var tempTotal = 0;
        if (costBaseNode && costBaseNode.value) {
          var baseCost = Utils.tryParseFloat(costBaseNode.value);

          if (baseCost) {
            tempTotal += baseCost;
          }
        }

        for (var resource in resourceState) {
          if (resourceState.hasOwnProperty(resource)) {
            tempTotal += resourceState[resource].total;
          }
        }

        pricing.set('baseCost', tempTotal);
      };

      var calcCostPerAttendee = function calcCostPerAttendee() {
        var tempTotal = 0;

        if (pricing.get('calculationMethod') === 2) {
          console.info('flatPriceNode.value', flatPriceNode.value);
          tempTotal = Utils.tryParseFloat(flatPriceNode.value);
        } else {
          tempTotal = pricing.get('baseCost') / peopleAttending;
        }

        pricing.set('costPerAttendee', tempTotal);
      };

      var renderUpdates = function renderUpdates() {
        costTotalNode.textContent = Utils.formatCurrency(pricing.get('baseCost'));
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
          calculationMethod: 1
        },
        set: function set(key, value) {
          this._data[key] = value;
        },
        get: function get(key) {
          return this._data[key];
        }
      };
      peopleAttending = 30;
      costTotalNode = document.getElementById('cost-total');
      costPPNode = document.getElementById('cost-pp');
      costBaseNode = document.getElementById('cost-base');
      flatPriceNode = document.getElementById('flat-price');
      resourceForm = document.getElementById('resource-form');
      calculationMethods = document.querySelectorAll('.price-method');


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
        ev.preventDefault();

        var mappedData = {
          id: 'beerjs',
          tiers: [{
            baseCost: pricing.get('baseCost'),
            calculationMethod: pricing.get('calculationMethod'),
            costPerAttendee: pricing.get('costPerAttendee')
          }],
          resources: mapResources()
        };

        var response = Api.post('/events/' + mappedData.id + '/update', mappedData);
        response.then(function (data) {
          window.location = '/events/' + mappedData.id;
        });

        // Api.postToController(document.URL, mappedData)
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

        new ResourcesController(null, node, function (type, resources, total) {
          handleChange(type, resources, total);
        });
      }
    })();
  } // End if on page logic
});
(function () {
  var leaveButton = document.getElementById('leave-event-btn')

  if (leaveButton) {
    leaveButton.addEventListener('click', function (e) {
      e.preventDefault()
      Api.delete('/events/' + window.id + '/attendees')
      window.location.reload()
    })
  }
})()
;
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
/*!
 * @preserve
 *
 * Readmore.js jQuery plugin
 * Author: @jed_foster
 * Project home: http://jedfoster.github.io/Readmore.js
 * Licensed under the MIT license
 *
 * Debounce function from http://davidwalsh.name/javascript-debounce-function
 */

!function(t){"function"==typeof define&&define.amd?define(["jquery"],t):"object"==typeof exports?module.exports=t(require("jquery")):t(jQuery)}(function(t){"use strict";function e(t,e,i){var a;return function(){var n=this,o=arguments,r=function(){a=null,i||t.apply(n,o)},s=i&&!a;clearTimeout(a),a=setTimeout(r,e),s&&t.apply(n,o)}}function i(t){var e=++h;return String(null==t?"rmjs-":t)+e}function a(t){var e=t.clone().css({height:"auto",width:t.width(),maxHeight:"none",overflow:"hidden"}).insertAfter(t),i=e.outerHeight(),a=parseInt(e.css({maxHeight:""}).css("max-height").replace(/[^-\d\.]/g,""),10),n=t.data("defaultHeight");e.remove();var o=a||t.data("collapsedHeight")||n;t.data({expandedHeight:i,maxHeight:a,collapsedHeight:o}).css({maxHeight:"none"})}function n(t){if(!d[t.selector]){var e=" ";t.embedCSS&&""!==t.blockCSS&&(e+=t.selector+" + [data-readmore-toggle], "+t.selector+"[data-readmore]{"+t.blockCSS+"}"),e+=t.selector+"[data-readmore]{transition: height "+t.speed+"ms;overflow: hidden;}",function(t,e){var i=t.createElement("style");i.type="text/css",i.styleSheet?i.styleSheet.cssText=e:i.appendChild(t.createTextNode(e)),t.getElementsByTagName("head")[0].appendChild(i)}(document,e),d[t.selector]=!0}}function o(e,i){this.element=e,this.options=t.extend({},s,i),n(this.options),this._defaults=s,this._name=r,this.init(),window.addEventListener?(window.addEventListener("load",l),window.addEventListener("resize",l)):(window.attachEvent("load",l),window.attachEvent("resize",l))}var r="readmore",s={speed:100,collapsedHeight:200,heightMargin:16,moreLink:'<a href="#">Read More</a>',lessLink:'<a href="#">Close</a>',embedCSS:!0,blockCSS:"display: block; width: 100%;",startOpen:!1,beforeToggle:function(){},afterToggle:function(){}},d={},h=0,l=e(function(){t("[data-readmore]").each(function(){var e=t(this),i="true"===e.attr("aria-expanded");a(e),e.css({height:e.data(i?"expandedHeight":"collapsedHeight")})})},100);o.prototype={init:function(){var e=t(this.element);e.data({defaultHeight:this.options.collapsedHeight,heightMargin:this.options.heightMargin}),a(e);var n=e.data("collapsedHeight"),o=e.data("heightMargin");if(e.outerHeight(!0)<=n+o)return!0;var r=e.attr("id")||i(),s=this.options.startOpen?this.options.lessLink:this.options.moreLink;e.attr({"data-readmore":"","aria-expanded":this.options.startOpen,id:r}),e.after(t(s).on("click",function(t){return function(i){t.toggle(this,e[0],i)}}(this)).attr({"data-readmore-toggle":"","aria-controls":r})),this.options.startOpen||e.css({height:n})},toggle:function(e,i,a){a&&a.preventDefault(),e||(e=t('[aria-controls="'+_this.element.id+'"]')[0]),i||(i=_this.element);var n=t(i),o="",r="",s=!1,d=n.data("collapsedHeight");n.height()<=d?(o=n.data("expandedHeight")+"px",r="lessLink",s=!0):(o=d,r="moreLink"),this.options.beforeToggle(e,n,!s),n.css({height:o}),n.on("transitionend",function(i){return function(){i.options.afterToggle(e,n,s),t(this).attr({"aria-expanded":s}).off("transitionend")}}(this)),t(e).replaceWith(t(this.options[r]).on("click",function(t){return function(e){t.toggle(this,i,e)}}(this)).attr({"data-readmore-toggle":"","aria-controls":n.attr("id")}))},destroy:function(){t(this.element).each(function(){var e=t(this);e.attr({"data-readmore":null,"aria-expanded":null}).css({maxHeight:"",height:""}).next("[data-readmore-toggle]").remove(),e.removeData()})}},t.fn.readmore=function(e){var i=arguments,a=this.selector;return e=e||{},"object"==typeof e?this.each(function(){if(t.data(this,"plugin_"+r)){var i=t.data(this,"plugin_"+r);i.destroy.apply(i)}e.selector=a,t.data(this,"plugin_"+r,new o(this,e))}):"string"==typeof e&&"_"!==e[0]&&"init"!==e?this.each(function(){var a=t.data(this,"plugin_"+r);a instanceof o&&"function"==typeof a[e]&&a[e].apply(a,Array.prototype.slice.call(i,1))}):void 0}});
var eventsTmpl = $.templates(
  '<div class=\'col-sm-4 margin30\'>\
      <div>\
          <a href=\'/events/{{:slug}}\'>\
              <div class=\'item-img-wrap\'>\
                  <img src=\'{{:headerImg}}\' class=\'img-responsive\' alt=\'workimg\'>\
                  <div class=\'item-img-overlay\'>\
                      <span></span>\
                  </div>\
              </div>\
          </a>\
          <div class=\'news-desc\'>\
              <h4><a href=\'/events/{{:slug}}\'>{{:name}}</a></h4>\
              <span>Kicks {{:deadline}}</span> <span><a href=\'/{{:slug}}\'>Check it...</a></span>\
          </div>\
      </div>\
  </div>'
)

var postsTmpl = $.templates(
  "<div style='background-color:rgba(255, 255, 255, .8);padding:5px;' class='row'>\
     <div class='col-md-1'>\
        <a href='/{{:user.slug}}' class='profile-link'>\
          <div class='profile-image' style='background-image:url({{:user.profileImg}});background-size:100%;border:4px #fff solid;border-radius:50%;height:50px;width:50px;'>\
            <div class='initials' style='color:white;font-size:1em;font-weight:300;height:50px;line-height:50px;text-align:center;text-transform:uppercase;'>\
            </div>\
          </div>\
        </a>\
      </div>\
      <div class='col-md-11'>\
        <div style='margin-left:10px;text-align:left;width:95%;' class='post-text'>\
          <a style='font-weight:700;' class='' href='/{{:user.slug}}'>{{:user.firstName}} {{:user.lastName}}</a>\
          <p style='margin-top:0;margin-bottom:0;text-align:left;color:#8899a6;font-size:85%;'>{{:createdAt}}</p>\
          <p style='margin-top:0;margin-bottom:0;text-align:left;'>{{:body}}</p>\
          <div style='border-top:1px solid #ccc;display:flex;margin-top:6px;font-size:.85em;'>\
           <!-- Put back in when ready to implement:\
           <a style='margin:10px 15px 5px;color:#aaa;'>\
              <i class='fa fa-thumbs-up'></i>\
              <span> Like</span>\
            </a>\
            <a style='margin:10px 15px 5px;display:none;'>\
              <i class='fa fa-comments'></i>\
              <span> Comment</span>\
            </a> -->\
          </div>\
        </div>\
      </div>\
    </div>\
    "
)

var attendeesTmpl = $.templates(
  "<li class='invitee'> \
    <a href='/{{:slug}}' class='profile-link'> \
      <div class='profile-image' style='background-image:url({{:profileImg}});background-size:100%;border:4px #fff solid;border-radius:50%;height:70px;width:70px;margin:undefined;'> \
        <div class='initials'> \
        </div> \
      </div> \
      <div class='text' style='font-size:14px;margin-top:-25px;margin-left:-25px;'> \
        {{:firstName}} {{:lastName}} \
      </div> \
    </a> \
  </li>"
)

//{{include resources tmpl='resourcesTmpl'/}} \
;
// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or any plugin's vendor/assets/javascripts directory can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file. JavaScript code in this file should be added after the last require_* statement.
//
// Read Sprockets README (https://github.com/rails/sprockets#sprockets-directives) for details
// about supported directives.
//










