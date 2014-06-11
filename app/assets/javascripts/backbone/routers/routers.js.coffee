class Jogtrack.Router extends Backbone.Router

  routes:
    "" : "loginForm"
    "logout" : "logout"
    "time_entries" : "timeEntries"

  loginForm: ->
    app.layout.renderLoginForm()

  timeEntries: ->
    console.log "time entries"