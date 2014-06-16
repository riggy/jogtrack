class TimeEntriesController < ApplicationController
  respond_to :json
  before_action :require_user, only: :index

  def index
    @time_entries = current_user.
        time_entries.
        date_from(params[:date_from]).
        date_to(params[:date_to])

    respond_with @time_entries
  end

  def show
    @time_entry = current_user.time_entries.find(params[:id])
    respond_with @time_entry
  end

  def create
    @time_entry = TimeEntry.new(permitted_params)
    @time_entry.user = current_user
    @time_entry.save
    respond_with @time_entry
  end

  def update
    @time_entry = current_user.time_entries.find(params[:id])
    @time_entry.update_attributes(permitted_params)
    respond_with @time_entry
  end

  def destroy
    time_entry = current_user.time_entries.find(params[:id])
    time_entry.destroy
    render json: {status: :ok}
  end

  def report
    @time_entries
  end

  private
  def permitted_params
    params[:time_entry].permit(:date, :distance, :time, :average_speed)
  end
end
