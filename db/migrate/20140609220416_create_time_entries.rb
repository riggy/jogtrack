class CreateTimeEntries < ActiveRecord::Migration
  def change
    create_table :time_entries do |t|
      t.belongs_to :user
      t.date :date
      t.float :distance
      t.time :time
      t.float :average_speed

      t.timestamps
    end
  end
end
