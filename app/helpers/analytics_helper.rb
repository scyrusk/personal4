module AnalyticsHelper
  # Signed percent change vs the previous period, or nil when there is no
  # baseline to compare against (previous period had zero).
  def analytics_delta(current, previous)
    return nil if previous.nil? || previous.zero?
    ((current - previous) * 100.0 / previous).round
  end

  def analytics_delta_tag(current, previous)
    delta = analytics_delta(current, previous)
    return content_tag(:span, 'no prior data', class: 'stat-delta stat-delta-none') if delta.nil?

    direction = delta.negative? ? 'down' : 'up'
    content_tag(:span, "#{delta.negative? ? '' : '+'}#{delta}% vs prior period",
                class: "stat-delta stat-delta-#{direction}")
  end

  # Chart bucket label. Keys are Dates for daily buckets and hour-start Times
  # for hourly buckets; labels render server-side so hours stay in the site's
  # time zone regardless of the viewer's browser.
  def analytics_chart_label(key, long: false)
    if key.acts_like?(:time)
      key.strftime(long ? '%b %-d, %-l %p' : '%-l %p')
    else
      key.strftime(long ? '%b %-d, %Y' : '%b %-d')
    end
  end

  # 1284 -> "1,284"; large values compact: 12900 -> "12.9K"
  def analytics_number(value)
    return number_with_delimiter(value) if value < 10_000
    value < 1_000_000 ? "#{(value / 1000.0).round(1)}K" : "#{(value / 1_000_000.0).round(1)}M"
  end
end
