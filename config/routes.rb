Rails.application.routes.draw do

  resources :time_entries do
    get :report, on: :collection
  end

  resource :user_session, only: [:create, :destroy]
  resource :user, only: [:create]

  root 'backbone#home'
end
