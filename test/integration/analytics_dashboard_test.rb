require 'test_helper'

class AnalyticsDashboardTest < ActionDispatch::IntegrationTest
  def setup
    ENV['PERSONAL_UN'] = 'testadmin'
    ENV['PERSONAL_PASS'] = 'testpass'
    @auth = { 'HTTP_AUTHORIZATION' =>
              ActionController::HttpAuthentication::Basic.encode_credentials('testadmin', 'testpass') }
  end

  def record_pageview(occurred_at:, visitor: 'v1', path: '/', source: 'Direct', medium: nil,
                      referrer_host: nil, device: 'desktop', browser: 'Chrome', os: 'macOS',
                      utm_campaign: nil, session: nil, step: nil)
    AnalyticsEvent.create!(
      event_name: 'pageview', visitor_token: visitor, path: path, source: source,
      medium: medium, referrer_host: referrer_host, device_type: device, browser: browser,
      os: os, utm_campaign: utm_campaign, occurred_at: occurred_at,
      session_token: session, step_index: step
    )
  end

  test "requires basic auth" do
    get admin_analytics_url
    assert_response :unauthorized
  end

  test "renders the dashboard with aggregates for the selected period" do
    record_pageview(occurred_at: 1.day.ago, visitor: 'a', source: 'Google', medium: 'search',
                    referrer_host: 'www.google.com')
    record_pageview(occurred_at: 1.day.ago, visitor: 'a', path: '/papers/1')
    record_pageview(occurred_at: 2.days.ago, visitor: 'b', source: 'Hacker News', medium: 'social',
                    referrer_host: 'news.ycombinator.com', device: 'mobile', browser: 'Safari',
                    os: 'iOS', utm_campaign: 'launch-week')
    AnalyticsEvent.create!(event_name: 'download', visitor_token: 'a', path: '/papers/1/serve',
                           occurred_at: 1.day.ago,
                           props: { 'paper_id' => 1, 'title' => 'A Great Paper' })

    get admin_analytics_url(period: '7d'), headers: @auth
    assert_response :success

    assert_select 'h1', 'Analytics'
    assert_select '.period-row a.active', 'Last 7 days'
    # KPI tiles: 2 visitors, 3 pageviews, 1 download
    assert_select '.stat-tile .stat-value', text: '2'
    assert_select '.stat-tile .stat-value', text: '3'
    # Breakdown panels
    assert_select '.card-title', 'Top sources'
    assert_select '.card-title', 'Top downloads'
    assert_select '.bd-text', /A Great Paper/
    assert_select '.bd-text', /Google/
    assert_select '.bd-text', /Hacker News/
    assert_select '.bd-text a[href=?]', '/papers/1'
    assert_select '.bd-text', /news\.ycombinator\.com/
    assert_select '.bd-text', /Mobile/
    assert_select '.bd-text', /Safari/
    assert_select '.card-title', 'Operating systems'
    assert_select '.bd-text', /iOS/
    assert_select '.bd-text', /macOS/
    assert_select '.card-title', 'Campaigns'
    assert_select '.bd-text', /launch-week/
    # Multi-day periods chart by day; data table is reachable without JS
    assert_select '.chart-card .card-title', 'Visitors & pageviews per day'
    assert_select '.chart-table table tbody tr', 7
  end

  test "the today period charts by hour in the local time zone" do
    travel_to Time.zone.local(2026, 7, 3, 14, 30) do
      record_pageview(occurred_at: Time.zone.local(2026, 7, 3, 9, 15), visitor: 'a')

      get admin_analytics_url(period: 'today'), headers: @auth
      assert_response :success

      assert_select '.chart-card .card-title', 'Visitors & pageviews per hour'
      assert_select '.chart-table table thead th', 'Hour'
      # 12 AM through the current (2 PM) hour — no future hours trailing zeros
      assert_select '.chart-table table tbody tr', 15
      assert_select '.chart-table td', 'Jul 3, 9 AM'
    end
  end

  test "renders the visitor flow sankey from sessionized journeys" do
    record_pageview(occurred_at: 2.hours.ago, visitor: 'a', session: 's1', step: 0)
    AnalyticsEvent.create!(event_name: 'download', visitor_token: 'a', path: '/papers/1/serve',
                           session_token: 's1', step_index: 1, occurred_at: 2.hours.ago,
                           props: { 'paper_id' => 1, 'title' => 'A Great Paper' })
    record_pageview(occurred_at: 1.hour.ago, visitor: 'b', session: 's2', step: 0)

    get admin_analytics_url(period: '7d'), headers: @auth
    assert_response :success

    assert_select '.chart-card .card-title', 'Visitor flow'
    assert_select '.flow-note', /How 2 visits moved through the site/

    # The data table mirrors every sankey ribbon: / -> download, / -> exit, download -> exit.
    assert_select '.flow-table td', 'Download: A Great Paper'
    assert_select '.flow-table td', 'Exited'
    assert_select '.flow-table tbody tr', 3

    journey = JSON.parse(css_select('script#journeyData').first.text)
    assert_equal 2, journey['total_sessions']
    assert_includes journey['nodes'].map { |n| n['label'] }, 'Download: A Great Paper'
    assert_equal journey['links'].size, journey['links'].map { |l| l.values_at('source', 'target') }.uniq.size
  end

  test "shows an empty visitor flow state for legacy events without sessions" do
    record_pageview(occurred_at: 1.day.ago, visitor: 'a')

    get admin_analytics_url(period: '7d'), headers: @auth
    assert_response :success
    assert_select '.chart-empty', /No visitor journeys recorded/
  end

  test "falls back to the default period for unknown period params" do
    get admin_analytics_url(period: 'bogus'), headers: @auth
    assert_response :success
    assert_select '.period-row a.active', 'Last 30 days'
  end

  test "shows empty states when there is no data" do
    get admin_analytics_url, headers: @auth
    assert_response :success
    assert_select '.chart-empty', /No traffic recorded/
    assert_select '.panel-empty', minimum: 1
  end

  test "events outside the period are excluded" do
    record_pageview(occurred_at: 20.days.ago, visitor: 'old')
    get admin_analytics_url(period: '7d'), headers: @auth
    assert_response :success
    assert_select '.chart-empty', /No traffic recorded/
  end

  test "visiting the analytics dashboard is itself never tracked" do
    assert_no_difference('AnalyticsEvent.count') do
      get admin_analytics_url, headers: @auth
    end
  end

  test "admin page still authenticates after auth moved to ApplicationController" do
    get admin_url, headers: @auth
    assert_response :success
    assert_select 'a[href=?]', '/admin/analytics'
  end

  test "dashboard header shows the realtime active-now badge" do
    record_pageview(occurred_at: 5.minutes.ago, visitor: 'live-a')
    record_pageview(occurred_at: 10.minutes.ago, visitor: 'live-b')
    record_pageview(occurred_at: 2.hours.ago, visitor: 'stale')

    get admin_analytics_url, headers: @auth
    assert_response :success
    assert_select '.analytics-live #liveCount', '2'
  end

  test "realtime endpoint requires auth and returns the active visitor count" do
    get admin_analytics_realtime_url
    assert_response :unauthorized

    record_pageview(occurred_at: 3.minutes.ago, visitor: 'live-a')
    record_pageview(occurred_at: 45.minutes.ago, visitor: 'stale')

    get admin_analytics_realtime_url, headers: @auth
    assert_response :success
    assert_equal 1, JSON.parse(response.body)['current_visitors']
  end

  test "polling the realtime endpoint is itself never tracked" do
    assert_no_difference('AnalyticsEvent.count') do
      get admin_analytics_realtime_url, headers: @auth
    end
  end

  test "csv export requires basic auth" do
    get admin_analytics_export_url
    assert_response :unauthorized
  end

  test "csv export contains the time series, totals, and breakdowns for the period" do
    record_pageview(occurred_at: 1.day.ago, visitor: 'a', source: 'Google', medium: 'search',
                    referrer_host: 'www.google.com')
    record_pageview(occurred_at: 2.days.ago, visitor: 'b', utm_campaign: 'launch-week')
    record_pageview(occurred_at: 20.days.ago, visitor: 'old', source: 'Bing')
    AnalyticsEvent.create!(event_name: 'download', visitor_token: 'a', path: '/papers/1/serve',
                           occurred_at: 1.day.ago, props: { 'title' => 'A Great Paper' })

    get admin_analytics_export_url(period: '7d'), headers: @auth
    assert_response :success
    assert_match %r{\Atext/csv}, response.content_type
    assert_match(/analytics-7d-\d{4}-\d{2}-\d{2}\.csv/, response.headers['Content-Disposition'])

    rows = CSV.parse(response.body)
    assert_equal ['Analytics export', 'Last 7 days'], rows.first
    assert_includes rows, %w[Date Visitors Pageviews]
    assert_includes rows, [1.day.ago.to_date.iso8601, '1', '1']
    assert_includes rows, %w[Totals Value]
    assert_includes rows, %w[Visitors 2]
    assert_includes rows, %w[Downloads 1]
    assert_includes rows, %w[Google 1]
    assert_includes rows, ['A Great Paper', '1']
    assert_includes rows, ['launch-week', '1']
    # 20-day-old Bing visit is outside the 7d period
    assert_not_includes response.body, 'Bing'
  end

  test "csv export includes the visitor flow section" do
    record_pageview(occurred_at: 1.day.ago, visitor: 'a', session: 's1', step: 0)
    record_pageview(occurred_at: 1.day.ago, visitor: 'a', path: '/#about', session: 's1', step: 1)

    get admin_analytics_export_url(period: '7d'), headers: @auth
    assert_response :success

    rows = CSV.parse(response.body)
    assert_includes rows, ['Visitor flow (1 session)']
    assert_includes rows, %w[Step From To Sessions]
    assert_includes rows, ['1', '/', '/#about', '1']
    assert_includes rows, ['2', '/#about', 'Exited', '1']
  end

  test "csv export of the today period uses hourly buckets" do
    travel_to Time.zone.local(2026, 7, 3, 14, 30) do
      record_pageview(occurred_at: Time.zone.local(2026, 7, 3, 9, 15), visitor: 'a')

      get admin_analytics_export_url(period: 'today'), headers: @auth
      assert_response :success

      rows = CSV.parse(response.body)
      assert_includes rows, %w[Hour Visitors Pageviews]
      assert_includes rows, ['2026-07-03 09:00', '1', '1']
    end
  end

  test "downloading the csv export is itself never tracked" do
    assert_no_difference('AnalyticsEvent.count') do
      get admin_analytics_export_url, headers: @auth
    end
  end

  test "dashboard links to the csv export for the current period" do
    get admin_analytics_url(period: '7d'), headers: @auth
    assert_response :success
    assert_select '.analytics-header-links a[href=?]', '/admin/analytics/export?period=7d', 'Export CSV'
  end
end
