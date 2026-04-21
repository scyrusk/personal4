class AddProjectPageUrlToPapers < ActiveRecord::Migration[7.0]
  def change
    add_column :papers, :project_page_url, :string
  end
end
