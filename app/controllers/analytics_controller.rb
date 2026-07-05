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
  REALTIME_WINDOW = 30.minutes

  def index
    load_dashboard

    @prev_visitors  = AnalyticsEvent.total_visitors(@prev_range)
    @prev_pageviews = AnalyticsEvent.total_pageviews(@prev_range)
    @prev_downloads = AnalyticsEvent.event_counts(@prev_range)['download'] || 0

    @current_visitors = AnalyticsEvent.current_visitors(window: REALTIME_WINDOW)

    # Visitor-flow sankey (nodes/links per journey step).
    @journey = Analytics::JourneyFlow.new(@range).build
  end

  # Polled by the dashboard to keep the "active now" badge live.
  def realtime
    render json: { current_visitors: AnalyticsEvent.current_visitors(window: REALTIME_WINDOW) }
  end

  # CSV download of everything the dashboard shows for the selected period.
  def export
    load_dashboard

    csv = Analytics::CsvExporter.new(
      period_label: PERIODS[@period][:label],
      range: @range,
      granularity: @granularity,
      chart_visitors: @chart_visitors,
      chart_pageviews: @chart_pageviews,
      totals: {
        'Visitors' => @total_visitors,
        'Pageviews' => @total_pageviews,
        'Downloads' => @downloads
      },
      breakdowns: [
        ['Top sources', 'Visitors', @top_sources],
        ['Top pages', 'Views', @top_pages],
        ['Top downloads', 'Downloads', @top_downloads],
        ['Top referrers', 'Visitors', @top_referrers],
        ['Campaigns', 'Visitors', @top_campaigns],
        ['Devices', 'Visitors', @devices],
        ['Browsers', 'Visitors', @browsers],
        ['Operating systems', 'Visitors', @oses]
      ]
    ).to_csv

    send_data csv, filename: "analytics-#{@period}-#{Date.current.iso8601}.csv",
                   type: 'text/csv; charset=utf-8'
  end

  private

  # Resolves the period and loads every aggregate the dashboard (and its CSV
  # export) is built from.
  def load_dashboard
    @period = PERIODS.key?(params[:period]) ? params[:period] : DEFAULT_PERIOD
    days = PERIODS[@period][:days]
    now = Time.current
    @range = (now - (days - 1).days).beginning_of_day..now.end_of_day
    @prev_range = (@range.first - days.days)..(@range.first - 1.second)

    # GA-style granularity: the single-day "Today" view charts by hour.
    if @period == 'today'
      @granularity = 'hour'
      @chart_visitors  = AnalyticsEvent.hourly_visitors(@range)
      @chart_pageviews = AnalyticsEvent.hourly_pageviews(@range)
    else
      @granularity = 'day'
      @chart_visitors  = AnalyticsEvent.daily_visitors(@range)
      @chart_pageviews = AnalyticsEvent.daily_pageviews(@range)
    end
    @total_visitors  = AnalyticsEvent.total_visitors(@range)
    @total_pageviews = AnalyticsEvent.total_pageviews(@range)
    @downloads       = AnalyticsEvent.event_counts(@range)['download'] || 0

    @top_sources   = AnalyticsEvent.top_sources(@range)
    @top_pages     = AnalyticsEvent.top_pages(@range)
    @top_downloads = AnalyticsEvent.top_downloads(@range)
    @top_referrers = AnalyticsEvent.top_referrers(@range)
    @top_campaigns = AnalyticsEvent.top_campaigns(@range)
    @devices       = AnalyticsEvent.device_breakdown(@range).sort_by { |_, c| -c }
                                   .map { |device, count| [device&.capitalize, count] }
    @browsers      = AnalyticsEvent.browser_breakdown(@range).sort_by { |_, c| -c }
    @oses          = AnalyticsEvent.os_breakdown(@range).sort_by { |_, c| -c }
  end
end
