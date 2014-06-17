class Jogtrack.Models.ReportItem extends Backbone.Model

class Jogtrack.Collections.Report extends Backbone.Collection
  model: Jogtrack.Models.ReportItem
  url: '/time_entries/report'