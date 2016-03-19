Rails.application.routes.draw do
  match "admin", to: 'static_pages#admin', via: :get, as: :admin
  root 'static_pages#index'

  resources :papers do
    member do
      get 'serve'
    end
  end

  resources :updates
  resources :awards
  resources :authors, only: :index
end