# == Schema Information
#
# Table name: papers
#
#  id              :integer          not null, primary key
#  self_order      :integer
#  year            :integer
#  venue           :text
#  downloads       :integer
#  likes           :integer
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  title           :string
#  backing_type    :integer
#  pdf             :string
#  thumbnail       :string
#  summary         :text
#  slides          :string
#  html_slides_url :string
#  html_paper_url  :string
#

require 'test_helper'

class PaperTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
