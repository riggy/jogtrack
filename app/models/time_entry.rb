class TimeEntry < ActiveRecord::Base
  belongs_to :user

  validates :date, presence: true
  validates :distance, presence: true
  validates :time, presence: true
  validates :average_speed, presence: true

  scope :date_from, ->(from_date) do
    where("date >= ?", from_date) unless from_date.blank?
  end

  scope :date_to, ->(to_date) do
    where("date <= ?", to_date) unless to_date.blank?
  end

  def self.weekly_report(user_id)
    sql = <<SQL
    select strftime('%W', date) as week, date, AVG(distance) as avg_distance, AVG(average_speed) as avg_speed
    from time_entries
    where user_id = '#{user_id}'
    group by week
SQL

    connection.execute sql
  end
end
