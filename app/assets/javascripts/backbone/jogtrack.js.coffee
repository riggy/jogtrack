#= require_self
#= require_tree ./templates
#= require_tree ./models
#= require_tree ./views
#= require_tree ./routers

@Jogtrack =
  App: new Backbone.Marionette.Application()
  Models: {}
  Collections: {}
  Views: {
    TimeEntries: {}
  }

Jogtrack.App.addInitializer( ->
  @router = new Jogtrack.Router()
  @session = new Jogtrack.Models.Session()
  @session.fetch(wait: true)
  @layout = new Jogtrack.Views.Layout()
  @layout.render()

)

Jogtrack.App.on 'initialize:after', ->
  $('a').click (e) ->
    e.preventDefault()
    Jogtrack.App.router.navigate($(@).attr('href'), {trigger: true})
  Backbone.history.start()

window.app = Jogtrack.App

$ ->
  $(document).ajaxError (e, xhr, settings, thrownError) ->
    if xhr.status == 401
      app.router.navigate('', {trigger: true})


  Jogtrack.App.start()