class Jogtrack.Views.TimeEntries.FilterForm extends Marionette.ItemView
  template: JST['backbone/templates/time_entries/filter_form']

  events:
    'click button[name=clear]': 'clear'

  initialize: (options) ->
    @collection = options.collection
    @filterModel = new Backbone.Model()
    @modelBinder = new Backbone.ModelBinder()
    @listenTo @filterModel, 'change', @filter

  filter: ->
    @collection.fetch
      data: @filterModel.attributes

  clear: ->
    @filterModel.clear()

  onRender: ->
    @modelBinder.bind(@filterModel, @$el)