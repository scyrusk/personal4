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

class Paper < ActiveRecord::Base
  has_many :paper_author_links

  has_many :awards

  mount_base64_uploader :pdf, PdfUploader
  mount_base64_uploader :slides, SlidesUploader
  mount_base64_uploader :thumbnail, ThumbnailUploader

  Type = Enum.new(
    :CONFERENCE,
    :JOURNAL,
    :WORKSHOP
  )

  # Where a paper is in its publication life cycle; shown as the banner on
  # each publication card and filterable via the Pre-prints chip / ?status=.
  enum :status, { published: 0, camera_ready: 1, preprint: 2 }

  # Display labels, mirroring PAPER_STATUSES in paper.js.jsx
  STATUS_LABELS = {
    "preprint"     => { one: "Pre-print",    many: "Pre-prints" },
    "camera_ready" => { one: "Camera-ready", many: "Camera-ready" },
    "published"    => { one: "Published",    many: "Published" }
  }.freeze

  def status_label
    STATUS_LABELS[status][:one]
  end

  # New-style (2501.01234v2) and old-style (cs.HC/0601001) arXiv identifiers
  ARXIV_ID = %r{(\d{4}\.\d{4,5}(?:v\d+)?|[a-z-]+(?:\.[A-Z]{2})?/\d{7}(?:v\d+)?)}

  # Accepts a bare arXiv id or any arxiv.org abs/pdf URL and stores the
  # canonical abstract-page URL; anything else is kept as entered.
  def arxiv_url=(value)
    value = value.to_s.strip
    id = value[%r{\A#{ARXIV_ID}\z}, 1] ||
         value[%r{\Ahttps?://(?:www\.)?arxiv\.org/(?:abs|pdf)/#{ARXIV_ID}(?:\.pdf)?/?\z}, 1]
    super(id ? "https://arxiv.org/abs/#{id}" : value.presence)
  end

  def arxiv_id
    arxiv_url.to_s[%r{\Ahttps://arxiv\.org/abs/#{ARXIV_ID}\z}, 1]
  end

  # Word-by-word search for the no-JS publications list, mirroring
  # queryWordMatchers in paper.js.jsx: each query word must appear somewhere in
  # the title, venue, year, authors, awards or tags, in any order. Words of up
  # to 4 letters must start a word ("ai" doesn't match "chair"); longer ones may
  # match inside one ("location" finds "Geolocation"). A trailing "s" is
  # optional ("passwords" finds "password").
  def self.query_word_patterns(query)
    query.to_s.downcase.split.filter_map do |word|
      word = word.gsub(/\A[^[:alnum:]]+|[^[:alnum:]]+\z/, "")
      next if word.empty?
      stem = word.length > 3 && word.end_with?("s") ? "#{Regexp.escape(word.chop)}s?" : Regexp.escape(word)
      word.length <= 4 ? /(?<![[:alnum:]])#{stem}/i : /#{stem}/i
    end
  end

  def matches_query?(patterns)
    text = [title, venue.presence || (arxiv_url.present? ? "arXiv" : ""), year, tags,
            *authors.map(&:name), *awards.map(&:body)].join("\n")
    patterns.all? { |pattern| pattern.match?(text) }
  end

  def authors
    self.paper_author_links.sort { |a,b| a.author_order - b.author_order }.map do |pal|
      pal.author
    end
  end

  def authors= auths
    auths.each.each_with_index do |author, index|
      pal = PaperAuthorLink.find_or_create_by(
        paper_id: self.id,
        author_id: author.id
      )
      pal.author_order = index
      pal.save
    end

    # The form submits the complete author list, so anyone not in it was removed.
    kept_ids = auths.map(&:id)
    self.paper_author_links.reload.each do |pal|
      pal.destroy unless kept_ids.include?(pal.author_id)
    end
  end

  # Type methods
  def type
    self.class::Type[self.backing_type] if self.backing_type
  end

  # Stat can be an integer index, a string representation or a Status
  # enum directly. It's best to just use a Status enum it, for code
  # clarity if nothing else.
  def type=(t)
    if t.is_a?(self.class::Type)
      self.backing_type = t.to_i
    elsif (t.is_a?(Fixnum) && self.class::Type.valid_idx?(t))
      self.backing_type = t
    elsif (t.is_a?(String) && self.class::Type.member?(t))
      self.backing_type = self.class::Type.which(t).to_i
    end
  end

  def self.type_map
    Update::Type.map do |ut|
      {
        value: ut.to_i,
        rendered: ut.to_s.to_s.capitalize
      }
    end
  end

  def citation
    auth_str = "Sauvik Das"
    if authors.length > 0
      authors = self.authors.map { |a| a.name }
      authors.insert(self.self_order - 1, "Sauvik Das")

      auth_str = authors[0..-2].join(", ") + " and " + authors[-1]
    end

    [auth_str, self.title, self.venue.presence || ("arXiv" if arxiv_url.present?), self.year.to_s].compact.join(". ")
  end

  # SF-18: srcset advertising only the responsive variants that actually exist on
  # disk (generated by `rake thumbs:responsive`); the original stays the fallback.
  def thumbnail_srcset
    return nil if thumbnail.blank?

    path = thumbnail.path
    return nil if path.blank?

    dir = File.dirname(path)
    base = File.basename(path)
    url_dir = File.dirname(thumbnail_url.to_s)
    candidates = { 96 => "resp96_#{base}", 192 => "resp192_#{base}" }.filter_map do |width, name|
      "#{url_dir}/#{name} #{width}w" if File.exist?(File.join(dir, name))
    end
    candidates.presence&.join(", ")
  end

  def as_json(options)
    pauthors = self.authors.map { |a| a.as_json(options) }
    pauthors.insert(self.self_order.to_i - 1, { id: 0, name: "Sauvik Das", self: true }) unless (options && options[:form])
    {
      id: self.id,
      citation: self.citation,
      selfOrder: self.self_order.to_i,
      title: self.title,
      authors: pauthors,
      awards: self.awards.map { |a| { id: a.id, body: a.body, year: a.year } },
      venue: self.venue,
      year: self.year,
      featured: self.featured,
      status: self.status,
      downloads: self.downloads,
      summary: self.summary,
      likes: self.likes,
      type: self.backing_type,
      pdf: self.pdf_url,
      slides: self.slides_url,
      html_slides_url: self.html_slides_url,
      html_paper_url: self.html_paper_url,
      arxiv_url: self.arxiv_url,
      arxiv_id: self.arxiv_id,
      doi: self.doi,
      bibtex: self.bibtex,
      thumbnail: self.thumbnail_url,
      thumbnail_srcset: self.thumbnail_srcset,
      presentation_url: self.presentation_url,
      video_url: self.video_url,
      tweets: self.tweets,
      tags: self.tags,
      project_page_url: self.project_page_url
    }
  end
end
