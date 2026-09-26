class AddArxivUrlToPapers < ActiveRecord::Migration[7.0]
  def change
    add_column :papers, :arxiv_url, :string
  end
end
