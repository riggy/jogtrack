json.user do
  json.partial! 'users/user', user: @user_session.user
end