class CreateAwards < ActiveRecord::Migration[5.0]
  def change
    create_table :awards do |t|
      t.integer :year
      t.text :body
      t.references :paper, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
