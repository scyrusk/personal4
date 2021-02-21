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

    [auth_str, self.title, self.venue, self.year.to_s].join(". ")
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
      downloads: self.downloads,
      summary: self.summary,
      likes: self.likes,
      type: self.backing_type,
      pdf: self.pdf_url,
      slides: self.slides_url,
      html_slides_url: self.html_slides_url,
      html_paper_url: self.html_paper_url,
      thumbnail: self.thumbnail_url,
      presentation_url: self.presentation_url,
      video_url: self.video_url,
      tweets: self.tweets,
      tags: self.tags
    }
  end
end
