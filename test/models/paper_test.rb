# == Schema Information
#
# Table name: papers
#
#  id               :integer          not null, primary key
#  self_order       :integer
#  year             :integer
#  venue            :text
#  downloads        :integer
#  likes            :integer
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  title            :string
#  backing_type     :integer
#  pdf              :string
#  thumbnail        :string
#  summary          :text
#  slides           :string
#  html_slides_url  :string
#  html_paper_url   :string
#  presentation_url :string
#  video_url        :string
#  tags             :text
#  tweets           :string
#

require 'test_helper'

class PaperTest < ActiveSupport::TestCase
  test "papers default to published" do
    assert Paper.new.published?
  end

  test "arxiv_url normalizes bare ids and abs/pdf URLs to the abstract page" do
    paper = Paper.new
    {
      '2509.01234'                              => 'https://arxiv.org/abs/2509.01234',
      ' https://arxiv.org/pdf/2509.01234v2.pdf ' => 'https://arxiv.org/abs/2509.01234v2',
      'http://www.arxiv.org/abs/2509.01234/'     => 'https://arxiv.org/abs/2509.01234',
      'cs.HC/0601001'                           => 'https://arxiv.org/abs/cs.HC/0601001'
    }.each do |input, expected|
      paper.arxiv_url = input
      assert_equal expected, paper.arxiv_url, "for #{input.inspect}"
    end
    assert_equal 'cs.HC/0601001', paper.arxiv_id
  end

  test "arxiv_url keeps unrecognized links as entered and blanks to nil" do
    paper = Paper.new(arxiv_url: 'https://example.org/preprint')
    assert_equal 'https://example.org/preprint', paper.arxiv_url
    assert_nil paper.arxiv_id
    paper.arxiv_url = '  '
    assert_nil paper.arxiv_url
  end

  test "venue-less pre-prints cite as arXiv" do
    paper = Paper.create!(title: 'T', year: 2026, self_order: 1, status: :preprint, arxiv_url: '2509.01234')
    assert_equal 'Sauvik Das. T. arXiv. 2026', paper.citation
    assert_equal 'preprint', paper.as_json(nil)[:status]
    assert_equal '2509.01234', paper.as_json(nil)[:arxiv_id]
  end

  test "search matches every query word, in any order" do
    paper = Paper.create!(title: 'Do VLMs Respect Contextual Integrity in Location Disclosure?', venue: 'EMNLP',
                          year: 2025, self_order: 1, tags: 'Privacy;AI')
    matches = ->(q) { paper.matches_query?(Paper.query_word_patterns(q)) }

    assert matches.('location privacy')
    assert matches.('privacy location')
    assert matches.('emnlp 2025')
    assert matches.('“Location,')
    assert matches.('   ')
    assert_not matches.('location phishing')
    assert matches.('ocation'), 'longer words match inside a word'
  end

  test "search matches short words only at the start of a word" do
    paper = Paper.create!(title: 'A Chair Study', venue: 'CHI', year: 2024, self_order: 1)
    matches = ->(q) { paper.matches_query?(Paper.query_word_patterns(q)) }

    assert matches.('chi')
    assert matches.('chai')
    assert_not matches.('ai')
    assert_not matches.('hair')
  end

  test "search treats a trailing s as optional on longer words" do
    paper = Paper.create!(title: 'Password Managers in the Wild', year: 2020, self_order: 1)
    matches = ->(q) { paper.matches_query?(Paper.query_word_patterns(q)) }

    assert matches.('passwords')
    assert matches.('password')
    assert_not matches.('managerial')
  end
end
