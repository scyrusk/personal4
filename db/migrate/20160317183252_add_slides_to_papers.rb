class AddSlidesToPapers < ActiveRecord::Migration[5.0]
  def change
    add_column :papers, :slides, :string
  end
end
