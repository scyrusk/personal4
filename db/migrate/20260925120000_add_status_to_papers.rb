class AddStatusToPapers < ActiveRecord::Migration[7.0]
  # Publication status: 0 = published (the default for every existing paper),
  # 1 = camera-ready (accepted, final version, not yet out), 2 = pre-print
  # (posted before it appears at its venue).
  def change
    add_column :papers, :status, :integer, default: 0, null: false
  end
end
