class CreateUpdates < ActiveRecord::Migration[5.0]
  def change
    create_table :updates do |t|
      t.datetime :date
      t.text :text
      t.integer :backing_type

      t.timestamps null: false
    end
  end
end
