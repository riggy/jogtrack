class Jogtrack.Views.Layout extends Marionette.Layout
  template: JST['backbone/templates/layout']
  className: 'backbone-app'
  el: '#home'

  regions:
    content: '.content'

  events:
    'click .logout': 'logout'

  renderLoginForm: ->
    @content.show(new Jogtrack.Views.LoginForm(model: Jogtrack.App.session))

  logout: (e) ->
    e.preventDefault()
    app.session.logout()
    app.router.navigate('/')
