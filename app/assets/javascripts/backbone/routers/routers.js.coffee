class Jogtrack.Router extends Backbone.Router

  routes:
    "time_entries" : "timeEntries"

  timeEntries: ->
    console.log "time entries"