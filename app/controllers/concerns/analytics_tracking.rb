# Automatically records a pageview for every successful public HTML GET.
# Tracking must never break a page render, so failures are logged and swallowed.
module AnalyticsTracking
  extend ActiveSupport::Concern

  included do
    after_action :track_pageview
  end

  private

  def track_pageview
    return unless request.get?
    return unless response.successful?
    return unless response.media_type == 'text/html'
    return if skip_analytics_tracking?

    Analytics::Tracker.track(request)
  rescue StandardError => e
    Rails.logger.error("[analytics] failed to track pageview: #{e.class}: #{e.message}")
  end

  # The site owner (any basic-auth'd session) and admin pages are never tracked.
  def skip_analytics_tracking?
    session[:authenticated] || request.path.start_with?('/admin', '/dktest')
  end
end
