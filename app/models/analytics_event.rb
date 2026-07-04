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
    def daily_visitors(range)
      zero_fill(range, pageviews.between(range).group(date_expr).distinct.count(:visitor_token))
    end

    # { Date => pageview count }, with zero-filled days across the range.
    def daily_pageviews(range)
      zero_fill(range, pageviews.between(range).group(date_expr).count)
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

    def device_breakdown(range)
      pageviews.between(range).group(:device_type).distinct.count(:visitor_token)
    end

    def browser_breakdown(range)
      pageviews.between(range).group(:browser).distinct.count(:visitor_token)
    end

    def event_counts(range)
      between(range).group(:event_name).count
    end

    private

    def date_expr
      Arel.sql("DATE(occurred_at)")
    end

    def zero_fill(range, counts)
      by_date = counts.transform_keys { |d| d.is_a?(Date) ? d : Date.parse(d.to_s) }
      (range.first.to_date..range.last.to_date).index_with { |day| by_date[day] || 0 }
    end
  end
end
