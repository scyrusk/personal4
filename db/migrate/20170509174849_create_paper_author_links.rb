class CreatePaperAuthorLinks < ActiveRecord::Migration
  def change
    create_table :paper_author_links do |t|
      t.integer :paper_id
      t.integer :author_id
      t.integer :author_order

      t.timestamps null: false
    end
  end
end
