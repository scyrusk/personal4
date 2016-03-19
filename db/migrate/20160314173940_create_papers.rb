class CreatePapers < ActiveRecord::Migration
  def change
    create_table :papers do |t|
      t.integer :self_order
      t.integer :year
      t.integer :type
      t.text :venue
      t.integer :downloads
      t.integer :likes

      t.timestamps null: false
    end
  end
end
