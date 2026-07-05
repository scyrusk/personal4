require 'test_helper'

class AnalyticsTrackingTest < ActionDispatch::IntegrationTest
  CHROME_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' \
              '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'.freeze

  test "visiting the homepage records a pageview" do
    assert_difference('AnalyticsEvent.count', 1) do
      get root_url, headers: { 'HTTP_USER_AGENT' => CHROME_UA }
    end
    assert_response :success

    event = AnalyticsEvent.last
    assert_equal 'pageview', event.event_name
    assert_equal '/', event.path
    assert_equal 'Direct', event.source
  end

  test "referrer and utm information is captured" do
    get root_url + '?utm_source=newsletter&utm_medium=email',
        headers: { 'HTTP_USER_AGENT' => CHROME_UA, 'HTTP_REFERER' => 'https://www.google.com/' }

    event = AnalyticsEvent.last
    assert_equal 'newsletter', event.source
    assert_equal 'email', event.medium
    assert_equal 'google.com', event.referrer_host
  end

  test "successive pageviews chain a journey within one session" do
    get root_url, headers: { 'HTTP_USER_AGENT' => CHROME_UA }
    get root_url, headers: { 'HTTP_USER_AGENT' => CHROME_UA, 'HTTP_REFERER' => root_url }

    first, second = AnalyticsEvent.order(:id).last(2)
    assert_equal first.session_token, second.session_token
    assert_equal 0, first.step_index
    assert_equal 1, second.step_index
  end

  test "bot requests are not recorded" do
    assert_no_difference('AnalyticsEvent.count') do
      get root_url, headers: { 'HTTP_USER_AGENT' => 'Googlebot/2.1 (+http://www.google.com/bot.html)' }
    end
    assert_response :success
  end

  test "authenticated admin sessions are not tracked" do
    ENV['PERSONAL_UN'] = 'testadmin'
    ENV['PERSONAL_PASS'] = 'testpass'
    auth = ActionController::HttpAuthentication::Basic.encode_credentials('testadmin', 'testpass')

    get admin_url, headers: { 'HTTP_USER_AGENT' => CHROME_UA, 'HTTP_AUTHORIZATION' => auth }
    assert_response :success

    assert_no_difference('AnalyticsEvent.count') do
      get root_url, headers: { 'HTTP_USER_AGENT' => CHROME_UA }
    end
  end

  test "admin page itself is never tracked" do
    ENV['PERSONAL_UN'] = 'testadmin'
    ENV['PERSONAL_PASS'] = 'testpass'
    auth = ActionController::HttpAuthentication::Basic.encode_credentials('testadmin', 'testpass')

    assert_no_difference('AnalyticsEvent.count') do
      get admin_url, headers: { 'HTTP_USER_AGENT' => CHROME_UA, 'HTTP_AUTHORIZATION' => auth }
    end
  end
end
