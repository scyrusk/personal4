# == Schema Information
#
# Table name: authors
#
#  id         :integer          not null, primary key
#  name       :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#

class Author < ActiveRecord::Base
  # has_many :paper_author_links
  # has_many :papers, through: :paper_author_links

  has_and_belongs_to_many :papers

  def as_json options
    {
      id: self.id,
      name: self.name
    }
  end
end