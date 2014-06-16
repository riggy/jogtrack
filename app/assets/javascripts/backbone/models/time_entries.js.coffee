class Jogtrack.Models.TimeEntry extends Backbone.Model
  paramRoot: 'time_entry'
  url: () ->
    if @isNew()
      '/time_entries'
    else
      "/time_entries/#{@id}"


class Jogtrack.Collections.TimeEntries extends Backbone.Collection
  model: Jogtrack.Models.TimeEntry

  url: '/time_entries'