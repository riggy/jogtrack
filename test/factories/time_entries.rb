FactoryGirl.define do
  factory :time_entry do
    date Date.today
    distance { rand(10000) }
    time { rand(1000000) }
    average_speed { rand(100) }
  end
end