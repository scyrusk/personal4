class AddVideoAnnotationsToPapers < ActiveRecord::Migration
  def change
    add_column :papers, :presentation_url, :string
    add_column :papers, :video_url, :string
  end
end
