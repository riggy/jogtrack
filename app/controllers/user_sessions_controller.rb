class UserSessionsController < ApplicationController
  respond_to :json

  before_filter :require_no_user, only: :create
  before_filter :require_user, only: :destroy

  def show
    @user_session = UserSession.find
    respond_with @user_session do |format|
      format.json {render 'create'}
    end
  end

  def create
    @user_session = UserSession.new(params[:user_session])
    if @user_session.save
      flash[:notice] = "Login successful!"
      respond_with @user_session
    else
      render json: {status: :error}, status: :forbidden
    end
  end

  def destroy
    current_user_session.destroy
    render json: {status: :ok}
  end
end