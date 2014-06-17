require "test_helper"

describe TimeEntry do
  setup do
    activate_authlogic
    UserSession.create users(:user)
  end

  it 'generates weekly report' do
    result = TimeEntry.weekly_report users(:user).id

    avg_distance = (time_entries(:two).distance + time_entries(:three).distance) / 2
    avg_speed = (time_entries(:two).average_speed + time_entries(:three).average_speed) / 2

    assert_equal 2, result.size
    assert_equal avg_distance, result[1]['avg_distance']
    assert_equal avg_speed, result[1]['avg_speed']
  end
end
