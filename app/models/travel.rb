# == Schema Information
#
# Table name: travels
#
#  id         :integer          not null, primary key
#  date       :datetime
#  location   :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#

class Travel < ActiveRecord::Base
end
