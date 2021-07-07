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
      "slidesDL" => ActionController::Base.helpers.asset_url("slides.png"),
      "prezDL" => ActionController::Base.helpers.asset_url("presentation.png"),
      "videoDL" => ActionController::Base.helpers.asset_url("video.png"),
      "tweetsDL" => ActionController::Base.helpers.asset_url("tw_black.png")
    }

    @courses = [{
      courseCode: "CS4001",
      courseName: "Computing, Society & Professionalism",
      semester: "Spring 2018",
      link: "http://cs4001.sauvik.me"
    }, {
      courseCode: "CS4001",
      courseName: "Computing, Society & Professionalism",
      semester: "Fall 2018",
      link: "http://cs4001.sauvik.me"
    }, {
      courseCode: "CS4/8803 UPS",
      courseName: "Usable Privacy & Security",
      semester: "Spring 2019",
      link: "http://cs8803.sauvik.me"
    }, { 
      courseCode: "CS4873",
      courseName: "Computing, Society & Professionalism",
      semester: "Fall 2020",
      link: "http://cs4873c.sauvik.me"
    }].reverse

    @students = [
      {
        name: "Youngwook Do",
        link: "http://www.youngwookdo.me/",
        image: ActionController::Base.helpers.asset_url("ywd.png"),
        info: "Tangible & Haptic Cybersecurity"
      },
      {
        name: "Yuxi Wu",
        link: "https://yuxi-wu.github.io/",
        image: ActionController::Base.helpers.asset_url("yw.jpg"),
        info: "Collective Action in Online Privacy"
      },
      {
        name: "Jacob Logas",
        link: "https://logas.me/",
        image: ActionController::Base.helpers.asset_url("pjl.jpg"),
        info: "Subversive AI"
      },
      {
        name: "Hao-Ping (Hank) Lee",
        link: "https://hankhplee.com/",
        image: ActionController::Base.helpers.asset_url("hhpl.jpg"),
        info: "Explainable Security"
      }
    ]
  end

  def dktest
    @params = params
    p params
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