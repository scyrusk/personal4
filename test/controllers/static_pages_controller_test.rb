require 'test_helper'

class StaticPagesControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get root_url
    assert_response :success
  end

  test "admin requires authentication" do
    get admin_url
    assert_response :unauthorized
  end
end
