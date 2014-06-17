class UsersController < ApplicationController
  respond_to :json

  before_action :require_no_user

  def create
    @user = User.new(permitted_params)
    @user.save_without_session_maintenance
    respond_with @user
  end

  private
  def permitted_params
    params[:user].permit(:email, :password, :password_confirmation)
  end
end
