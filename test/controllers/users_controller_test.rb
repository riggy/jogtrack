require "test_helper"

describe UsersController do
  describe '#create' do
    it 'should register new user with correct credentials' do
      assert_difference 'User.count' do
        post :create, format: :json, user: {
            email: 'user@someemail.com',
            password: 'password',
            password_confirmation: 'password'
        }
      end

      assert_response :success
    end

    it 'should return error if credentials are incorrect' do
      assert_no_difference 'User.count' do
        post :create, format: :json, user: {
            email: 'user@someemail.com',
            password: 'somepassword',
            password_confirmation: 'nonmatching'
        }
      end

      assert_response :unprocessable_entity
    end
  end
end
