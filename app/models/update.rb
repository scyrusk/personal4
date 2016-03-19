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

class Update < ActiveRecord::Base
  Type = Enum.new(
    :PAPER,
    :AWARD,
    :TRAVEL,
    :PRESS,
    :PRESENTATION,
    :MISC
  )

  # Type methods
  def type
    self.class::Type[self.backing_type] if self.backing_type
  end

  # Stat can be an integer index, a string representation or a Status
  # enum directly. It's best to just use a Status enum it, for code
  # clarity if nothing else.
  def type=(t)
    if t.is_a?(self.class::Type)
      self.backing_type = t.to_i
    elsif (t.is_a?(Fixnum) && self.class::Type.valid_idx?(t))
      self.backing_type = t
    elsif (t.is_a?(String) && self.class::Type.member?(t))
      self.backing_type = self.class::Type.which(t).to_i
    end
  end

  def self.type_map
    Update::Type.map do |ut|
      {
        value: ut.to_i,
        rendered: ut.to_s.to_s.capitalize
      }
    end
  end

  def as_json(options)
    {
      id: self.id,
      type: self.type.to_s,
      date: self.date.present? ? self.date.strftime("%-m/%d/%y") : "",
      wireDate: self.date.present? ? self.date.strftime("%Y-%m-%d") : "",
      text: self.text
    }
  end
end