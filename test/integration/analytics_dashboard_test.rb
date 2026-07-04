require 'test_helper'

class AnalyticsDashboardTest < ActionDispatch::IntegrationTest
  def setup
    ENV['PERSONAL_UN'] = 'testadmin'
    ENV['PERSONAL_PASS'] = 'testpass'
    @auth = { 'HTTP_AUTHORIZATION' =>
              ActionController::HttpAuthentication::Basic.encode_credentials('testadmin', 'testpass') }
  end

  def record_pageview(occurred_at:, visitor: 'v1', path: '/', source: 'Direct', medium: nil,
                      referrer_host: nil, device: 'desktop', browser: 'Chrome')
    AnalyticsEvent.create!(
      event_name: 'pageview', visitor_token: visitor, path: path, source: source,
      medium: medium, referrer_host: referrer_host, device_type: device, browser: browser,
      occurred_at: occurred_at
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
                    referrer_host: 'news.ycombinator.com', device: 'mobile', browser: 'Safari')
    AnalyticsEvent.create!(event_name: 'download', visitor_token: 'a', path: '/papers/1/serve',
                           occurred_at: 1.day.ago, props: { 'paper_id' => 1 })

    get admin_analytics_url(period: '7d'), headers: @auth
    assert_response :success

    assert_select 'h1', 'Analytics'
    assert_select '.period-row a.active', 'Last 7 days'
    # KPI tiles: 2 visitors, 3 pageviews, 1 download
    assert_select '.stat-tile .stat-value', text: '2'
    assert_select '.stat-tile .stat-value', text: '3'
    # Breakdown panels
    assert_select '.card-title', 'Top sources'
    assert_select '.bd-text', /Google/
    assert_select '.bd-text', /Hacker News/
    assert_select '.bd-text a[href=?]', '/papers/1'
    assert_select '.bd-text', /news\.ycombinator\.com/
    assert_select '.bd-text', /Mobile/
    assert_select '.bd-text', /Safari/
    # Chart data table is present and reachable without JS
    assert_select '.chart-table table tbody tr', 7
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
end
