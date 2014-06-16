class CreateTimeEntries < ActiveRecord::Migration
  def change
    create_table :time_entries do |t|
      t.belongs_to :user
      t.date :date
      t.integer :distance
      t.integer :time
      t.float :average_speed

      t.timestamps
    end
  end
end
