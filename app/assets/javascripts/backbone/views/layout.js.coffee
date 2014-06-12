class Jogtrack.Views.Layout extends Marionette.Layout
  template: JST['backbone/templates/layout']
  className: 'backbone-app'
  el: '#home'

  regions:
    content: '.content'

  renderLoginForm: ->
    @content.show(new Jogtrack.Views.LoginForm(model: Jogtrack.App.session))

  renderTimeEntries: ->
    @content.show(new Jogtrack.Views.TimeEntries.List())