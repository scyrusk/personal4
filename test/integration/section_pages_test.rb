require 'test_helper'

# SF-02/SF-13: crawlable section URLs serve the full continuous page with
# per-section canonical/title/meta; year URLs redirect to filtered views.
class SectionPagesTest < ActionDispatch::IntegrationTest
  SECTIONS = %w[about recruiting students publications].freeze

  test "each section URL serves the full page with every section anchor present" do
    SECTIONS.each do |section|
      get "/#{section}"
      assert_response :success
      # The analytics pipeline (journey_tracking.js, AnalyticsEventsController::SECTIONS)
      # depends on these exact ids being present on the one continuous page.
      SECTIONS.each do |id|
        assert_match(/id=['"]#{id}['"]/, response.body, "/#{section} should render ##{id}")
      end
    end
  end

  test "each section URL carries its own canonical link" do
    SECTIONS.each do |section|
      get "/#{section}"
      assert_response :success
      assert_match(%r{href='http://www\.example\.com/#{section}' rel='canonical'}, response.body)
    end
  end

  test "root canonicalizes to the root URL, not a section" do
    get root_url
    assert_response :success
    assert_match(%r{href='http://www\.example\.com/' rel='canonical'}, response.body)
  end

  test "publications and recruiting get section-specific titles and descriptions" do
    get "/publications"
    assert_match(%r{<title>Publications · Sauvik Das</title>}, response.body)
    assert_match(/Searchable database/, response.body)

    get "/recruiting"
    assert_match(%r{<title>Prospective Ph\.D\. Students · Sauvik Das</title>}, response.body)

    get "/about"
    assert_match(%r{<title>Sauvik Das · Human-Centered Security, Privacy &amp; AI</title>}, response.body)
  end

  test "year URLs redirect to filtered publication views" do
    get "/2026"
    assert_redirected_to "/publications?year=2026"
  end

  test "non-section and non-year top-level paths do not match the section route" do
    assert_raises(ActionController::RoutingError) { get "/1999" }
    assert_raises(ActionController::RoutingError) { get "/bogus" }
  end

  test "existing resource routes are not shadowed by the section route" do
    get "/papers.json"
    assert_response :success
    get "/travels.json"
    assert_response :success
    get "/admin"
    assert_response :unauthorized
  end

  test "student labels carry no typos (SF-03)" do
    get "/students"
    assert_response :success
    assert_no_match(/Phyiscally|collectve/, response.body)
    assert_match(/Physically-intuitive security/, response.body)
    assert_match(/Privacy collective action/, response.body)
  end

  test "recruiting keeps actionable next steps beside the status (SF-01)" do
    get "/recruiting"
    assert_response :success
    assert_match(/Apply via HCII/, response.body)
    assert_match(/Apply to the HCII Ph\.D\. program/, response.body)
    assert_match(%r{hcii\.cmu\.edu/academics/phd-hci}, response.body)
  end

  test "footer exposes section sitemap and shareable publication views (SF-13/SF-14)" do
    get root_url
    assert_response :success
    assert_match(%r{/publications\?tag=award-winning}, response.body)
    assert_match(%r{/publications\?sort=downloads}, response.body)
    SECTIONS.each { |s| assert_match(%r{site-footer-row[^>]*href='/#{s}'}, response.body) }
  end

  test "cv download analytics attribute survives the redesign" do
    get root_url
    assert_response :success
    assert_match(/data-analytics-event='cv_download'/, response.body)
  end
end
