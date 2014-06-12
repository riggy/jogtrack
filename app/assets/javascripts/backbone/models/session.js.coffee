class Jogtrack.Models.Session extends Backbone.Model
  paramsRoot: "user_session"
  url: "/user_session"

  initialize: ->
    @on 'change:id', () -> @set('password',null)
    @on 'destroy', () -> @set(id: null, email: null)

  loggedIn: ->
    @get('id')? && @get('email')?
