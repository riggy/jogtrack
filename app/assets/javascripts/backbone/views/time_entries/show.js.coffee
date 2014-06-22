class Jogtrack.Views.TimeEntries.Show extends Marionette.ItemView
  template: JST['backbone/templates/time_entries/show']

  initialize: (options) ->
    @model.fetch()
    @modelBinder = new Backbone.ModelBinder()

  onRender: ->
    bindings = Backbone.ModelBinder.createDefaultBindings(this.el, 'name');
    bindings['time'].converter = (direction, value) =>
      if direction == 'ModelToView'
        @model.time()

    bindings['distance'].converter = (direction, value) ->
      if direction == 'ModelToView'
        "#{value} km"

    bindings['average_speed'].converter = (direction, value) =>
      if direction == 'ModelToView'
        @model.averageSpeed()

    @modelBinder.bind(@model, @$el, bindings)

  serializeData: ->
    data = super
    data.averageSpeed = @model.averageSpeed()
    data