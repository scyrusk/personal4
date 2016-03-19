class AddSummaryToPapers < ActiveRecord::Migration
  def change
    add_column :papers, :summary, :text
  end
end
