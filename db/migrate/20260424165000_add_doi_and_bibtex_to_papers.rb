class AddDoiAndBibtexToPapers < ActiveRecord::Migration[7.0]
  def change
    add_column :papers, :doi, :string
    add_column :papers, :bibtex, :text
  end
end
