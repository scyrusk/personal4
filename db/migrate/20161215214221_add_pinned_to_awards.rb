class AddPinnedToAwards < ActiveRecord::Migration
  def change
    add_column :awards, :pinned, :boolean
  end
end
