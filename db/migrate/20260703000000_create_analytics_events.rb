class CreateAnalyticsEvents < ActiveRecord::Migration[7.0]
  def change
    create_table :analytics_events do |t|
      t.string :event_name, null: false, default: 'pageview'
      t.string :visitor_token, null: false
      t.string :path
      t.string :referrer
      t.string :referrer_host
      t.string :source
      t.string :medium
      t.string :utm_source
      t.string :utm_medium
      t.string :utm_campaign
      t.string :device_type
      t.string :browser
      t.string :os
      t.text :props
      t.datetime :occurred_at, null: false

      t.timestamps
    end

    add_index :analytics_events, [:event_name, :occurred_at]
    add_index :analytics_events, :visitor_token
    add_index :analytics_events, :source
    add_index :analytics_events, :occurred_at
  end
end
