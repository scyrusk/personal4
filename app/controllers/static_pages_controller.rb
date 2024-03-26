class StaticPagesController < ApplicationController
  before_action :authenticate, :except => [:index]

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
      courseCode: "GT CS4001",
      courseName: "Computing, Society & Professionalism",
      semester: "Spring 2018",
      link: "http://cs4001.sauvik.me"
    }, {
      courseCode: "GT CS4001",
      courseName: "Computing, Society & Professionalism",
      semester: "Fall 2018",
      link: "http://cs4001.sauvik.me"
    }, {
      courseCode: "GT CS4/8803 UPS",
      courseName: "Usable Privacy & Security",
      semester: "Spring 2019",
      link: "http://cs8803.sauvik.me"
    }, { 
      courseCode: "GT CS4873",
      courseName: "Computing, Society & Professionalism",
      semester: "Fall 2020",
      link: "http://cs4873c.sauvik.me"
    }, {
      courseCode: "GT CS4/8803 UPS",
      courseName: "Computing, Society & Professionalism",
      semester: "Spring 2022",
      link: "http://cs8803.sauvik.me"
    },
    { 
      courseCode: "CMU 05-120 A1",
      courseName: "Intro to HCI",
      semester: "Fall 2022",
      link: "https://canvas.cmu.edu/courses/31234"
    },
    {
      courseCode: "CMU 05/17-200",
      courseName: "Ethics and Policy Issues in Computing",
      semester: "Spring 2023",
      link: "https://canvas.cmu.edu/courses/33066/assignments/syllabus"
    },
    {
      courseCode: "CMU 05-4/630",
      courseName: "Programming Usable Interfaces",
      semester: "Spring 2024",
      link: "https://canvas.cmu.edu/courses/38964/assignments/syllabus"
    },
    ].reverse

    @students = [
      {
        name: "Youngwook Do",
        link: "http://www.youngwookdo.me/",
        image: ActionController::Base.helpers.asset_url("ywd.png"),
        info: "Tangible Cybersecurity",
        alum: true,
        now: "GT Ph.D. alum",
        years: "2018-2023"
      },
      {
        name: "Yuxi Wu",
        link: "https://yuxi-wu.github.io/",
        image: ActionController::Base.helpers.asset_url("yw.jpg"),
        info: "Privacy Collective Action",
        alum: false,
        now: "GT Ph.D.",
        years: "2019-present"
      },
      {
        name: "Jacob Logas",
        link: "https://logas.me/",
        image: ActionController::Base.helpers.asset_url("pjl.jpg"),
        info: "Subversive AI",
        alum: false,
        now: "GT Ph.D.",
        years: "2019-present"
      },
      {
        name: "Hao-Ping (Hank) Lee",
        link: "https://hankhplee.com/",
        image: ActionController::Base.helpers.asset_url("hhpl.jpg"),
        info: "AI Privacy",
        alum: false,
        now: "CMU Ph.D.",
        years: "2021-present"
      },
      {
        name: "Isadora Krsek",
        link: "https://www.isadorakrsek.com/",
        image: ActionController::Base.helpers.asset_url("ik.jpg"),
        info: "NLP for privacy / security",
        alum: false,
        now: "CMU Ph.D.",
        years: "2022-present"
      },
      {
        name: "Kyzyl Monteiro",
        link: "https://www.kyzyl.me/",
        image: ActionController::Base.helpers.asset_url("km.jpg"),
        info: "Tangible security controls",
        alum: false,
        now: "CMU Ph.D.",
        years: "2023-present"
      },
      {
        name: "William Agnew",
        link: "https://sites.google.com/cs.washington.edu/william-agnew/home",
        image: ActionController::Base.helpers.asset_url("wa.png"),
        info: "Community-centered AI",
        alum: false,
        now: "CMU Postdoc",
        years: "2023-present"
      },
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