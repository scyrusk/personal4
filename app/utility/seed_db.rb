class SeedDb
  def self.seed_db
    self::seed_papers
    self::seed_awards
    self::seed_updates
    self::seed_travels
  end

  def self.seed_travels
    travels = self::travels_json
    travels.each do |t|
      travel = Travel.find_or_create_by(
        date: DateTime.strptime(t["wireDate"], "%Y-%m-%d"),
        location: t["location"],
        title: t["title"],
        link: t["link"]
      )
    end
  end

  def self.seed_awards
    awards = self::awards_json
    awards.each do |u|
      update = Award.find_or_create_by(
        year: u["year"],
        body: u["body"],
        pinned: u["pinned"],
        paper_id: u["paper"]["id"]
      )
    end
  end

  def self.seed_updates
    updates = self::updates_json
    updates.each do |u|
      update = Update.find_or_create_by(
        date: DateTime.strptime(u["wireDate"], "%Y-%m-%d"),
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
    papers.each do |hash|
      paper = Paper.find_or_initialize_by(
        self_order: hash["selfOrder"].to_i,
        title: hash["title"],
        venue: hash["venue"],
        year: hash["year"],
        downloads: hash["downloads"].to_i,
        summary: hash["summary"],
        likes: hash["likes"],
        backing_type: hash["type"].to_i,
        html_slides_url: hash["html_slides_url"],
        html_paper_url: hash["html_paper_url"]
      )

      paper.remote_pdf_url = "http://sauvik.me#{hash['pdf']}" unless hash["pdf"].nil?
      paper.save!
      paper.remote_thumbnail_url = "http://sauvik.me#{hash['thumbnail']}" unless hash["thumbnail"].nil?
      paper.save!
      paper.remote_slides_url = "http://sauvik.me#{hash['slides']}" unless hash["slides"].nil?
      paper.save!

      paper.authors = hash["authors"].map { |ahash| Author.find_or_create_by(name: ahash["name"]) }
      paper.save!
    end
  end

  def self.papers_json
    file = File.read(Rails.root.join('tmp', 'new_json', 'papers.json'))
    JSON.parse file
  end

  def self.awards_json
    file = File.read(Rails.root.join('tmp', 'new_json', 'awards.json'))
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
    file = File.read(Rails.root.join('tmp', 'new_json', 'updates.json'))
    JSON.parse file
  end

  def self.travels_json
    file = File.read(Rails.root.join('tmp', 'new_json', 'travels.json'))
    JSON.parse file
  end
end