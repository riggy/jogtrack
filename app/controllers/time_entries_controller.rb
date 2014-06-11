class TimeEntriesController < ApplicationController
  respond_to :json

  def index
    @time_entries = TimeEntry.all
    respond_with @time_entries
  end
end
