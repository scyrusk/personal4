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
end
