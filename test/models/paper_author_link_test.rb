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

require 'test_helper'

class PaperAuthorLinkTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
