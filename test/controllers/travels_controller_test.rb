require 'test_helper'

class TravelsControllerTest < ActionController::TestCase
  setup do
    @travel = travels(:one)
    ENV['PERSONAL_UN'] = 'testuser'
    ENV['PERSONAL_PASS'] = 'testpass'
    request.env['HTTP_AUTHORIZATION'] = ActionController::HttpAuthentication::Basic.encode_credentials('testuser', 'testpass')
  end

  test "should get index" do
    get :index, format: :json
    assert_response :success
  end

  test "should get new" do
    get :new
    assert_response :success
  end

  test "should create travel" do
    assert_difference('Travel.count') do
      post :create, params: { travel: { date: '2024-01-01', location: 'NYC', title: 'Test', link: 'http://example.com' } }, format: :js
    end
    assert_response :success
  end

  test "should get edit" do
    get :edit, params: { id: @travel }
    assert_response :success
  end

  test "should update travel" do
    patch :update, params: { id: @travel, travel: { title: 'Updated' } }, format: :js
    assert_response :success
  end

  test "should destroy travel" do
    assert_difference('Travel.count', -1) do
      delete :destroy, params: { id: @travel }
    end
    assert_redirected_to admin_path
  end
end
