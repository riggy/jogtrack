require "test_helper"

describe User do
  let(:user) { User.new(email: 'user@email.com', password: 'somepassword', password_confirmation: 'somepassword') }

  it "must be valid" do
    user.must_be :valid?
  end
end
