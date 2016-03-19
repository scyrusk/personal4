# == Schema Information
#
# Table name: updates
#
#  id           :integer          not null, primary key
#  date         :datetime
#  text         :text
#  backing_type :integer
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#

require 'test_helper'

class UpdateTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
