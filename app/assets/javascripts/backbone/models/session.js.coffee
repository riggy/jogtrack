class Jogtrack.Models.Session extends Backbone.Model
  paramRoot: "user_session"
  url: "/user_session"

  initialize: ->
    @on 'sync', () -> @set('password',null)
    @on 'destroy', () ->
      @unset('user')
      @unset('id')

  parse: (data) ->
    if data.user
      data.user = new Jogtrack.Models.User(data.user)
    data

  isNew: ->
    !@get('user')?

  user: ->
    @get('user')

  loggedIn: ->
    @get('user')?
