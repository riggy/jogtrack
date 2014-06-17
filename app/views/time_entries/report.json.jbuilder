json.array! @report do |week|
  json.week do
    json.start Date.parse(week['date']).beginning_of_week.strftime('%Y-%m-%d')
    json.end Date.parse(week['date']).end_of_week.strftime('%Y-%m-%d')
  end
  json.average_distance week['avg_distance']
  json.average_speed week['avg_speed']
end