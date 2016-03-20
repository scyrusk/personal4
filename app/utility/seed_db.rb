class SeedDB
  def self.seed_db
    self::seed_papers
    self::seed_updates
    self::seed_awards
  end

  def self.seed_awards
    awards = self::awards_json
    awards.each do |u|
      update = Award.find_or_create_by(
        year: u["year"],
        body: u["body"],
        paper_id: u["paper_id"]
      )
    end
  end

  def self.seed_updates
    updates = self::updates_json
    updates.each do |u|
      y,m,d = u["wireDate"].split("-")
      update = Update.find_or_create_by(
        date: Date.new(y.to_i, m.to_i, d.to_i),
        text: u["text"],
        backing_type: Update::Type.which(u["type"]).to_i
      )
    end
  end

  def self.seed_authors
    authors = self::authors_json
    authors.each do |a|
      Author.find_or_create_by(name: a["name"])
    end
  end

  def self.seed_papers
    papers = self::papers_json
    paper_authors = self::paper_authors_json
    papers.each do |hash|
      paper = Paper.find_or_initialize_by(
        title: hash["title"],
        venue: hash["venue"],
        self_order: hash["self_author_order"],
        year: hash["year"],
        downloads: hash["downloads"].to_i,
        likes: 0,
        backing_type: hash["papertype"].to_i - 1
      )

      paper.remote_pdf_url = "http://sauvik.me/papers/serve?id=#{hash["id"]}"

      paper.authors = paper_authors.select { |ahash|
        ahash["paper_title"] == hash["title"]
      }.first["authors"].map do |ahash|
        Author.find_or_create_by(name: ahash["name"])
      end

      paper.save
    end
  end

  def self.papers_json
    file = File.read(Rails.root.join('tmp', 'papers.json'))
    JSON.parse file
  end

  def self.awards_json
    file = File.read(Rails.root.join('tmp', 'awards.json'))
    JSON.parse file
  end

  def self.authors_json
    file = File.read(Rails.root.join('tmp', 'collaborators.json'))
    JSON.parse file
  end

  def self.paper_authors_json
    file = File.read(Rails.root.join('tmp', 'paper_collabs.json'))
    paper_authors = JSON.parse file
    paper_authors.map do |selection|
      {
        "paper_title" => selection["paper_title"],
        "authors" => JSON.parse(selection["authors"])
      }
    end
  end

  def self.updates_json
    file = File.read(Rails.root.join('tmp', 'updates4.json'))
    JSON.parse file
  end
end