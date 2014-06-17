require "test_helper"

describe TimeEntry do
  it "must be valid" do
    time_entry.must_be :valid?
  end
end
