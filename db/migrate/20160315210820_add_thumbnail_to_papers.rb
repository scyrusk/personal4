class AddThumbnailToPapers < ActiveRecord::Migration
  def change
    add_column :papers, :thumbnail, :string
  end
end
