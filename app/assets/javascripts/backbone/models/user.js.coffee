class Jogtrack.Models.User extends Backbone.Model
  url: "/user"

  initialize: (attributes, options) ->
    @on 'sync', () ->
      @unset('password')
      @unset('password_confirmation')

  toJSON: () ->
    attributes = {user: super()}
    attributes