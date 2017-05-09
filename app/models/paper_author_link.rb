# == Schema Information
#
# Table name: paper_author_links
#
#  id           :integer          not null, primary key
#  paper_id     :integer
#  author_id    :integer
#  author_order :integer
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#

class PaperAuthorLink < ActiveRecord::Base
  belongs_to :paper
  belongs_to :author
end
