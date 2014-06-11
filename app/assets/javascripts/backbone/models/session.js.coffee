class Jogtrack.Models.Session extends Backbone.Model
  paramsRoot: "user_session"
  url: "/user_session"

  loggedIn: ->
    @get('id')? && @get('email')?

  logout: ->
    @destroy
      success: =>
        @set(id: null, email: null)