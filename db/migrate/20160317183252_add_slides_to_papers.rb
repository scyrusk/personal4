class AddSlidesToPapers < ActiveRecord::Migration
  def change
    add_column :papers, :slides, :string
  end
end
