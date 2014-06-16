class Jogtrack.Views.TimeEntries.FilterForm extends Marionette.ItemView
  template: JST['backbone/templates/time_entries/filter_form']

  events:
    'submit form': 'filter'


  initialize: (options) ->
    @collection = options.collection
    @filterModel = new Backbone.Model()
    @modelBinder = new Backbone.ModelBinder()

  filter: (e) ->
    e.preventDefault()
    @collection.fetch
      data: @filterModel.attributes


  onRender: ->
    @modelBinder.bind(@filterModel, @$el)