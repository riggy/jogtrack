class TimeEntry < ActiveRecord::Base
  belongs_to :user

  scope :date_from, ->(from_date) do
    where("date > ?", from_date) unless from_date.blank?
  end

  scope :date_to, ->(to_date) do
    where("date < ?", to_date) unless to_date.blank?
  end
end
