# A single tracked event (pageview, download, ...). Rows are written by
# Analytics::Tracker; the class methods here are the query API used by the
# admin analytics dashboard.
class AnalyticsEvent < ActiveRecord::Base
  serialize :props, JSON

  validates :event_name, presence: true
  validates :visitor_token, presence: true
  validates :occurred_at, presence: true

  scope :pageviews, -> { where(event_name: 'pageview') }
  scope :between, ->(range) { where(occurred_at: range) }
  # Internal navigation (referrer is this site) shouldn't count as a source.
  scope :external, -> { where.not(medium: 'internal').or(where(medium: nil)) }

  class << self
    # { Date => distinct visitor count }, with zero-filled days across the range.
    # Bucketing happens in Ruby because days must follow Time.zone, and SQLite's
    # DATE() can only truncate the stored UTC timestamps.
    def daily_visitors(range)
      counts = pageviews.between(range).pluck(:occurred_at, :visitor_token)
        .group_by { |occurred_at, _| occurred_at.in_time_zone.to_date }
        .transform_values { |rows| rows.map(&:last).uniq.size }
      zero_fill(range, counts)
    end

    # { Date => pageview count }, with zero-filled days across the range.
    def daily_pageviews(range)
      counts = pageviews.between(range).pluck(:occurred_at)
        .group_by { |occurred_at| occurred_at.in_time_zone.to_date }
        .transform_values(&:size)
      zero_fill(range, counts)
    end

    # { Time (hour start) => distinct visitor count } for intraday views.
    # Zero-filled hourly, capped at the current hour so a partial day doesn't
    # trail future zeros.
    def hourly_visitors(range)
      counts = pageviews.between(range).pluck(:occurred_at, :visitor_token)
        .group_by { |occurred_at, _| occurred_at.in_time_zone.beginning_of_hour }
        .transform_values { |rows| rows.map(&:last).uniq.size }
      zero_fill_hours(range, counts)
    end

    # { Time (hour start) => pageview count }, zero-filled like hourly_visitors.
    def hourly_pageviews(range)
      counts = pageviews.between(range).pluck(:occurred_at)
        .group_by { |occurred_at| occurred_at.in_time_zone.beginning_of_hour }
        .transform_values(&:size)
      zero_fill_hours(range, counts)
    end

    def total_visitors(range)
      pageviews.between(range).distinct.count(:visitor_token)
    end

    def total_pageviews(range)
      pageviews.between(range).count
    end

    # [[source, visitor_count], ...] ordered by unique visitors.
    def top_sources(range, limit: 10)
      pageviews.between(range).external
        .group(:source).distinct.count(:visitor_token)
        .sort_by { |_, count| -count }.first(limit)
    end

    def top_pages(range, limit: 10)
      pageviews.between(range)
        .group(:path).count
        .sort_by { |_, count| -count }.first(limit)
    end

    def top_referrers(range, limit: 10)
      pageviews.between(range).external.where.not(referrer_host: nil)
        .group(:referrer_host).distinct.count(:visitor_token)
        .sort_by { |_, count| -count }.first(limit)
    end

    # [[utm_campaign, visitor_count], ...] for campaign-tagged traffic only.
    def top_campaigns(range, limit: 10)
      pageviews.between(range).where.not(utm_campaign: [nil, ''])
        .group(:utm_campaign).distinct.count(:visitor_token)
        .sort_by { |_, count| -count }.first(limit)
    end

    def device_breakdown(range)
      pageviews.between(range).group(:device_type).distinct.count(:visitor_token)
    end

    def browser_breakdown(range)
      pageviews.between(range).group(:browser).distinct.count(:visitor_token)
    end

    def os_breakdown(range)
      pageviews.between(range).group(:os).distinct.count(:visitor_token)
    end

    def event_counts(range)
      between(range).group(:event_name).count
    end

    # Distinct visitors active in the trailing window (GA-style "realtime").
    # Counts all event types: any tracked activity means the visitor is here.
    def current_visitors(window: 30.minutes)
      between(window.ago..Time.current).distinct.count(:visitor_token)
    end

    # [[prev_path, path, count], ...] page transitions for the visitor-flow
    # sankey, busiest first. prev_path nil means the session began on `path`.
    # Includes all event types so downloads show up as journey steps.
    def journey_transitions(range, limit: nil)
      rows = between(range).where.not(session_token: nil)
        .group(:prev_path, :path).count
        .map { |(prev, path), count| [prev, path, count] }
        .sort_by { |_, _, count| -count }
      limit ? rows.first(limit) : rows
    end

    # { path => count } of pages where sessions ended (each session's
    # highest-step event within the range), aggregated in Ruby like the
    # other per-group maxima.
    def journey_exits(range)
      between(range).where.not(session_token: nil)
        .pluck(:session_token, :step_index, :path)
        .group_by(&:first)
        .map { |_, events| events.max_by { |(_, step, _)| step }.last }
        .tally
    end

    # [[paper title, download count], ...] from the 'download' custom event.
    # props is a serialized JSON text column, so aggregation happens in Ruby.
    def top_downloads(range, limit: 10)
      where(event_name: 'download').between(range)
        .pluck(:props)
        .map { |props| (props || {})['title'].presence || 'Unknown paper' }
        .tally
        .sort_by { |_, count| -count }.first(limit)
    end

    private

    def zero_fill(range, counts)
      (range.first.to_date..range.last.to_date).index_with { |day| counts[day] || 0 }
    end

    def zero_fill_hours(range, counts)
      first = range.first.in_time_zone.beginning_of_hour
      last = [range.last.in_time_zone, Time.current].min.beginning_of_hour
      hours = []
      hour = first
      while hour <= last
        hours << hour
        hour += 1.hour
      end
      hours.index_with { |h| counts[h] || 0 }
    end
  end
end
