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

  # Capture-phase listener fires before Turbolinks' bubble-phase handler. Calling
  # e.preventDefault() here sets defaultPrevented=true, so Turbolinks skips its own
  # scroll and only our scrollIntoView animation runs — fixes "first click" race.
  scrollToSection = (e) ->
    anchor = e.target.closest('a')
    return unless anchor
    href = anchor.getAttribute('href')
    return unless href and /^#(about|recruiting|students|publications)$/.test(href)
    return if anchor.id == 'awardsFilterLink'
    e.preventDefault()
    el = document.getElementById(href.slice(1))
    return unless el
    top = el.getBoundingClientRect().top + (window.pageYOffset or 0)
    window.scrollTo({ top: top, behavior: 'smooth' })

  document.addEventListener 'click', scrollToSection, true

class @Utility
  @randomString: (n) ->
    s = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    Array.apply(null, Array(n)).map(() ->
      return s.charAt(Math.floor(Math.random() * s.length))
    ).join ''
