Rails.application.routes.draw do
  match "admin", to: 'static_pages#admin', via: :get, as: :admin
  match "admin/analytics", to: 'analytics#index', via: :get, as: :admin_analytics
  match "admin/analytics/realtime", to: 'analytics#realtime', via: :get, as: :admin_analytics_realtime
  match "admin/analytics/export", to: 'analytics#export', via: :get, as: :admin_analytics_export
  match "dktest", to: 'static_pages#dktest', via: :get
  root 'static_pages#index'

  resources :papers do
    member do
      get 'serve'
    end
  end

  resources :travels, except: :show
  resources :updates
  resources :awards
  resources :authors, only: :index
end
