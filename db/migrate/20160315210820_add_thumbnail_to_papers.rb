class AddThumbnailToPapers < ActiveRecord::Migration[5.0]
  def change
    add_column :papers, :thumbnail, :string
  end
end
