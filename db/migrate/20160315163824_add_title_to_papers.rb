class AddTitleToPapers < ActiveRecord::Migration[5.0]
  def change
    add_column :papers, :title, :string
  end
end
