#
# Usage:
# Color = Enum.new(:Red, :Green, :Blue)
# Color.is_a?(Enum) # => true
# Color::Red.inspect # => "Color::Red"
# Color::Green.is_a?(Color) # => true
# Color::Green.is_a?(Enum::Member) # => true
# Color::Green.index # => 1
# Color::Blue.enum # => Color
# values = [[255, 0, 0], [0, 255, 0], [0, 0, 255]]
# values[Color::Green] # => [0, 255, 0]
# Color[0] # => Color::Red
# Color.size # => 3
#
# Enums are enumerable. Enum::Members are comparable.

class Enum < Module
  attr_reader :members
  class Member < Module
    attr_reader :enum, :index, :str

    def initialize(enum, index, str)
      @enum, @index, @str = enum, index, str
      extend enum
    end

    # Allow use of enum members as array indices
    alias :to_int :index
    alias :to_i :index
    alias :to_s :str

    # Allow comparison by index
    def <=>(other)
      @index <=> other.index
    end

    include Comparable
  end

  def initialize(*symbols, &block)
    @members = []
    symbols.each_with_index do |symbol, index|
      # Allow Enum.new(:foo)
      symbol = symbol.to_s.sub(/^[a-z]/){|letter| letter.upcase}.to_sym
      member = Enum::Member.new(self, index, symbol)
      const_set(symbol, member)
      @members << member
    end
    super(&block)
  end

  def [](index)
    @members[index]
  end

  def size()
    @members.size
  end

  alias :length :size

  def first(*args)
    @members.first(*args)
  end

  def last(*args)
    @members.last(*args)
  end

  def each(&block)
    @members.each(&block)
  end

  # finds an enum by its string representation
  def which(str)
    str = str.downcase.to_sym
    @members.select { |mem|
      mem.to_s.downcase == str
    }.first
  end

  def member?(val)
    !self.which(val).nil?
  end

  def empty?
    @members.size == 0
  end

  def valid_idx?(idx)
    idx >= 0 && idx < @members.size
  end

  include Enumerable
end