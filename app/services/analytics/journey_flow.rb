require 'set'

module Analytics
  # Aggregates sessionized AnalyticsEvents into the structure the dashboard's
  # "Visitor flow" sankey renders: one column per journey step (capped at
  # MAX_STEPS), the long tail of pages folded into an "Other pages" node per
  # column, and explicit terminal nodes so every session visibly ends in
  # "Exited" (or "More steps" when it ran past the last rendered column).
  class JourneyFlow
    MAX_STEPS = 5 # page columns rendered before journeys collapse into "More steps"
    MAX_NODES = 7 # pages per column before the tail folds into "Other pages"

    OTHER_LABEL = 'Other pages'.freeze
    EXIT_LABEL  = 'Exited'.freeze
    MORE_LABEL  = 'More steps'.freeze

    def initialize(range)
      @range = range
    end

    # => { total_sessions: Integer,
    #      nodes: [{ id:, col:, label:, kind: 'page'|'other'|'exit'|'more', count: }],
    #      links: [{ source: node id, target: node id, count: }] } (links busiest first)
    def build
      sessions = load_sessions
      return { total_sessions: 0, nodes: [], links: [] } if sessions.empty?

      cols = [sessions.map(&:size).max, MAX_STEPS].min
      kept = kept_labels(sessions, cols)
      @nodes = []
      @node_ids = {}
      link_counts = Hash.new(0)

      sessions.each do |steps|
        shown = steps.first(cols).each_with_index.map do |label, col|
          kept[col].include?(label) ? [label, 'page'] : [OTHER_LABEL, 'other']
        end
        ids = shown.each_with_index.map { |(label, kind), col| node_id(col, label, kind) }
        terminal = steps.size > cols ? [MORE_LABEL, 'more'] : [EXIT_LABEL, 'exit']
        ids << node_id(shown.size, *terminal)

        ids.each { |id| @nodes[id][:count] += 1 }
        ids.each_cons(2) { |from, to| link_counts[[from, to]] += 1 }
      end

      links = link_counts
              .map { |(source, target), count| { source: source, target: target, count: count } }
              .sort_by { |link| -link[:count] }
      { total_sessions: sessions.size, nodes: @nodes, links: links }
    end

    private

    # Each session's ordered step labels within the range. Sessions that
    # started before the range begins simply enter the flow mid-journey.
    def load_sessions
      AnalyticsEvent.between(@range).where.not(session_token: nil)
                    .pluck(:session_token, :step_index, :path, :event_name, :props)
                    .group_by(&:first).values
                    .map do |events|
        events.sort_by { |row| row[1] }.map { |row| step_label(*row[2..4]) }
      end
    end

    # Per column, the page labels that stay un-folded (busiest MAX_NODES).
    def kept_labels(sessions, cols)
      counts = Array.new(cols) { Hash.new(0) }
      sessions.each do |steps|
        steps.first(cols).each_with_index { |label, col| counts[col][label] += 1 }
      end
      counts.map { |c| c.sort_by { |_, n| -n }.first(MAX_NODES).map(&:first).to_set }
    end

    def node_id(col, label, kind)
      @node_ids[[col, label, kind]] ||= begin
        @nodes << { id: @nodes.size, col: col, label: label, kind: kind, count: 0 }
        @nodes.size - 1
      end
    end

    # Download steps read as the paper title — the raw path is an opaque
    # /papers/:id/serve. props comes back as raw JSON text via pluck.
    def step_label(path, event_name, props)
      return path unless event_name == 'download'

      props = JSON.parse(props) if props.is_a?(String)
      title = (props || {})['title'].presence
      title ? "Download: #{title}" : path
    rescue JSON::ParserError
      path
    end
  end
end
