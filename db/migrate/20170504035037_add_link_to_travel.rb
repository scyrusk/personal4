class AddLinkToTravel < ActiveRecord::Migration[5.0]
  def change
    add_column :travels, :link, :string
  end
end
