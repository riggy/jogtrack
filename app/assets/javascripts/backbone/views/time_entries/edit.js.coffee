class Jogtrack.Views.TimeEntries.Edit extends Marionette.ItemView
  template: JST['backbone/templates/time_entries/edit']

  events:
    'submit form': 'save'

  initialize: (options) ->
    @model.fetch()
    @modelBinder = new Backbone.ModelBinder()

  save: (e) ->
    e.preventDefault()
    @model.save null,
      success: ->
        app.router.navigate('time_entries', trigger: true)
      error: (model, response, options) ->
        alert response.responseText

  onRender: ->
    @modelBinder.bind(@model, @$el)