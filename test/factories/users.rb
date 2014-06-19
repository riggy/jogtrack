FactoryGirl.define do
  factory :user do
    email Faker::Internet.email
    password 'userpassword'
    password_confirmation 'userpassword'
  end
end