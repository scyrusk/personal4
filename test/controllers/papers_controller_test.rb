require 'test_helper'

class PapersControllerTest < ActionDispatch::IntegrationTest
  setup do
    ENV['PERSONAL_UN'] = 'testadmin'
    ENV['PERSONAL_PASS'] = 'testpass'
    @auth = { 'HTTP_AUTHORIZATION' =>
              ActionController::HttpAuthentication::Basic.encode_credentials('testadmin', 'testpass') }
  end

  test "create requires authentication" do
    post papers_url(format: :js), params: { paper: { title: 'Nope' } }
    assert_response :unauthorized
  end

  # Regression: authors used to be linked before the paper was saved, so the
  # PaperAuthorLink rows were written with a nil paper_id and every new paper
  # came out authorless until it was edited.
  test "create links authors and awards to the new paper" do
    assert_difference('Paper.count') do
      post papers_url(format: :js),
           params: { paper: {
             title: 'Multipart Upload Paper',
             venue: 'TESTCONF',
             year: '2026',
             self_order: '1',
             authors: 'Ada Lovelace, Alan Turing',
             awards: 'Best Paper Award',
             backing_type: '0',
             featured: 'false'
           } },
           headers: @auth
    end
    assert_response :success

    paper = Paper.order(:id).last
    assert_equal ['Ada Lovelace', 'Alan Turing'], paper.authors.map(&:name)
    assert_equal [0, 1], paper.paper_author_links.map(&:author_order).sort
    assert_equal ['Best Paper Award'], paper.awards.map(&:body)
    assert_equal 2026, paper.awards.first.year
    assert_equal 0, paper.backing_type
  end

  # Regression: the admin form now posts files as real multipart parts.
  # Base64 data URLs in a urlencoded body blow past rack's 4MB parse cap
  # (rack >= 2.2.14) and the request 400s before reaching the controller.
  test "create accepts a multipart PDF upload larger than rack's urlencoded body cap" do
    big = Rack::Test::UploadedFile.new(
      StringIO.new("%PDF-1.4\n" + ('x' * (5 * 1024 * 1024)) + "\n%%EOF\n"),
      'application/pdf', original_filename: 'big.pdf'
    )
    assert_difference('Paper.count') do
      post papers_url(format: :js),
           params: { paper: {
             title: 'Big PDF Paper',
             venue: 'TESTCONF',
             year: '2026',
             self_order: '1',
             authors: 'Ada Lovelace',
             awards: '',
             backing_type: '0',
             pdf: big
           } },
           headers: @auth
    end
    assert_response :success

    paper = Paper.order(:id).last
    assert paper.pdf.path.present?, 'PDF should be stored'
    assert_operator File.size(paper.pdf.path), :>, 5 * 1024 * 1024
  ensure
    paper&.remove_pdf!
  end

  test "update replaces authors" do
    post papers_url(format: :js),
         params: { paper: { title: 'Original', venue: 'V', year: '2026', self_order: '1',
                            authors: 'Ada Lovelace', awards: '', backing_type: '0' } },
         headers: @auth
    paper = Paper.order(:id).last

    put paper_url(paper, format: :js),
        params: { paper: { title: 'Renamed', venue: 'V', year: '2026', self_order: '1',
                           authors: 'Grace Hopper', awards: '', backing_type: '1' } },
        headers: @auth
    assert_response :success

    paper.reload
    assert_equal 'Renamed', paper.title
    # The submitted list is the complete author list: Ada was removed.
    assert_equal ['Grace Hopper'], paper.authors.map(&:name)
    assert_equal 1, paper.backing_type
  end

  test "create saves an arXiv-only pre-print with no venue" do
    post papers_url(format: :js),
         params: { paper: { title: 'Pre-print Paper', venue: '', year: '2026', self_order: '1',
                            authors: 'Ada Lovelace', awards: '', backing_type: '0',
                            status: 'preprint', arxiv_url: 'arxiv.org/abs/2509.01234v2' } },
         headers: @auth
    assert_response :success

    paper = Paper.order(:id).last
    assert paper.preprint?
    # Non-canonical input is kept as typed; canonical forms are normalized (see PaperTest)
    assert_equal 'arxiv.org/abs/2509.01234v2', paper.arxiv_url
    json = JSON.parse(response.body)
    assert_equal 'preprint', json['status']
  end

  # Pre-print → paper: flip the status and fill in the venue; the arXiv link stays.
  test "update converts a pre-print into a published paper" do
    post papers_url(format: :js),
         params: { paper: { title: 'To Convert', venue: '', year: '2026', self_order: '1',
                            authors: 'Ada Lovelace', awards: '', backing_type: '0',
                            status: 'preprint', arxiv_url: '2509.01234' } },
         headers: @auth
    paper = Paper.order(:id).last

    put paper_url(paper, format: :js),
        params: { paper: { title: 'To Convert', venue: 'CHI 2027', year: '2027', self_order: '1',
                           authors: 'Ada Lovelace', awards: '', backing_type: '0',
                           status: 'published', arxiv_url: 'https://arxiv.org/abs/2509.01234' } },
        headers: @auth
    assert_response :success

    paper.reload
    assert paper.published?
    assert_equal 'CHI 2027', paper.venue
    assert_equal 'https://arxiv.org/abs/2509.01234', paper.arxiv_url
  end

  test "an unknown status is ignored instead of raising" do
    post papers_url(format: :js),
         params: { paper: { title: 'Bad Status', venue: 'V', year: '2026', self_order: '1',
                            authors: 'Ada Lovelace', awards: '', backing_type: '0', status: 'bogus' } },
         headers: @auth
    assert_response :success
    assert Paper.order(:id).last.published?
  end
end
