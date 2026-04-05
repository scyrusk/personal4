class ChangeTypeToBackingType < ActiveRecord::Migration[5.0]
  def self.up
    add_column :papers, :backing_type, :integer
    remove_column :papers, :type
  end

  def self.down
    remove_column :papers, :backing_type
    add_column :papers, :type, :integer
  end
end
