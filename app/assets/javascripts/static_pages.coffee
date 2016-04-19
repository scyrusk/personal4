# Place all the behaviors and hooks related to the matching controller here.
# All this logic will automatically be available in application.js.
# You can use CoffeeScript in this file: http://coffeescript.org/

class @Utility
  @randomString: (n) ->
    s = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    Array.apply(null, Array(n)).map(() ->
      return s.charAt(Math.floor(Math.random() * s.length))
    ).join ''