class AddPdfToPapers < ActiveRecord::Migration[5.0]
  def change
    add_column :papers, :pdf, :string
  end
end
