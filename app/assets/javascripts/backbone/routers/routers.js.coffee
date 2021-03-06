class Jogtrack.Router extends Backbone.Router

  routes:
    "" : "loginForm"
    "login" : "loginForm"
    "logout" : 'logout'
    "register" : "register"
    "time_entries" : "timeEntries"
    "time_entries/report" : "timeEntriesReport"
    "time_entries/new" : "newTimeEntry"
    "time_entries/:id" : "showTimeEntry"
    "time_entries/:id/edit" : "editTimeEntry"

  loginForm: ->
    app.layout.renderLoginForm()

  logout: ->
    app.session.destroy
      success: ->
        app.router.navigate('login', {trigger: true, replace: true})

  register: ->
    app.layout.renderRegistration()

  timeEntries: ->
    app.layout.renderTimeEntries()

  newTimeEntry: ->
    app.layout.renderNewTimeEntry()

  showTimeEntry: (id) ->
    app.layout.renderShowTimeEntry(id)

  editTimeEntry: (id) ->
    app.layout.renderEditTimeEntry(id)

  timeEntriesReport: ->
    app.layout.renderTimeEntriesReport()