class AddJourneyTrackingToAnalyticsEvents < ActiveRecord::Migration[7.0]
  def change
    change_table :analytics_events, bulk: true do |t|
      t.string :session_token
      t.integer :step_index
    end

    # Unique so concurrent requests can't fork a journey by racing for the
    # same step; the tracker retries on conflict. Also serves session lookups.
    add_index :analytics_events, [:session_token, :step_index], unique: true
    # Serves the tracker's "most recent event for this visitor" lookup;
    # supersedes the standalone visitor_token index.
    add_index :analytics_events, [:visitor_token, :occurred_at]
    remove_index :analytics_events, :visitor_token
  end
end
