class UsersController < ApplicationController
  respond_to :json

  def create
    @user = User.new(params[:user].permit(:email, :password, :password_confirmation))
    @user.save_without_session_maintenance
    respond_with @user
  end
end
