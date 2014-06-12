json.array! @time_entries do |time_entry|
  json.(time_entry, :id, :date, :distance, :time, :average_speed)
end