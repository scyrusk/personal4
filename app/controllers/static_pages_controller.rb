class StaticPagesController < ApplicationController
  before_action :authenticate, :except => [:index]

  SECTIONS = %w[about recruiting students publications].freeze

  def index
    @recruiting_status_updated_at = "April 2026"
    @recruiting_status = "Not recruiting"
    @recruiting_cycle  = "2026–27 cycle"
    @recruiting_cycle_short = @recruiting_cycle.sub(/\s*cycle\z/, "")

    # SF-02: four crawlable entry points into the one continuous page
    @section = params[:section].presence_in(SECTIONS) || "about"
    @scroll_target = params[:section].presence_in(SECTIONS)
    @canonical_url = @scroll_target ? section_url(@scroll_target) : root_url

    section_titles = {
      "about"        => nil, # root/about keep the site-default title
      "recruiting"   => "Prospective Ph.D. Students · Sauvik Das",
      "students"     => "Students · Sauvik Das",
      "publications" => "Publications · Sauvik Das"
    }
    section_descriptions = {
      "recruiting"   => "Ph.D. recruiting status and next steps for prospective students " \
        "interested in working with Sauvik Das at Carnegie Mellon's HCI Institute.",
      "students"     => "Current Ph.D. students, post-docs, and alumni of the SPUD Lab, " \
        "directed by Sauvik Das at Carnegie Mellon's HCI Institute.",
      "publications" => "Searchable database of Sauvik Das's publications on human-centered " \
        "security, privacy, and AI — filter by topic, venue, author, or year."
    }
    @page_title = section_titles[@section]
    @page_description = section_descriptions[@section] ||
      ("Sauvik Das — Associate Professor at Carnegie Mellon's HCI Institute. " \
      "I design human-centered security, privacy, and AI systems that give people more agency " \
      "over their personal data and experiences online.")
    @og_image_url = "#{request.base_url}#{ActionController::Base.helpers.asset_path("sauvik_bio_sphere.png")}"

    @papers_count = Paper.count
    @papers_year_range = "#{Paper.minimum(:year)}–#{Paper.maximum(:year)}"

    # SF-01/SF-11: server-rendered fallback list — the same ?page/?tag/?sort/?q/?year
    # params the React list reads also filter this plain-HTML list, so every filter
    # URL degrades to a working server-rendered view without JavaScript.
    slugify = ->(label) { label.to_s.downcase.gsub(/[^a-z0-9]+/, "-").gsub(/\A-+|-+\z/, "") }
    noscript_papers = Paper.includes(:awards, :paper_author_links => :author)
                           .order(year: :desc, id: :desc).to_a
    @noscript_filters = []
    if params[:tag].present?
      if params[:tag] == slugify.call("Award-winning")
        noscript_papers = noscript_papers.select { |p| p.awards.any? }
        @noscript_filters << "Award-winning"
      else
        label = noscript_papers.flat_map { |p| p.tags.to_s.split(";") }
                               .find { |t| slugify.call(t) == params[:tag] }
        noscript_papers = noscript_papers.select do |p|
          p.tags.to_s.split(";").any? { |t| slugify.call(t) == params[:tag] }
        end
        @noscript_filters << (label || params[:tag].tr("-", " "))
      end
    end
    if params[:year].to_i.positive?
      noscript_papers = noscript_papers.select { |p| p.year == params[:year].to_i }
      @noscript_filters << params[:year].to_i.to_s
    end
    if params[:q].present?
      q = params[:q].downcase
      noscript_papers = noscript_papers.select do |p|
        p.title.to_s.downcase.include?(q) || p.venue.to_s.downcase.include?(q) ||
          p.authors.any? { |a| a.name.downcase.include?(q) }
      end
      @noscript_filters << "“#{params[:q]}”"
    end
    if params[:sort] == "downloads"
      noscript_papers = noscript_papers.sort_by { |p| -(p.downloads || 0) }
      @noscript_filters << "most downloaded first"
    end
    @noscript_filtered_count = noscript_papers.length
    @noscript_link_params = {
      tag: params[:tag], sort: params[:sort], q: params[:q], year: params[:year]
    }.reject { |_k, v| v.blank? }
    @noscript_page_size = 25
    @noscript_total_pages = [(@noscript_filtered_count.to_f / @noscript_page_size).ceil, 1].max
    @noscript_page = params[:page].to_i.clamp(1, @noscript_total_pages)
    @noscript_papers = noscript_papers.slice((@noscript_page - 1) * @noscript_page_size, @noscript_page_size) || []

    # SF-13: shareable filtered views, linked from the footer
    @publication_views = [
      { label: "Award-winning",       href: "/publications?tag=award-winning",       meta: "?tag=award-winning" },
      { label: "Most downloaded",     href: "/publications?sort=downloads",          meta: "?sort=downloads" },
      { label: "Social Cybersecurity", href: "/publications?tag=social-cybersecurity", meta: "?tag=social-cyber" },
      { label: "By year",             href: "/#{Paper.maximum(:year)}",              meta: "/#{Paper.maximum(:year)}" }
    ]

    # SF-11: research directions as structured data (rendered as chunked, scannable theme rows)
    @research_directions = [
      { title: "AI Privacy for Practitioners", links: [
        { label: "Privy (CHI HM)", href: "https://www.sauvik.me/papers/69/serve" },
        { label: "AI Privacy Taxonomy (CHI BP)", href: "https://sauvikdas.com/papers/51/serve" },
        { label: "Barriers to AI Privacy Work (USENIX SEC DP)", href: "https://sauvikdas.com/papers/47/serve" },
        { label: "Designing for AI Privacy (CSCW HM)", href: "https://sauvikdas.com/papers/31/serve" }
      ] },
      { title: "Human-AI Teaming for Usable S&P", links: [
        { label: "AI Privacy Risk Estimates (CHI)", href: "https://www.sauvik.me/papers/70/serve" },
        { label: "Imago Obscura (UIST)", href: "https://sauvikdas.com/papers/66/serve" },
        { label: "Informed Disclosure Decisions (CSCW)", href: "https://sauvikdas.com/papers/58/serve" }
      ] },
      { title: "Evaluating Language Model Privacy", links: [
        { label: "Agent Decisions Reveal Bias (FAccT)", href: "https://www.sauvik.me/papers/64/serve" },
        { label: "VLM Geolocation Privacy (EMNLP)", href: "https://sauvikdas.com/papers/57/serve" },
        { label: "VLM Contextual Integrity (ICLR)", href: "https://sauvikdas.com/papers/71/serve" }
      ] },
      { title: "Human-centered Adversarial ML", links: [
        { label: "Subversive AI (NeurIPS workshop)", href: "https://sauvikdas.com/papers/27/serve" },
        { label: "Human-acceptability of Anti-Facial Recognition (CSCW)", href: "https://sauvikdas.com/papers/49/serve" },
        { label: "Data Defenses against LLMs (pre-print)", href: "https://arxiv.org/abs/2410.13138" }
      ] },
      { title: "Privacy Collective Action & Governance", links: [
        { label: "Orchestrating Distributed Collectives (CHI)", href: "https://sauvikdas.com/papers/39/serve" },
        { label: "Taxonomy of Lived Privacy Harms (FAccT)", href: "https://sauvikdas.com/papers/42/serve" },
        { label: "Privacy for the People (IEEE S&P Mag)", href: "https://sauvikdas.com/papers/32/serve" }
      ] },
      { title: "Physically-intuitive Privacy and Security", links: [
        { label: "Smart Webcam Cover (IMWUT)", href: "https://sauvikdas.com/papers/35/serve" },
        { label: "Powering for Privacy (USENIX SEC)", href: "https://sauvikdas.com/papers/46/serve" },
        { label: "On-demand RFID (USEC)", href: "https://sauvikdas.com/papers/62/serve" }
      ] },
      { title: "Social Cybersecurity", links: [
        { label: "Social Proof & Security (CCS)", href: "https://sauvikdas.com/papers/9/serve" },
        { label: "SoK: Social Cybersecurity (Oakland)", href: "https://sauvikdas.com/papers/36/serve" },
        { label: "Group Security Decisions (CHI HM)", href: "https://sauvikdas.com/papers/23/serve" }
      ] }
    ]
    @venue_legend = "BP = Best Paper · HM = Best Paper Honorable Mention · DP = Distinguished Paper"

    # Recognition card content (mockup: About section, right of bio)
    @recognition = {
      awards: [
        { icon: "medal", text: "Best paper · UbiComp 2013 · CHI 2024" },
        { icon: "trophy", text: "Distinguished paper · SOUPS 2020 · USENIX Security 2024" },
        { icon: "star", text: "5 best paper honorable mentions · CHI 2016–2026" }
      ],
      press: "The Atlantic · The Financial Times · Dark Reading"
    }

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
    {
      courseCode: "CMU 05-4/899 D",
      courseName: "Building Technologies for the Resistance (BTR)",
      semester: "Fall 2024",
      link: "https://bit.ly/btr-syllabus"
    },
    {
      courseCode: "CMU 05-3/891 A",
      courseName: "Designing Human-Centered Software (DHCS)",
      semester: "Spring 2025",
      link: "https://bit.ly/s25-dhcs-a"
    },
    {
      courseCode: "CMU 05-3/891 D",
      courseName: "Designing Human-Centered Software (DHCS)",
      semester: "Fall 2025",
      link: "https://bit.ly/f25-dhcs-d"
    },
    {
      courseCode: "CMU 05-4/899 D",
      courseName: "Building Technologies for the Resistance (BTR)",
      semester: "Spring 2026",
      link: "https://bit.ly/s26-btr"
    },
    ].reverse

    all_students = [
      {
        name: "Youngwook Do",
        link: "http://www.youngwookdo.me/",
        image: ActionController::Base.helpers.asset_url("ywd.png"),
        info: "Physically-intuitive security", # SF-03
        alum: true,
        now: "now: JP Morgan Chase",
        years: "2018–2023"
      },
      {
        name: "Yuxi Wu",
        link: "https://yuxi-wu.github.io/",
        image: ActionController::Base.helpers.asset_url("yw.jpg"),
        info: "Privacy collective action", # SF-03
        alum: true,
        now: "now: Postdoc at Northeastern",
        years: "2019–2024"
      },
      {
        name: "Jacob Logas",
        link: "https://logas.me/",
        image: ActionController::Base.helpers.asset_url("pjl.jpg"),
        info: "Subversive AI",
        alum: true,
        now: "now: Asst. Prof (Franklin & Marshall)",
        years: "2019–2025"
      },
      {
        name: "Hao-Ping (Hank) Lee",
        link: "https://hankhplee.com/",
        image: ActionController::Base.helpers.asset_url("hhpl.jpg"),
        info: "AI Privacy",
        alum: false,
        now: "CMU Ph.D.",
        years: "2021–present"
      },
      {
        name: "Isadora Krsek",
        link: "https://www.isadorakrsek.com/",
        image: ActionController::Base.helpers.asset_url("ik.jpg"),
        info: "NLP for privacy / security",
        alum: false,
        now: "CMU Ph.D.",
        years: "2022–present"
      },
      {
        name: "Kyzyl Monteiro",
        link: "https://www.kyzyl.me/",
        image: ActionController::Base.helpers.asset_url("km.jpg"),
        info: "Intelligent agents for security",
        alum: false,
        now: "CMU Ph.D.",
        years: "2023–present"
      },
      {
        name: "William Agnew",
        link: "https://sites.google.com/cs.washington.edu/william-agnew/home",
        image: ActionController::Base.helpers.asset_url("wa.png"),
        info: "Community-centered AI",
        alum: false,
        now: "CMU Postdoc",
        years: "2023–present"
      },
      {
        name: "Yuxuan Li",
        link: "https://yuxuanli.com/",
        image: ActionController::Base.helpers.asset_url("yl.jpg"),
        info: "Social agent simulation & policy",
        alum: false,
        now: "CMU Ph.D.",
        years: "2024–present"
      }
    ]

    # Separate current students and alums
    @currentStudents = all_students.select { |student| !student[:alum] }
    @alums = all_students.select { |student| student[:alum] }

    @structured_papers = Paper.includes(:paper_author_links => :author).order(year: :desc, id: :desc)

    person_node = {
      "@type" => "Person",
      "name" => "Sauvik Das",
      "jobTitle" => "Associate Professor",
      "email" => "mailto:sauvik@cmu.edu",
      "worksFor" => {
        "@type" => "Organization",
        "name" => "Carnegie Mellon University"
      },
      "affiliation" => {
        "@type" => "Organization",
        "name" => "Carnegie Mellon University, Human-Computer Interaction Institute",
        "url" => "https://www.hcii.cmu.edu"
      },
      "url" => @canonical_url,
      "image" => @og_image_url,
      "sameAs" => [
        "https://bsky.app/profile/sauvik.me",
        "https://www.linkedin.com/in/sauvik-das-71b66a1b",
        "https://hci.social/@sauvik",
        "https://sauvik-das.medium.com/"
      ]
    }

    article_nodes = @structured_papers.map do |paper|
      structured_authors = paper.authors.map(&:name)
      if paper.self_order.present? && paper.self_order > 0 && paper.self_order <= structured_authors.length + 1
        structured_authors.insert(paper.self_order - 1, "Sauvik Das")
      elsif structured_authors.exclude?("Sauvik Das")
        structured_authors.unshift("Sauvik Das")
      end

      {
        "@type" => "ScholarlyArticle",
        "headline" => paper.title,
        "author" => structured_authors.map { |name| { "@type" => "Person", "name" => name } },
        "datePublished" => paper.year.to_s,
        "isPartOf" => paper.venue,
        "url" => (paper.html_paper_url.presence || "https://sauvikdas.com/papers/#{paper.id}/serve"),
        "sameAs" => paper.doi.present? ? "https://doi.org/#{paper.doi}" : nil,
        "identifier" => paper.doi
      }.compact
    end

    @structured_papers_json_ld = {
      "@context" => "https://schema.org",
      "@graph" => [person_node] + article_nodes
    }.to_json
  end

  def dktest
    @params = params
    p params
  end

  def admin
  end

end
