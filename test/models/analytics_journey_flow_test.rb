require 'test_helper'

class AnalyticsJourneyFlowTest < ActiveSupport::TestCase
  def build_event(attrs = {})
    AnalyticsEvent.create!({
      event_name: 'pageview',
      visitor_token: 'v1',
      session_token: 's1',
      step_index: 0,
      path: '/',
      occurred_at: Time.current
    }.merge(attrs))
  end

  def range
    1.day.ago..Time.current
  end

  def node(flow, label, col)
    flow[:nodes].find { |n| n[:label] == label && n[:col] == col }
  end

  def link_count(flow, from, to)
    link = flow[:links].find do |l|
      flow[:nodes][l[:source]] == from && flow[:nodes][l[:target]] == to
    end
    link && link[:count]
  end

  test "builds step columns with aggregated transition and exit links" do
    # s1 and s2: / -> /papers, then exit; s3 bounces off /.
    build_event(session_token: 's1', step_index: 0, path: '/')
    build_event(session_token: 's1', step_index: 1, path: '/papers')
    build_event(session_token: 's2', step_index: 0, path: '/')
    build_event(session_token: 's2', step_index: 1, path: '/papers')
    build_event(session_token: 's3', step_index: 0, path: '/')

    flow = Analytics::JourneyFlow.new(range).build

    assert_equal 3, flow[:total_sessions]
    root = node(flow, '/', 0)
    papers = node(flow, '/papers', 1)
    exit1 = node(flow, Analytics::JourneyFlow::EXIT_LABEL, 1)
    exit2 = node(flow, Analytics::JourneyFlow::EXIT_LABEL, 2)

    assert_equal 3, root[:count]
    assert_equal 'page', root[:kind]
    assert_equal 2, papers[:count]
    assert_equal({ 1 => 1, 2 => 2 }, { 1 => exit1[:count], 2 => exit2[:count] })
    assert_equal 'exit', exit1[:kind]

    assert_equal 2, link_count(flow, root, papers)
    assert_equal 1, link_count(flow, root, exit1)
    assert_equal 2, link_count(flow, papers, exit2)
    # Links come busiest first for the dashboard's data table.
    assert_equal flow[:links].map { |l| l[:count] }.sort.reverse, flow[:links].map { |l| l[:count] }
  end

  test "labels download steps with the paper title from props" do
    build_event(session_token: 's1', step_index: 0, path: '/')
    build_event(session_token: 's1', step_index: 1, path: '/papers/1/serve',
                event_name: 'download', props: { 'paper_id' => 1, 'title' => 'A Great Paper' })
    build_event(session_token: 's2', step_index: 0, path: '/papers/2/serve',
                event_name: 'download', props: nil)

    flow = Analytics::JourneyFlow.new(range).build

    assert node(flow, 'Download: A Great Paper', 1), 'expected the download step labeled by title'
    assert node(flow, '/papers/2/serve', 0), 'expected title-less downloads to fall back to the path'
  end

  test "folds the long tail of pages in a column into Other" do
    9.times do |i|
      count = i < 2 ? 2 : 1 # two clearly-busiest pages, seven in the tail
      count.times do |j|
        build_event(session_token: "s#{i}-#{j}", step_index: 0, path: "/page-#{i}")
      end
    end

    flow = Analytics::JourneyFlow.new(range).build

    other = node(flow, Analytics::JourneyFlow::OTHER_LABEL, 0)
    page_nodes = flow[:nodes].select { |n| n[:col].zero? && n[:kind] == 'page' }
    assert_equal Analytics::JourneyFlow::MAX_NODES, page_nodes.size
    assert_equal 2, other[:count]
    assert_equal 'other', other[:kind]
    assert node(flow, '/page-0', 0), 'busiest pages must survive the fold'
  end

  test "journeys deeper than MAX_STEPS flow into a More steps terminal" do
    8.times { |step| build_event(step_index: step, path: "/step-#{step}") }

    flow = Analytics::JourneyFlow.new(range).build

    more = node(flow, Analytics::JourneyFlow::MORE_LABEL, Analytics::JourneyFlow::MAX_STEPS)
    assert_equal 1, more[:count]
    assert_equal 'more', more[:kind]
    assert_equal Analytics::JourneyFlow::MAX_STEPS, flow[:nodes].map { |n| n[:col] }.max
    assert_nil flow[:nodes].find { |n| n[:kind] == 'exit' }
  end

  test "ignores legacy rows without a session token" do
    build_event(session_token: nil, step_index: nil)

    assert_equal({ total_sessions: 0, nodes: [], links: [] },
                 Analytics::JourneyFlow.new(range).build)
  end
end
