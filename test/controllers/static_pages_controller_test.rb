require 'test_helper'

class StaticPagesControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get root_url
    assert_response :success
  end

  test "public pages no longer embed the legacy Google Analytics snippet" do
    get root_url
    assert_response :success
    assert_no_match(/google-analytics|_gaq/, response.body)
  end

  test "admin requires authentication" do
    get admin_url
    assert_response :unauthorized
  end

  test "no-JS list filters by ?status= and footer links the pre-prints view" do
    Paper.create!(title: 'An arXiv Pre-print', year: 2026, self_order: 1, status: :preprint,
                  arxiv_url: '2509.01234')
    get '/publications', params: { status: 'preprint' }
    assert_response :success
    assert_select '.noscript-filter-summary', /Pre-prints — 1 paper\./
    assert_select '.noscript-paper-list li', 1
    assert_select '.noscript-paper-list li a[href=?]', 'https://arxiv.org/abs/2509.01234', text: 'An arXiv Pre-print'
    assert_select '.noscript-paper-meta', /arXiv · 2026 · Pre-print/
    assert_select 'a[href=?]', '/publications?status=preprint', text: /Pre-prints/
  end

  test "no-JS list hides pre-prints by default and shows them with ?preprints=on" do
    Paper.create!(title: 'A Venue Paper', venue: 'CHI', year: 2026, self_order: 1)
    Paper.create!(title: 'A Hidden Pre-print', year: 2026, self_order: 1, status: :preprint,
                  arxiv_url: '2509.01234')

    get '/publications'
    assert_select '.noscript-paper-list li', text: /A Venue Paper/
    assert_select '.noscript-paper-list li', text: /A Hidden Pre-print/, count: 0
    assert_select '.section-subtitle', /and 1 pre-print,/

    get '/publications', params: { preprints: 'on' }
    assert_select '.noscript-paper-list li', text: /A Hidden Pre-print/
    assert_select '.noscript-filter-summary', /including pre-prints/
  end

  test "footer omits the pre-prints view when there are none" do
    get root_url
    assert_select 'a[href=?]', '/publications?status=preprint', count: 0
  end

  test "no-JS list searches word by word" do
    Paper.create!(title: 'Location Disclosure by Vision-Language Models', venue: 'EMNLP', year: 2025,
                  self_order: 1, tags: 'Privacy')
    Paper.create!(title: 'A Chair Study', venue: 'CHI', year: 2024, self_order: 1)

    get '/publications', params: { q: 'location privacy' }
    assert_select '.noscript-paper-list li', 1
    assert_select '.noscript-paper-list li', text: /Location Disclosure/

    get '/publications', params: { q: 'ai' }
    assert_select '.noscript-paper-list li', text: /A Chair Study/, count: 0
  end
end
