class Jogtrack.Views.Registration extends Marionette.ItemView
  template: JST['backbone/templates/registration']

  events:
    'submit form': 'registerUser'

  initialize: (options) ->
    @model = new Jogtrack.Models.User()
    @modelBinder = new Backbone.ModelBinder()

  registerUser: (event) ->
    event.preventDefault()
    @model.save null,
      success: ->
        app.router.navigate('', {trigger: true, replace: true})
      error: (model, response, options) ->
        console.log response

  onRender: ->
    @modelBinder.bind(@model, @$el)
    Helpers.redirectLoggedIn()