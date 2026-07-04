# Admin-only analytics dashboard (Mixpanel/GA-style) backed by AnalyticsEvent.
class AnalyticsController < ApplicationController
  before_action :authenticate

  layout 'analytics'

  PERIODS = {
    'today' => { label: 'Today',        days: 1 },
    '7d'    => { label: 'Last 7 days',  days: 7 },
    '30d'   => { label: 'Last 30 days', days: 30 },
    '90d'   => { label: 'Last 90 days', days: 90 },
    '365d'  => { label: 'Last year',    days: 365 }
  }.freeze
  DEFAULT_PERIOD = '30d'.freeze

  def index
    @period = PERIODS.key?(params[:period]) ? params[:period] : DEFAULT_PERIOD
    days = PERIODS[@period][:days]
    now = Time.current
    @range = (now - (days - 1).days).beginning_of_day..now.end_of_day
    prev_range = (@range.first - days.days)..(@range.first - 1.second)

    @daily_visitors  = AnalyticsEvent.daily_visitors(@range)
    @daily_pageviews = AnalyticsEvent.daily_pageviews(@range)
    @total_visitors  = AnalyticsEvent.total_visitors(@range)
    @total_pageviews = AnalyticsEvent.total_pageviews(@range)
    @downloads       = AnalyticsEvent.event_counts(@range)['download'] || 0

    @prev_visitors  = AnalyticsEvent.total_visitors(prev_range)
    @prev_pageviews = AnalyticsEvent.total_pageviews(prev_range)
    @prev_downloads = AnalyticsEvent.event_counts(prev_range)['download'] || 0

    @top_sources   = AnalyticsEvent.top_sources(@range)
    @top_pages     = AnalyticsEvent.top_pages(@range)
    @top_downloads = AnalyticsEvent.top_downloads(@range)
    @top_referrers = AnalyticsEvent.top_referrers(@range)
    @devices       = AnalyticsEvent.device_breakdown(@range).sort_by { |_, c| -c }
                                   .map { |device, count| [device&.capitalize, count] }
    @browsers      = AnalyticsEvent.browser_breakdown(@range).sort_by { |_, c| -c }
    @oses          = AnalyticsEvent.os_breakdown(@range).sort_by { |_, c| -c }
  end
end
