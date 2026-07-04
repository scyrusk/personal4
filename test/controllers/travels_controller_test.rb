require 'test_helper'

class TravelsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @travel = travels(:one)
    ENV['PERSONAL_UN'] = 'testadmin'
    ENV['PERSONAL_PASS'] = 'testpass'
    @auth = { 'HTTP_AUTHORIZATION' =>
              ActionController::HttpAuthentication::Basic.encode_credentials('testadmin', 'testpass') }
  end

  test "index is public and returns json" do
    get travels_url(format: :json)
    assert_response :success
    assert_kind_of Array, JSON.parse(response.body)
  end

  test "new requires authentication" do
    get new_travel_url
    assert_response :unauthorized

    get new_travel_url, headers: @auth
    assert_response :success
  end

  test "create makes a travel" do
    assert_difference('Travel.count') do
      post travels_url(format: :js),
           params: { travel: { title: 'Talk', location: 'Pittsburgh', date: '2026-07-01' } },
           headers: @auth
    end
    assert_response :success
  end

  test "update changes a travel" do
    patch travel_url(@travel, format: :js),
          params: { travel: { location: 'NYC' } }, headers: @auth
    assert_response :success
    assert_equal 'NYC', @travel.reload.location
  end

  test "destroy removes a travel" do
    assert_difference('Travel.count', -1) do
      delete travel_url(@travel), headers: @auth
    end
    assert_redirected_to admin_path
  end
end
