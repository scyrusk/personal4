require 'csv'

module Analytics
  # Builds the dashboard's CSV download: a GA-style sectioned export with the
  # time series first, then totals, then each breakdown, separated by blank
  # rows so it opens cleanly in a spreadsheet.
  class CsvExporter
    def initialize(period_label:, range:, granularity:, chart_visitors:, chart_pageviews:,
                   totals:, breakdowns:)
      @period_label = period_label
      @range = range
      @granularity = granularity
      @chart_visitors = chart_visitors
      @chart_pageviews = chart_pageviews
      @totals = totals
      @breakdowns = breakdowns
    end

    def to_csv
      CSV.generate do |csv|
        csv << ['Analytics export', @period_label]
        csv << ['Range', "#{@range.first.to_date.iso8601} to #{@range.last.to_date.iso8601}"]

        csv << []
        csv << [@granularity == 'hour' ? 'Hour' : 'Date', 'Visitors', 'Pageviews']
        @chart_visitors.each do |bucket, visitors|
          csv << [bucket_label(bucket), visitors, @chart_pageviews[bucket] || 0]
        end

        csv << []
        csv << %w[Totals Value]
        @totals.each { |label, value| csv << [label, value] }

        @breakdowns.each do |title, unit, rows|
          csv << []
          csv << [title, unit]
          rows.each { |label, count| csv << [label.presence || 'Unknown', count] }
        end
      end
    end

    private

    def bucket_label(bucket)
      bucket.is_a?(Date) ? bucket.iso8601 : bucket.strftime('%Y-%m-%d %H:00')
    end
  end
end
