class Jogtrack.Models.User extends Backbone.Model
  paramRoot: 'user'
  url: "/user"

  initialize: (attributes, options) ->
    @on 'sync', () ->
      @unset('password')
      @unset('password_confirmation')