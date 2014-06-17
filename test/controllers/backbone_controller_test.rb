require "test_helper"

describe BackboneController do
  it 'should load app' do
    get :home, format: :html
    assert_response :success
  end
end
