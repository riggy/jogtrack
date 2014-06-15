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
    @content.show(new Jogtrack.Views.LoginForm(model: Jogtrack.App.session))

  renderTimeEntries: ->
    @content.show(new Jogtrack.Views.TimeEntries.List())

  onRender: ->
    @updateSession()