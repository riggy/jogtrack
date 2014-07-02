require "codeclimate-test-reporter"
CodeClimate::TestReporter.start

ENV["RAILS_ENV"] = "test"
require File.expand_path("../../config/environment", __FILE__)
require "rails/test_help"
require "minitest/rails"
require "authlogic/test_case"

class ActiveSupport::TestCase
  ActiveRecord::Migration.check_pending!
  include Authlogic::TestCase
end
