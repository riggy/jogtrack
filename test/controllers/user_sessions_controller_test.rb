require "test_helper"

describe UserSessionsController do
  setup do
    activate_authlogic
    @user = FactoryGirl.build(:user)
    @user.save!
  end

  describe '#create' do
    it 'should redirect if user is logged in' do
      UserSession.create @user if UserSession.find.blank?
      post :create, format: :json, user_session: {
          email: @user.email,
          password: 'userpassword'
      }
      assert_response :unauthorized
    end

    it 'should login user if credentials are correct' do
      UserSession.find.destroy if UserSession.find.present?
      post :create, format: :json, user_session: {
          email: @user.email,
          password: 'userpassword'
      }
      assert_response :success
    end
  end
end
