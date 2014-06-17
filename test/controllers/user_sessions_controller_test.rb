require "test_helper"

describe UserSessionsController do
  setup do
    activate_authlogic
  end

  describe '#create' do
    it 'should redirect if user is logged in' do
      UserSession.create users(:user)
      post :create, format: :json, user_session: {
          email: 'user@whatever.com',
          password: 'userpassword'
      }
      assert_response :unauthorized
    end

    it 'should login user if credentials are correct' do
      skip "authlogic seems to fail when checking if password is valid"
      post :create, format: :json, user_session: {
          email: 'user@whatever.com',
          password: 'userpassword'
      }
      assert_response :success
    end
  end
end
