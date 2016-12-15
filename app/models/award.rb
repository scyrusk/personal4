# == Schema Information
#
# Table name: awards
#
#  id         :integer          not null, primary key
#  year       :integer
#  body       :text
#  paper_id   :integer
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  pinned     :boolean
#

class Award < ActiveRecord::Base
  belongs_to :paper

  def as_json(options)
    {
      id: self.id,
      year: self.year,
      body: self.body,
      pinned: self.pinned,
      paper: self.paper.present? ? self.paper.as_json(options) : {}
    }
  end
end
