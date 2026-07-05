require 'test_helper'

class AnalyticsEventTest < ActiveSupport::TestCase
  def build_event(attrs = {})
    AnalyticsEvent.create!({
      event_name: 'pageview',
      visitor_token: 'v1',
      path: '/',
      source: 'Direct',
      medium: 'direct',
      occurred_at: Time.current
    }.merge(attrs))
  end

  test "daily_visitors counts distinct visitors per day and zero-fills" do
    today = Date.current
    build_event(visitor_token: 'a', occurred_at: today.in_time_zone + 1.hour)
    build_event(visitor_token: 'a', occurred_at: today.in_time_zone + 2.hours)
    build_event(visitor_token: 'b', occurred_at: today.in_time_zone + 3.hours)
    build_event(visitor_token: 'c', occurred_at: (today - 2.days).in_time_zone + 1.hour)

    range = (today - 3.days).in_time_zone..today.end_of_day
    counts = AnalyticsEvent.daily_visitors(range)

    assert_equal 4, counts.size
    assert_equal 2, counts[today]
    assert_equal 1, counts[today - 2.days]
    assert_equal 0, counts[today - 1.day]
    assert_equal 0, counts[today - 3.days]
  end

  test "hourly buckets follow the local hour and zero-fill through the current hour only" do
    travel_to Time.zone.local(2026, 7, 3, 14, 30) do
      build_event(visitor_token: 'a', occurred_at: Time.zone.local(2026, 7, 3, 9, 5))
      build_event(visitor_token: 'a', occurred_at: Time.zone.local(2026, 7, 3, 9, 40))
      build_event(visitor_token: 'b', occurred_at: Time.zone.local(2026, 7, 3, 9, 50))
      build_event(visitor_token: 'c', occurred_at: Time.zone.local(2026, 7, 2, 23, 0))

      range = Time.current.beginning_of_day..Time.current.end_of_day
      visitors = AnalyticsEvent.hourly_visitors(range)

      # 12 AM through the current (2 PM) hour, no future hours.
      assert_equal 15, visitors.size
      assert_equal Time.zone.local(2026, 7, 3, 0), visitors.keys.first
      assert_equal Time.zone.local(2026, 7, 3, 14), visitors.keys.last
      assert_equal 2, visitors[Time.zone.local(2026, 7, 3, 9)]
      assert_equal 0, visitors[Time.zone.local(2026, 7, 3, 10)]

      pageviews = AnalyticsEvent.hourly_pageviews(range)
      assert_equal 3, pageviews[Time.zone.local(2026, 7, 3, 9)]
      assert_equal 15, pageviews.size
    end
  end

  test "journey_transitions aggregates session page transitions busiest first" do
    now = Time.current
    # Session s1: / -> /papers -> /awards
    build_event(session_token: 's1', step_index: 0, path: '/', prev_path: nil, occurred_at: now)
    build_event(session_token: 's1', step_index: 1, path: '/papers', prev_path: '/', occurred_at: now)
    build_event(session_token: 's1', step_index: 2, path: '/awards', prev_path: '/papers', occurred_at: now)
    # Session s2: / -> /papers
    build_event(visitor_token: 'v2', session_token: 's2', step_index: 0, path: '/', prev_path: nil, occurred_at: now)
    build_event(visitor_token: 'v2', session_token: 's2', step_index: 1, path: '/papers', prev_path: '/', occurred_at: now)
    # Legacy row without a session is excluded.
    build_event(session_token: nil, path: '/', occurred_at: now)

    transitions = AnalyticsEvent.journey_transitions(1.hour.ago..Time.current)

    assert_equal [[nil, '/', 2], ['/', '/papers', 2], ['/papers', '/awards', 1]],
                 transitions.sort_by { |prev, path, _| [prev.to_s, path] }
    assert_equal 2, AnalyticsEvent.journey_transitions(1.hour.ago..Time.current, limit: 2).size
  end

  test "journey_exits counts each session's final page" do
    now = Time.current
    build_event(session_token: 's1', step_index: 0, path: '/', occurred_at: now)
    build_event(session_token: 's1', step_index: 1, path: '/papers', occurred_at: now)
    build_event(visitor_token: 'v2', session_token: 's2', step_index: 0, path: '/papers', occurred_at: now)
    build_event(visitor_token: 'v3', session_token: 's3', step_index: 0, path: '/', occurred_at: now)
    build_event(visitor_token: 'v3', session_token: 's3', step_index: 1, path: '/awards', occurred_at: now)

    exits = AnalyticsEvent.journey_exits(1.hour.ago..Time.current)

    assert_equal({ '/papers' => 2, '/awards' => 1 }, exits)
  end

  test "top_sources ranks by unique visitors and excludes internal navigation" do
    now = Time.current
    build_event(visitor_token: 'a', source: 'Google', medium: 'organic', occurred_at: now)
    build_event(visitor_token: 'b', source: 'Google', medium: 'organic', occurred_at: now)
    build_event(visitor_token: 'c', source: 'Direct', medium: 'direct', occurred_at: now)
    build_event(visitor_token: 'd', source: nil, medium: 'internal', occurred_at: now)

    sources = AnalyticsEvent.top_sources(1.day.ago..Time.current)
    assert_equal [['Google', 2], ['Direct', 1]], sources
  end

  test "daily_pageviews counts events not visitors" do
    today = Date.current
    build_event(visitor_token: 'a', occurred_at: today.in_time_zone + 1.hour)
    build_event(visitor_token: 'a', occurred_at: today.in_time_zone + 2.hours)

    counts = AnalyticsEvent.daily_pageviews(today.in_time_zone..today.end_of_day)
    assert_equal 2, counts[today]
  end

  test "daily buckets follow the app time zone, not UTC" do
    # 11pm Eastern is already the next day in UTC; the visit must still count
    # toward the local calendar day.
    late_evening = Time.zone.local(2026, 7, 3, 23, 0)
    assert_equal 4, late_evening.utc.day, "expected a date that crosses the UTC boundary"
    build_event(visitor_token: 'a', occurred_at: late_evening)

    day = late_evening.to_date
    counts = AnalyticsEvent.daily_visitors(day.in_time_zone..day.end_of_day)
    assert_equal({ day => 1 }, counts)
  end

  test "non-pageview events are excluded from visitor metrics but appear in event_counts" do
    now = Time.current
    build_event(visitor_token: 'a', occurred_at: now)
    build_event(visitor_token: 'b', event_name: 'download', occurred_at: now,
                props: { 'paper_id' => 5 })

    range = 1.day.ago..Time.current
    assert_equal 1, AnalyticsEvent.total_visitors(range)
    assert_equal({ 'pageview' => 1, 'download' => 1 }, AnalyticsEvent.event_counts(range))
    assert_equal({ 'paper_id' => 5 }, AnalyticsEvent.where(event_name: 'download').first.props)
  end

  test "os_breakdown counts distinct visitors per OS" do
    now = Time.current
    build_event(visitor_token: 'a', os: 'macOS', occurred_at: now)
    build_event(visitor_token: 'a', os: 'macOS', occurred_at: now)
    build_event(visitor_token: 'b', os: 'iOS', occurred_at: now)

    breakdown = AnalyticsEvent.os_breakdown(1.day.ago..Time.current)
    assert_equal({ 'macOS' => 1, 'iOS' => 1 }, breakdown)
  end

  test "top_campaigns ranks utm campaigns by unique visitors and skips untagged traffic" do
    now = Time.current
    build_event(visitor_token: 'a', utm_campaign: 'newsletter', occurred_at: now)
    build_event(visitor_token: 'a', utm_campaign: 'newsletter', occurred_at: now)
    build_event(visitor_token: 'b', utm_campaign: 'newsletter', occurred_at: now)
    build_event(visitor_token: 'c', utm_campaign: 'launch', occurred_at: now)
    build_event(visitor_token: 'd', utm_campaign: nil, occurred_at: now)
    build_event(visitor_token: 'e', utm_campaign: '', occurred_at: now)
    build_event(visitor_token: 'f', utm_campaign: 'old', occurred_at: now - 30.days)

    campaigns = AnalyticsEvent.top_campaigns(1.day.ago..Time.current)
    assert_equal [['newsletter', 2], ['launch', 1]], campaigns
  end

  test "top_downloads ranks paper titles by download count within the range" do
    now = Time.current
    2.times do |i|
      build_event(event_name: 'download', visitor_token: "v#{i}", occurred_at: now,
                  props: { 'paper_id' => 1, 'title' => 'Paper One' })
    end
    build_event(event_name: 'download', visitor_token: 'v9', occurred_at: now,
                props: { 'paper_id' => 2, 'title' => 'Paper Two' })
    build_event(event_name: 'download', visitor_token: 'v8', occurred_at: now, props: nil)
    build_event(event_name: 'download', visitor_token: 'v7', occurred_at: now - 30.days,
                props: { 'paper_id' => 1, 'title' => 'Paper One' })
    build_event(visitor_token: 'v6', occurred_at: now)

    downloads = AnalyticsEvent.top_downloads(1.day.ago..Time.current)
    assert_equal [['Paper One', 2], ['Paper Two', 1], ['Unknown paper', 1]], downloads
  end

  test "current_visitors counts distinct visitors in the window across all event types" do
    build_event(visitor_token: 'a', occurred_at: 5.minutes.ago)
    build_event(visitor_token: 'a', occurred_at: 2.minutes.ago)
    build_event(event_name: 'download', visitor_token: 'b', occurred_at: 10.minutes.ago,
                props: { 'paper_id' => 1, 'title' => 'Paper One' })
    build_event(visitor_token: 'stale', occurred_at: 45.minutes.ago)

    assert_equal 2, AnalyticsEvent.current_visitors(window: 30.minutes)
  end
end
