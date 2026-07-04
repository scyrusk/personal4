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
    build_event(visitor_token: 'a', occurred_at: today.to_time + 1.hour)
    build_event(visitor_token: 'a', occurred_at: today.to_time + 2.hours)
    build_event(visitor_token: 'b', occurred_at: today.to_time + 3.hours)
    build_event(visitor_token: 'c', occurred_at: (today - 2.days).to_time + 1.hour)

    range = (today - 3.days).to_time..today.end_of_day
    counts = AnalyticsEvent.daily_visitors(range)

    assert_equal 4, counts.size
    assert_equal 2, counts[today]
    assert_equal 1, counts[today - 2.days]
    assert_equal 0, counts[today - 1.day]
    assert_equal 0, counts[today - 3.days]
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
    build_event(visitor_token: 'a', occurred_at: today.to_time + 1.hour)
    build_event(visitor_token: 'a', occurred_at: today.to_time + 2.hours)

    counts = AnalyticsEvent.daily_pageviews(today.to_time..today.end_of_day)
    assert_equal 2, counts[today]
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
end
