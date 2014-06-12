class TimeEntriesController < ApplicationController
  respond_to :json, :html

  before_action :require_user, only: :index

  def index
    @time_entries = TimeEntry.all
    respond_with @time_entries
  end
end
