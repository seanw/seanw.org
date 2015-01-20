var wow = new WOW(
{
  boxClass:     'wow',
  animateClass: 'animated',
  mobile:       false,
  offset:       120
}
);
wow.init();

$('form').validate({
  rules:{
    '_replyto': {
      required: true
    }
  },
  errorPlacement: function(error, element) {
    error.insertBefore(element);
  }
});
