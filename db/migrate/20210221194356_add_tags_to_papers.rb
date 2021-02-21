class AddTagsToPapers < ActiveRecord::Migration
  def change
    add_column :papers, :tags, :text
    add_column :papers, :tweets, :string
  end
end
