class AddTagsToPapers < ActiveRecord::Migration[5.0]
  def change
    add_column :papers, :tags, :text
    add_column :papers, :tweets, :string
  end
end
