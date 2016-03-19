class AddPdfToPapers < ActiveRecord::Migration
  def change
    add_column :papers, :pdf, :string
  end
end
