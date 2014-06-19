require "test_helper"

describe TimeEntriesController do
  setup do
    activate_authlogic
  end

  describe 'when user logged in' do
    setup do
      @user = FactoryGirl.build(:user)
      @user.save!
      UserSession.create @user

      @time_entry = FactoryGirl.build(:time_entry, user: @user)
      @time_entry.save!

      2.times do
        time_entry = FactoryGirl.build(:time_entry, user: @user, date: Date.today + 1.week)
        time_entry.save!
      end
    end

    it 'should return set of time entries' do
      get :index, format: :json
      assert_response :success
      assert_not_nil assigns(:time_entries)
    end

    it 'should return time entry' do
      get :show, id: @time_entry.id, format: :json
      assert_response :success
      assert_not_nil assigns(:time_entry)
    end

    it 'should return weekly report' do
      get :report, format: :json
      assert_response :success
      assert_not_nil assigns(:report)
    end

    it 'should create new time entry' do
      assert_difference 'TimeEntry.count' do
        post :create, format: :json, time_entry: {
            date: Date.today.strftime('%Y-%m-%d'),
            distance: 5,
            time: 10000,
            average_speed: 20.5
        }
      end
      assert_response :success
    end

    it 'should update a time entry' do
      put :update, id: @time_entry.id, format: :json, time_entry: {
          distance: 6
      }
      assert_response :success
      assert_equal 6, @time_entry.reload.distance
    end

    it 'should destroy time entry' do
      assert_difference 'TimeEntry.count', -1 do
        delete :destroy, id: @time_entry.id, format: :json
      end
      assert_response :success
    end

  end

  describe 'when user not logged in' do
    it 'index should be forbidden' do
      get :index, format: :json
      assert_response :unauthorized
    end

    it 'report should be forbidden' do
      get :report, format: :json
      assert_response :unauthorized
    end

    it 'show should be forbidden' do
      get :show, id: 1, format: :json
      assert_response :unauthorized
    end

    it 'create should be forbidden' do
      post :create, format: :json
      assert_response :unauthorized
    end

    it 'update should be forbidden' do
      put :update, id: 1, format: :json
      assert_response :unauthorized
    end

    it 'destroy should be forbidden' do
      delete :destroy, id: 1, format: :json
      assert_response :unauthorized
    end
   end

end
