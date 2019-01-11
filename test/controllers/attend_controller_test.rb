require 'test_helper'

class AttendControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get attend_index_url
    assert_response :success
  end

end
