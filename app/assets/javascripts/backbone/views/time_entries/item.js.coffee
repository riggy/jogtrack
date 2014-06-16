class Jogtrack.Views.TimeEntries.Item extends Marionette.ItemView
  template: JST['backbone/templates/time_entries/item']
  tagName: 'tr'

  events:
    'click .destroy' : 'destroy'

  destroy: (e) ->
    e.preventDefault()
    if confirm("Are you sure you want to delete this entry?")
      @model.destroy()

  serializeData: ->
    data = super
    data.time = @model.time()
    data