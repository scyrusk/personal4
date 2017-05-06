class AddHtmlPaperUrLtoPaper < ActiveRecord::Migration
  def change
    add_column :papers, :html_paper_url, :string
  end
end
