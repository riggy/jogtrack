require "test_helper"

describe TimeEntry do
  let(:time_entry) { TimeEntry.new }

  it "must be valid" do
    time_entry.must_be :valid?
  end
end
