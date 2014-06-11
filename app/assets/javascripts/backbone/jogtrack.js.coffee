#= require_self
#= require_tree ./templates
#= require_tree ./models
#= require_tree ./views
#= require_tree ./routers

@Jogtrack =
  App: new Backbone.Marionette.Application()
  Models: {}
  Collections: {}
  Views: {}

Jogtrack.App.addInitializer( ->
  @router = new Jogtrack.Router()
  @session = new Jogtrack.Models.Session()
  @session.fetch(wait: true)
  @layout = new Jogtrack.Views.Layout()
  @layout.render()
)

Jogtrack.App.on 'initialize:after', ->
  Backbone.history.start()

window.app = Jogtrack.App

$ ->
  Jogtrack.App.start()