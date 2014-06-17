class Jogtrack.Views.Layout extends Marionette.Layout
  template: JST['backbone/templates/layout']
  className: 'backbone-app'
  el: '#home'

  regions:
    content: '.content'

  initialize: ->
    @listenTo app.session, 'change', @updateSession

  updateSession: ->
    if app.session.loggedIn()
      @$('.logout').removeClass('hidden')
    else
      @$('.logout').addClass('hidden')

  renderRegistration: ->
    @content.show(new Jogtrack.Views.Registration())

  renderLoginForm: ->
    @content.show(new Jogtrack.Views.LoginForm(model: app.session))

  renderTimeEntries: ->
    @content.show(new Jogtrack.Views.TimeEntries.Layout())

  renderNewTimeEntry: ->
    @content.show(new Jogtrack.Views.TimeEntries.New())

  renderShowTimeEntry: (modelId) ->
    model = new Jogtrack.Models.TimeEntry(id: modelId)
    @content.show(new Jogtrack.Views.TimeEntries.Show(model: model))

  renderEditTimeEntry: (modelId) ->
    model = new Jogtrack.Models.TimeEntry(id: modelId)
    @content.show(new Jogtrack.Views.TimeEntries.Edit(model: model))

  renderTimeEntriesReport: ->
    @content.show(new Jogtrack.Views.TimeEntries.ReportList())

  onRender: ->
    @updateSession()