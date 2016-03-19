class AddHtmlSlidesUrlToPapers < ActiveRecord::Migration
  def change
    add_column :papers, :html_slides_url, :string
  end
end