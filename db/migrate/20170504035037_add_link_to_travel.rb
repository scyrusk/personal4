class AddLinkToTravel < ActiveRecord::Migration
  def change
    add_column :travels, :link, :string
  end
end
