class Jogtrack.Views.TimeEntries.ReportList extends Marionette.CompositeView
  template: JST['backbone/templates/time_entries/report_list']
  itemView: Jogtrack.Views.TimeEntries.ReportItem
  itemViewContainer: 'table.list tbody'

  initialize: ->
    @collection = new Jogtrack.Collections.Report()
    @collection.fetch()
