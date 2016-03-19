class StaticPagesController < ApplicationController
  before_filter :authenticate, :except => [:index]

  def index
    @updateAssetMap = {
      Update::Type::PAPER.to_s => ActionController::Base.helpers.asset_url("paper_update.png"),
      Update::Type::AWARD.to_s => ActionController::Base.helpers.asset_url("award_update.png"),
      Update::Type::TRAVEL.to_s => ActionController::Base.helpers.asset_url("travel_update.png"),
      Update::Type::PRESS.to_s => ActionController::Base.helpers.asset_url("press_update.png"),
      Update::Type::PRESENTATION.to_s => ActionController::Base.helpers.asset_url("prez_update.png"),
      Update::Type::MISC.to_s => ActionController::Base.helpers.asset_url("misc_update.png")
    }

    @paperAssetMap = {
      "noThumb" => ActionController::Base.helpers.asset_url("no-image.png"),
      "pdfDL" => ActionController::Base.helpers.asset_url("pdf.png"),
      "slidesDL" => ActionController::Base.helpers.asset_url("slides.png")
    }
  end

  def admin
  end

  protected
    def authenticate
      authenticate_or_request_with_http_basic do |user, password|
        retval = user == ENV['PERSONAL_UN'] && password == ENV['PERSONAL_PASS']
        session[:authenticated] = true if retval
        retval
      end
    end
end