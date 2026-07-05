require 'test_helper'

class AnalyticsTrackerTest < ActiveSupport::TestCase
  CHROME_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' \
              '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'.freeze

  def build_request(path: '/', referrer: nil, user_agent: CHROME_UA, ip: '203.0.113.5', host: 'sauvikdas.com')
    env = Rack::MockRequest.env_for("http://#{host}#{path}")
    env['HTTP_REFERER'] = referrer if referrer
    env['HTTP_USER_AGENT'] = user_agent if user_agent
    env['REMOTE_ADDR'] = ip
    ActionDispatch::Request.new(env)
  end

  test "tracks a pageview with direct source when there is no referrer" do
    event = Analytics::Tracker.track(build_request(path: '/'))

    assert_equal 'pageview', event.event_name
    assert_equal '/', event.path
    assert_equal 'Direct', event.source
    assert_equal 'direct', event.medium
    assert_equal 'desktop', event.device_type
    assert_equal 'Chrome', event.browser
    assert_equal 'macOS', event.os
    assert event.visitor_token.present?
  end

  test "classifies search, social, and referral sources" do
    google = Analytics::Tracker.track(build_request(referrer: 'https://www.google.com/search?q=sauvik'))
    assert_equal ['Google', 'organic'], [google.source, google.medium]

    scholar = Analytics::Tracker.track(build_request(referrer: 'https://scholar.google.com/citations?user=x'))
    assert_equal ['Google Scholar', 'organic'], [scholar.source, scholar.medium]

    social = Analytics::Tracker.track(build_request(referrer: 'https://t.co/abc123'))
    assert_equal ['Twitter/X', 'social'], [social.source, social.medium]

    referral = Analytics::Tracker.track(build_request(referrer: 'https://www.cmu.edu/news/story'))
    assert_equal ['cmu.edu', 'referral'], [referral.source, referral.medium]
    assert_equal 'cmu.edu', referral.referrer_host
  end

  test "utm parameters override referrer classification" do
    event = Analytics::Tracker.track(
      build_request(path: '/?utm_source=newsletter&utm_medium=email&utm_campaign=jan',
                    referrer: 'https://www.google.com/')
    )
    assert_equal 'newsletter', event.source
    assert_equal 'email', event.medium
    assert_equal 'jan', event.utm_campaign
  end

  test "internal navigation is recorded but marked internal with no source" do
    event = Analytics::Tracker.track(build_request(path: '/papers', referrer: 'https://sauvikdas.com/'))
    assert_nil event.source
    assert_equal 'internal', event.medium
    assert_nil event.referrer
  end

  test "bots and blank user agents are not tracked" do
    assert_nil Analytics::Tracker.track(build_request(user_agent: 'Googlebot/2.1 (+http://www.google.com/bot.html)'))
    assert_nil Analytics::Tracker.track(build_request(user_agent: 'curl/8.4.0'))
    assert_nil Analytics::Tracker.track(build_request(user_agent: nil))
    assert_equal 0, AnalyticsEvent.count
  end

  test "visitor token is stable within a day for same ip and ua, distinct across visitors" do
    a1 = Analytics::Tracker.new(build_request(ip: '203.0.113.5')).visitor_token
    a2 = Analytics::Tracker.new(build_request(ip: '203.0.113.5', path: '/papers')).visitor_token
    b  = Analytics::Tracker.new(build_request(ip: '198.51.100.7')).visitor_token

    assert_equal a1, a2
    assert_not_equal a1, b
  end

  test "first pageview starts a session at step zero" do
    event = Analytics::Tracker.track(build_request(path: '/'))

    assert event.session_token.present?
    assert_equal 0, event.step_index
  end

  test "pageviews within the session timeout share a session and chain step_index" do
    first = Analytics::Tracker.track(build_request(path: '/'))
    second = Analytics::Tracker.track(build_request(path: '/papers'))
    third = Analytics::Tracker.track(build_request(path: '/awards'))

    assert_equal first.session_token, second.session_token
    assert_equal 1, second.step_index
    assert_equal 2, third.step_index

    other_visitor = Analytics::Tracker.track(build_request(path: '/', ip: '198.51.100.7'))
    assert_not_equal first.session_token, other_visitor.session_token
    assert_equal 0, other_visitor.step_index
  end

  test "a gap longer than the session timeout starts a new session" do
    first = Analytics::Tracker.track(build_request(path: '/'))

    travel(Analytics::Tracker::SESSION_TIMEOUT + 1.minute) do
      second = Analytics::Tracker.track(build_request(path: '/papers'))

      assert_not_equal first.session_token, second.session_token
      assert_equal 0, second.step_index
    end
  end

  test "legacy events without a session token are not chained into a session" do
    tracker = Analytics::Tracker.new(build_request(path: '/papers'))
    AnalyticsEvent.create!(event_name: 'pageview', visitor_token: tracker.visitor_token,
                           path: '/', occurred_at: 1.minute.ago)

    event = tracker.track

    assert event.session_token.present?
    assert_equal 0, event.step_index
  end

  test "racing writes for the same journey step retry instead of forking the session" do
    first = Analytics::Tracker.track(build_request(path: '/'))
    AnalyticsEvent.create!(event_name: 'section_view', visitor_token: first.visitor_token,
                           session_token: first.session_token, step_index: 1,
                           path: '/#about', occurred_at: Time.current)

    tracker = Analytics::Tracker.new(build_request(path: '/papers'))
    stale = first
    lookups = 0
    tracker.define_singleton_method(:previous_event) do
      lookups += 1
      lookups == 1 ? stale : super()
    end

    event = tracker.track

    assert_equal 2, lookups, 'expected a conflict-driven re-read of the previous event'
    assert_equal first.session_token, event.session_token
    assert_equal 2, event.step_index
    assert_equal [0, 1, 2],
                 AnalyticsEvent.where(session_token: first.session_token).order(:step_index).pluck(:step_index)
  end

  test "duplicate journey steps are rejected by the database" do
    first = Analytics::Tracker.track(build_request(path: '/'))

    assert_raises(ActiveRecord::RecordNotUnique) do
      AnalyticsEvent.create!(event_name: 'pageview', visitor_token: first.visitor_token,
                             session_token: first.session_token, step_index: first.step_index,
                             path: '/papers', occurred_at: Time.current)
    end
  end

  test "an explicit path overrides the request path for client-reported events" do
    event = Analytics::Tracker.track(build_request(path: '/analytics/event'),
                                     event_name: 'section_view', path: '/#about')

    assert_equal 'section_view', event.event_name
    assert_equal '/#about', event.path
  end

  test "mobile user agents are classified as mobile" do
    iphone_ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 ' \
                '(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    event = Analytics::Tracker.track(build_request(user_agent: iphone_ua))
    assert_equal 'mobile', event.device_type
    assert_equal 'iOS', event.os
    assert_equal 'Safari', event.browser
  end
end
