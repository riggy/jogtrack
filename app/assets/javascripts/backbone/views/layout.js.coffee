class Jogtrack.Views.Layout extends Marionette.Layout
  template: JST['backbone/templates/layout']
  className: 'backbone-app'
  el: '#home'

  regions:
    content: '.content'
    alerts: '.alerts'

  initialize: ->
    @listenTo app.session, 'change', @updateSession
    @listenTo app.vent, 'alert', @handleAlert
    @alertsCollection = new Jogtrack.Collections.Alerts()

  handleAlert: (errors) ->
    if errors?
      _.each errors, (value, index) =>
        @alertsCollection.add({text: value, type: index})


  updateSession: ->
    if app.session.loggedIn()
      @$('.navbar-nav.logged-in').removeClass('hide')
      @$('.navbar-nav.logged-out').addClass('hide')
    else
      @$('.navbar-nav.logged-in').addClass('hide')
      @$('.navbar-nav.logged-out').removeClass('hide')

  setActiveButton: (btnSelector) ->
    @$('.navbar-nav .active').removeClass('active')
    @$(btnSelector).addClass('active')

  renderRegistration: ->
    @setActiveButton('.register')
    @content.show(new Jogtrack.Views.Registration())

  renderLoginForm: ->
    @setActiveButton('.login')
    @content.show(new Jogtrack.Views.LoginForm(model: app.session))

  renderTimeEntries: ->
    @setActiveButton('.time-entries')
    @content.show(new Jogtrack.Views.TimeEntries.Layout())

  renderNewTimeEntry: ->
    @setActiveButton('.new-time-entry')
    @content.show(new Jogtrack.Views.TimeEntries.Edit())

  renderShowTimeEntry: (modelId) ->
    @setActiveButton('.time-entries')
    model = new Jogtrack.Models.TimeEntry(id: modelId)
    @content.show(new Jogtrack.Views.TimeEntries.Show(model: model))

  renderEditTimeEntry: (modelId) ->
    @setActiveButton('.time-entries')
    model = new Jogtrack.Models.TimeEntry(id: modelId)
    @content.show(new Jogtrack.Views.TimeEntries.Edit(model: model))

  renderTimeEntriesReport: ->
    @setActiveButton('.weekly-report')
    @content.show(new Jogtrack.Views.TimeEntries.ReportList())

  onRender: ->
    @updateSession()
    @alerts.show(new Jogtrack.Views.AlertList(collection: @alertsCollection))