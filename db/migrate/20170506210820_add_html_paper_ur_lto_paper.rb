class AddHtmlPaperUrLtoPaper < ActiveRecord::Migration[5.0]
  def change
    add_column :papers, :html_paper_url, :string
  end
end
