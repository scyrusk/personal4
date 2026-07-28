Rails.application.routes.draw do
  match "admin", to: 'static_pages#admin', via: :get, as: :admin
  match "admin/analytics", to: 'analytics#index', via: :get, as: :admin_analytics
  match "admin/analytics/realtime", to: 'analytics#realtime', via: :get, as: :admin_analytics_realtime
  match "admin/analytics/export", to: 'analytics#export', via: :get, as: :admin_analytics_export
  match "analytics/event", to: 'analytics_events#create', via: :post, as: :analytics_event
  match "dktest", to: 'static_pages#dktest', via: :get
  root 'static_pages#index'

  # SF-02: crawlable, indexable section URLs (one continuous page, four entry points)
  get "/:section", to: "static_pages#index", as: :section,
      constraints: { section: /about|recruiting|students|publications/ }
  # SF-13: shareable year views (footer "By year" links)
  get "/:year", to: redirect("/publications?year=%{year}"),
      constraints: { year: /20\d{2}/ }

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
