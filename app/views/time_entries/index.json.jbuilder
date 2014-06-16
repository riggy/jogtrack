json.array! @time_entries do |time_entry|
  json.partial! 'time_entry', time_entry: time_entry
end