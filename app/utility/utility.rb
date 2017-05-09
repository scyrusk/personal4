class Utility
  def self.migrate_authors_to_links
    Paper.all.each do |paper|
      paper.authors.each.each_with_index do |author, index|
        pal = PaperAuthorLink.new(
          paper: paper,
          author: author,
          author_order: index
        )
        pal.save
      end
    end
  end
end