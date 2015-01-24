var wow = new WOW({
  boxClass: 'wow',
  animateClass: 'animated',
  mobile: false,
  offset: 120
});
wow.init();

$('form').validate({
  rules: {
    '_replyto': {
      required: true
    }
  },
  errorPlacement: function(error, element) {
    error.insertBefore(element);
  },
  submitHandler: function(form) {

    form.submit();
  }
});

var options = {
  debug: true
};

console.log('custom');

function log(message) {
  if (options.debug) {
    console.log(message);
  }
}

function analyticsEvent(category, action, label, value, callback) {
  var event = {
    'hitType': 'event',
    'eventCategory': category,
    'eventAction': action,
    'eventLabel': label,
    'eventValue': value,
    'hitCallback': callback
  };

  log('Sending event: ' + category + ", " + action + ", " + label + ", " + value);
  ga('send', event);
}

function trackLinkClick(element) {
  var handler = function(event) {
    event.preventDefault();
    var element = $(this);
    console.log(element);
    analyticsEvent('Link', 'Click', element.attr('href'), undefined, function() {
      // Remove our handler so we can trigger the previous event handler
      element.unbind('click', handler);
      element[0].click();
      // Restore our handler to track if the element is clicked again
      element.bind('click', handler);
    });
  };
  element.bind('click', handler);
}

function trackSubmit(element) {
  // Wrapping the submit function means we only track when the form actually gets submitted,
  // otherwised submissions cancelled by validation failures will be tracked also.
  var oldSubmit = element[0].submit;
  element[0].submit = function() {
    analyticsEvent('Form', 'Submit', element.attr('id'), undefined, function() {
      oldSubmit.apply(element[0], arguments);
    });
  };
}

var trackElements = function(selector) {
  if (typeof ga === 'undefined')
    log("Google Analytics not loaded!");

  log('trackElements');

  var elements = $(selector).each(function(i, element) {
    element = $(element);

    if (element.is('form')) {
      trackSubmit(element);
    }
    else if (element.is('a')) {
      trackLinkClick(element);
    }
  });
};

// trackElements('form,a');
