require "test_helper"

describe TimeEntry do
  setup do
    activate_authlogic
    @user = FactoryGirl.build(:user)
    @user.save!
    UserSession.create @user

    5.times do
      time_entry = FactoryGirl.build(:time_entry, user: @user, date: Date.today + rand(2).weeks)
      time_entry.save!
    end
  end

  it 'generates weekly report' do
    result = TimeEntry.weekly_report @user.id

    time_entries = TimeEntry.select('AVG(distance) as avg_distance, AVG(average_speed) as avg_speed').group('date')

    assert_equal time_entries.to_a.size, result.size
    assert_equal time_entries[1].avg_distance, result[1]['avg_distance']
    assert_equal time_entries[1].avg_speed, result[1]['avg_speed']
  end
end
