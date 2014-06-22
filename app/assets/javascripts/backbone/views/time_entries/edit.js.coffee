class Jogtrack.Views.TimeEntries.Edit extends Marionette.ItemView
  template: JST['backbone/templates/time_entries/edit']

  events:
    'submit form': 'save'
    'change input[data-limit]': 'changeTime'

  initialize: (options) ->
    if @model
      @model.fetch()
      @formType = 'Edit'
    else
      @model = new Jogtrack.Models.TimeEntry(date: moment().format('YYYY-MM-DD'))
      @formType = 'New'
    @modelBinder = new Backbone.ModelBinder()

  serializeData: ->
    data = super
    data.formType = @formType
    data

  changeTime: (e) ->
    limit = $(e.currentTarget).data('limit')
    if $(e.currentTarget).val() > limit
      $(e.currentTarget).val(limit)

  save: (e) ->
    e.preventDefault()
    @model.save null,
      success: ->
        app.router.navigate('time_entries', trigger: true)
      error: (model, response, options) =>
        if response.responseJSON.errors
          app.vent.trigger('alert', response.responseJSON.errors)

  onRender: ->
    @modelBinder.bind(@model, @$el)

    @$('.datepicker').datetimepicker
      pickTime: false
      format: 'YYYY-MM-DD'

    @$('.datepicker').on 'dp.change', () ->
      $('input', $(@)).trigger('change')