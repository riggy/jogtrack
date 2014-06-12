class Jogtrack.Router extends Backbone.Router

  routes:
    "" : "loginForm"
    "logout" : 'logout'
    "time_entries" : "timeEntries"

  loginForm: ->
    app.layout.renderLoginForm()

  logout: ->
    app.session.destroy
      success: ->
        app.router.navigate('', {trigger: true})

  timeEntries: ->
    app.layout.renderTimeEntries()