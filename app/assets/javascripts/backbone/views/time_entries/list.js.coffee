class Jogtrack.Views.TimeEntries.List extends Marionette.CompositeView
  template: JST['backbone/templates/time_entries/list']
  itemView: Jogtrack.Views.TimeEntries.Item
  itemViewContainer: 'table.list tbody'

  initialize: (options) ->
    @collection = new Jogtrack.Collections.TimeEntries()
    @collection.fetch()