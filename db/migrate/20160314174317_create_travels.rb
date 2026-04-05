class CreateTravels < ActiveRecord::Migration[5.0]
  def change
    create_table :travels do |t|
      t.datetime :date
      t.string :location

      t.timestamps null: false
    end
  end
end
