#= require_self
#= require_tree ./templates
#= require_tree ./models
#= require_tree ./views
#= require_tree ./routers

window.Jogtrack =
  App: new Backbone.Marionette.Application()
  Models: {}
  Collections: {}
  Views: {}

Jogtrack.App.addInitializer( ->
  @router = new Jogtrack.Router()
  @layout = new Jogtrack.Views.Layout()
  @layout.render()
)

Jogtrack.App.on 'initialize:after', ->
  Backbone.history.start()

$ ->
  Jogtrack.App.start()