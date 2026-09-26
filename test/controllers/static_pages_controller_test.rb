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

  test "footer omits the pre-prints view when there are none" do
    get root_url
    assert_select 'a[href=?]', '/publications?status=preprint', count: 0
  end
end
