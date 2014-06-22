class Jogtrack.Models.ReportItem extends Backbone.Model

  averageSpeed: ->
    hours = Math.floor(@get('average_speed') / 3600)
    minutes = Math.floor(@get('average_speed') % 3600 / 60)
    seconds = @get('average_speed') % 3600 % 60
    result = ""
    result += "#{hours} hours " if hours
    result += "00#{minutes} ".slice(-2) + " minutes " if minutes
    result += "00#{seconds} ".slice(-2) + " seconds"
    result += " per kilometer"

class Jogtrack.Collections.Report extends Backbone.Collection
  model: Jogtrack.Models.ReportItem
  url: '/time_entries/report'