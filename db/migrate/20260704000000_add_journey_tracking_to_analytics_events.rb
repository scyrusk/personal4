class AddJourneyTrackingToAnalyticsEvents < ActiveRecord::Migration[7.0]
  def change
    change_table :analytics_events, bulk: true do |t|
      t.string :session_token
      t.string :prev_path
      t.integer :step_index
    end

    add_index :analytics_events, :session_token
    # Serves the tracker's "most recent event for this visitor" lookup;
    # supersedes the standalone visitor_token index.
    add_index :analytics_events, [:visitor_token, :occurred_at]
    remove_index :analytics_events, :visitor_token
  end
end
