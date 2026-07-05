require 'test_helper'

# POST /analytics/event — the ingest endpoint journey_tracking.js reports
# client-side journey steps (section views, outbound/email clicks, CV
# downloads) to.
class AnalyticsClientEventsTest < ActionDispatch::IntegrationTest
  CHROME_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' \
              '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'.freeze

  def post_event(params)
    post analytics_event_url, params: params, headers: { 'HTTP_USER_AGENT' => CHROME_UA }
  end

  test "a section view chains onto the pageview's session as a journey step" do
    get root_url, headers: { 'HTTP_USER_AGENT' => CHROME_UA }

    assert_difference('AnalyticsEvent.count', 1) do
      post_event(event: 'section_view', section: 'publications')
    end
    assert_response :no_content

    pageview, section = AnalyticsEvent.order(:id).last(2)
    assert_equal 'section_view', section.event_name
    assert_equal '/#publications', section.path
    assert_equal pageview.session_token, section.session_token
    assert_equal ['/', 1], [section.prev_path, section.step_index]
  end

  test "outbound clicks store the normalized host and the full url" do
    post_event(event: 'outbound_click', url: 'https://www.GitHub.com/sauvik?tab=repos')

    event = AnalyticsEvent.last
    assert_equal 'outbound_click', event.event_name
    assert_equal '/outbound/github.com', event.path
    assert_equal 'https://www.GitHub.com/sauvik?tab=repos', event.props['url']
  end

  test "email clicks and CV downloads are recorded as journey steps" do
    post_event(event: 'email_click')
    email = AnalyticsEvent.last
    assert_equal ['email_click', '/email'], [email.event_name, email.path]

    post_event(event: 'cv_download')
    cv = AnalyticsEvent.last
    assert_equal ['download', '/cv.pdf'], [cv.event_name, cv.path]
    assert_equal 'CV / Résumé', cv.props['title']
  end

  test "unknown events, unknown sections, and junk urls are dropped quietly" do
    assert_no_difference('AnalyticsEvent.count') do
      post_event(event: 'made_up')
      post_event(event: 'section_view', section: 'not-a-section')
      post_event(event: 'outbound_click', url: 'not a url')
      post_event(event: 'outbound_click', url: 'mailto:x@example.com')
    end
    assert_response :no_content
  end

  test "client events are ignored for bots and the authenticated owner" do
    assert_no_difference('AnalyticsEvent.count') do
      post analytics_event_url, params: { event: 'email_click' },
                                headers: { 'HTTP_USER_AGENT' => 'Googlebot/2.1 (+http://www.google.com/bot.html)' }
    end

    ENV['PERSONAL_UN'] = 'testadmin'
    ENV['PERSONAL_PASS'] = 'testpass'
    auth = ActionController::HttpAuthentication::Basic.encode_credentials('testadmin', 'testpass')
    get admin_url, headers: { 'HTTP_USER_AGENT' => CHROME_UA, 'HTTP_AUTHORIZATION' => auth }

    assert_no_difference('AnalyticsEvent.count') do
      post_event(event: 'email_click')
    end
    assert_response :no_content
  end
end
