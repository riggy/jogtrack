class Jogtrack.Models.TimeEntry extends Backbone.Model
  paramRoot: 'time_entry'
  url: () ->
    if @isNew()
      '/time_entries'
    else
      "/time_entries/#{@id}"

  initialize: (attributes, options) ->
    @on 'change:time_hours change:time_minutes change:time_seconds', ->
      @set('time', @get('time_hours') * 3600 + @get('time_minutes') * 60 + @get('time_seconds'), trigger: false)

  parse: (data) ->
    if data
      data.time_hours = Math.floor(data.time / 3600)
      data.time_minutes = Math.floor(data.time % 3600 / 60)
      data.time_seconds = data.time % 3600 % 60
      data

  toJSON: ->
    attributes = super
    delete attributes.time_hours
    delete attributes.time_minutes
    delete attributes.time_seconds
    attributes

  timeFormatted: ->
    "#{@get('time_hours')}:#{@get('time_minutes')}:#{@get('time_seconds')}"

class Jogtrack.Collections.TimeEntries extends Backbone.Collection
  model: Jogtrack.Models.TimeEntry

  url: '/time_entries'