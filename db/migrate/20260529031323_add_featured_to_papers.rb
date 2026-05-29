class AddFeaturedToPapers < ActiveRecord::Migration[7.0]
  def change
    add_column :papers, :featured, :boolean, default: false, null: false
  end
end
