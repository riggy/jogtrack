class Jogtrack.Views.TimeEntries.ReportItem extends Marionette.ItemView
  template: JST['backbone/templates/time_entries/report_item']
  tagName: 'tr'

  serializeData: ->
    data = super
    data.averageSpeed = @model.averageSpeed()
    data