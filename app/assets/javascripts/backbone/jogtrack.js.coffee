#= require_self
#= require_tree ./templates
#= require_tree ./models
#= require_tree ./views
#= require_tree ./routers
#= require ./helpers

@Jogtrack =
  App: new Backbone.Marionette.Application()
  Models: {}
  Collections: {}
  Views: {
    TimeEntries: {}
  }

Jogtrack.App.addInitializer( ->
  @router = new Jogtrack.Router()
  if options?
    @session = new Jogtrack.Models.Session(user: options.user, {parse: true})
  else
    @session = new Jogtrack.Models.Session()
  @layout = new Jogtrack.Views.Layout()
  @layout.render()

)

Jogtrack.App.on 'initialize:after', ->
  Backbone.history.start()

window.app = Jogtrack.App

$ ->
  $(document).ajaxError (e, xhr, settings, thrownError) ->
    if xhr.status == 401
      app.router.navigate('login', {trigger: true, replace: true})


  Jogtrack.App.start()