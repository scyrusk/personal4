class AddTitleToPapers < ActiveRecord::Migration
  def change
    add_column :papers, :title, :string
  end
end
