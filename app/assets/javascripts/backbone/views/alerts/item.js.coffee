class Jogtrack.Views.AlertItem extends Marionette.ItemView
  template: JST['backbone/templates/alerts/item']
  className: 'alert alert-danger alert-dismissable'

  hideAlert: =>
    @$el.fadeOut =>
      @model.destroy()

  onRender: ->
    _.delay @hideAlert, 5000