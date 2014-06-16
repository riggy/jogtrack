class Jogtrack.Views.TimeEntries.Show extends Marionette.ItemView
  template: JST['backbone/templates/time_entries/show']

  initialize: (options) ->
    @model.fetch()
    @modelBinder = new Backbone.ModelBinder()

  onRender: ->
    @modelBinder.bind(@model, @$el)