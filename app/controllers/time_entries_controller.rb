class TimeEntriesController < ApplicationController
  respond_to :html, :json

  def index
    @time_entries = TimeEntry.all
    respond_with @time_entries do |format|
      format.json { render layout: false }
    end
  end
end
