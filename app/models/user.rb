class User < ActiveRecord::Base
  acts_as_authentic

  has_many :time_entries
end
