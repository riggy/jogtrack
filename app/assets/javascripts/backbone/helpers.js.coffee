class Helpers

  redirectLoggedIn: ->
    if app.session.loggedIn()
      app.router.navigate('time_entries', {trigger: true, replace: true})

@Helpers = new Helpers()