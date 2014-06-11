class Jogtrack.Views.LoginForm extends Marionette.ItemView
  template: JST['backbone/templates/login_form']

  events:
    'submit form': 'loginUser'

  initialize: (options) ->
    @modelBinder = new Backbone.ModelBinder()

  loginUser: (event) ->
    event.preventDefault()
    @model.save()

  onRender: ->
    @modelBinder.bind(@model, @$el)