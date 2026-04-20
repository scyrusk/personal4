class AddTitleToTravel < ActiveRecord::Migration[5.0]
  def change
    add_column :travels, :title, :string
  end
end
