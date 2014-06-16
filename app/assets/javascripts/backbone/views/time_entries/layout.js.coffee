class Jogtrack.Views.TimeEntries.Layout extends Marionette.Layout
  template: JST['backbone/templates/time_entries/layout']

  regions:
    filterForm: '.filter-form'
    list: '.list'

  initialize: (options) ->
    @collection = new Jogtrack.Collections.TimeEntries()
    @collection.fetch()

  onRender: ->
    @filterForm.show(new Jogtrack.Views.TimeEntries.FilterForm(collection: @collection))
    @list.show(new Jogtrack.Views.TimeEntries.List(collection: @collection))
