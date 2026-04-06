# Place all the behaviors and hooks related to the matching controller here.
# All this logic will automatically be available in application.js.
# You can use CoffeeScript in this file: http://coffeescript.org/

$(document).ready ->
  $pill = $('.jump-to-publications')
  $section = $('#publications-section')

  if $pill.length and $section.length
    checkScroll = ->
      rect = $section[0].getBoundingClientRect()
      if rect.top < window.innerHeight
        $pill.addClass('is-hidden')
      else
        $pill.removeClass('is-hidden')

    checkScroll()
    $(window).on('scroll', checkScroll)

    $pill.on 'click', (e) ->
      e.preventDefault()
      $('html, body').animate { scrollTop: $section.offset().top }, 400

class @Utility
  @randomString: (n) ->
    s = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    Array.apply(null, Array(n)).map(() ->
      return s.charAt(Math.floor(Math.random() * s.length))
    ).join ''