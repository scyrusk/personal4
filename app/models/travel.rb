# == Schema Information
#
# Table name: travels
#
#  id         :integer          not null, primary key
#  date       :datetime
#  location   :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  title      :string
#  link       :string
#

class Travel < ActiveRecord::Base
  def as_json(options)
    {
      id: self.id,
      date: self.date.present? ? self.date.strftime("%-m/%d") : "",
      wireDate: self.date.present? ? self.date.strftime("%Y-%m-%d") : "",
      datePassed: self.date.present? && DateTime.now > self.date,
      location: self.location,
      title: self.title,
      link: self.link
    }
  end
end
