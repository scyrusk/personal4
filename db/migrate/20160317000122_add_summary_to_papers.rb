class AddSummaryToPapers < ActiveRecord::Migration[5.0]
  def change
    add_column :papers, :summary, :text
  end
end
