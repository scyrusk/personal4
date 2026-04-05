class AddHtmlSlidesUrlToPapers < ActiveRecord::Migration[5.0]
  def change
    add_column :papers, :html_slides_url, :string
  end
end