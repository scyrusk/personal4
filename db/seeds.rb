# Seeds 20 papers from sauvikdas.com/papers.json
# File uploads (pdf, thumbnail, slides) are left nil — app shows fallbacks.

papers_data = [
  {
    id: 2, title: "ACCessory: Keystroke Inference using Accelerometers on Smartphones",
    venue: "HotMobile", year: 2011, backing_type: 0, self_order: 3,
    tags: "Attacks;Mobile;Passwords;Authentication",
    html_paper_url: "", html_slides_url: "", presentation_url: "", video_url: "",
    authors: ["Emmanuel Owusu", "Jun Han", "Adrian Perrig", "Joy Zhang"],
    awards: []
  },
  {
    id: 3, title: "The Post That Wasn't: Examining Self-Censorship on Facebook",
    venue: "Computer-Supported Cooperative Work and Social Computing (CSCW)", year: 2013, backing_type: 0, self_order: 3,
    tags: "Self-censorship;Qualitative;Diary study",
    html_paper_url: "", html_slides_url: "", presentation_url: "", video_url: "",
    authors: ["Manya Sleeper", "Rebecca Balebako", "Amber McConohy", "Jason Wiese", "Lorrie Cranor"],
    awards: []
  },
  {
    id: 4, title: "Self-Censorship on Facebook",
    venue: "International Conference on Weblogs and Social Media (ICWSM)", year: 2013, backing_type: 0, self_order: 1,
    tags: "Self-censorship;Computational Social Science;Social Network Analysis;Quantitative",
    html_paper_url: "", html_slides_url: "http://www.slideshare.net/SauvikDas2/selfcensorship-on-facebook",
    presentation_url: "http://videolectures.net/icwsm2013_das_self_censorship/", video_url: "",
    authors: ["Adam Kramer"],
    awards: []
  },
  {
    id: 5, title: "Exploring Capturable Everyday Memory for Autobiographical Authentication",
    venue: "International Joint Conference on Pervasive and Ubiquitous Computing (UbiComp)", year: 2013, backing_type: 0, self_order: 1,
    tags: "Authentication;Ubicomp;AI;ML;Context Aware;Mobile",
    html_paper_url: "", html_slides_url: "http://www.slideshare.net/jas0nh0ng/ubi-comp13autoauth",
    presentation_url: "", video_url: "",
    authors: ["Eiji Hayashi", "Jason Hong"],
    awards: [{ body: "Best Paper", year: 2013 }]
  },
  {
    id: 6, title: "CASA: Context-Aware Scalable Authentication",
    venue: "Symposium on Usable Privacy and Security (SOUPS)", year: 2013, backing_type: 0, self_order: 2,
    tags: "Authentication;AI;ML;Context Aware;Ubicomp",
    html_paper_url: "", html_slides_url: "http://www.slideshare.net/jas0nh0ng/casa-contextaware-scalable-authentication-at-soups-2013",
    presentation_url: "", video_url: "",
    authors: ["Eiji Hayashi", "Jason Hong", "Shahriyar Amini", "Ian Oakley"],
    awards: []
  },
  {
    id: 7, title: "Revival Actions in a Shooter Game",
    venue: "Workshop on Designing and Evaluating Sociability in Online Video Games @ CHI", year: 2013, backing_type: 2, self_order: 1,
    tags: "Games;Data science",
    html_paper_url: "", html_slides_url: "http://www.slideshare.net/SauvikDas2/revival-actions-in-a-shooter-game",
    presentation_url: "", video_url: "",
    authors: ["Thomas Zimmermann", "Nachiappan Nagappan", "Bruce Phillips", "Chuck Harrison"],
    awards: []
  },
  {
    id: 8, title: "The Effect of Social Influence on Security Sensitivity",
    venue: "Symposium on Usable Privacy and Security (SOUPS)", year: 2014, backing_type: 0, self_order: 1,
    tags: "Social Cybersecurity;Qualitative",
    html_paper_url: "", html_slides_url: "http://sauvik.me/social_security_sensitivity_slides#/",
    presentation_url: "", video_url: "",
    authors: ["Tiffany Hyun-Jin Kim", "Laura Dabbish", "Jason Hong"],
    awards: []
  },
  {
    id: 9, title: "Increasing Security Sensitivity With Social Proof: A Large-Scale Experimental Confirmation",
    venue: "Computer and Communications Security (CCS)", year: 2014, backing_type: 0, self_order: 1,
    tags: "Social Cybersecurity;Observability;Experiment;Quantitative",
    html_paper_url: "", html_slides_url: "http://www.slideshare.net/jas0nh0ng/increasing-security-sensitivity-with-social-proof-a-largescale-experimental-confirmation-at-ccs-2014",
    presentation_url: "", video_url: "",
    authors: ["Adam Kramer", "Jason Hong", "Laura Dabbish"],
    awards: [{ body: "NSA Best Scientific Cybersecurity Paper Honorable Mention", year: 2015 }]
  },
  {
    id: 10, title: "The Role of Social Influence In Security Feature Adoption",
    venue: "Computer-Supported Cooperative Work and Social Computing (CSCW)", year: 2015, backing_type: 0, self_order: 1,
    tags: "Social Cybersecurity;Computational Social Science;Quantitative",
    html_paper_url: "", html_slides_url: "http://www.slideshare.net/jas0nh0ng/cscw2015-role-ofsocialinfluenceinsecuritysensitivity",
    presentation_url: "", video_url: "",
    authors: ["Adam Kramer", "Jason Hong", "Laura Dabbish"],
    awards: []
  },
  {
    id: 11, title: "Examining Game World Topology Personalization",
    venue: "ACM Conference on Human Factors In Computing Systems (CHI)", year: 2015, backing_type: 0, self_order: 1,
    tags: "Games;AI;ML;Personalization;Experiment;Quantitative",
    html_paper_url: "", html_slides_url: "http://www.slideshare.net/SauvikDas2/examining-game-world-topology-personalization",
    presentation_url: "", video_url: "",
    authors: ["Alexander Zook", "Mark Riedl"],
    awards: []
  },
  {
    id: 12, title: "Testing Computer-Aided Mnemonics and Feedback for Fast Memorization of High-Value Secrets",
    venue: "NDSS Workshop on Usable Security (USEC)", year: 2016, backing_type: 0, self_order: 1,
    tags: "Authentication;Passwords;Mnemonics;Experiment;Quantitative",
    html_paper_url: "", html_slides_url: "http://www.slideshare.net/SauvikDas2/testing-computerassisted-mnemonics-and-feedback-for-fast-memorization-of-highvalue-secrets",
    presentation_url: "", video_url: "",
    authors: ["Jason Hong", "Stuart Schechter"],
    awards: []
  },
  {
    id: 13, title: "Social Cybersecurity: Applying Social Psychology to Cybersecurity",
    venue: "Human Computer Interaction Consortium (HCIC)", year: 2015, backing_type: 2, self_order: 2,
    tags: "Social Cybersecurity;Vision",
    html_paper_url: "", html_slides_url: "http://www.slideshare.net/jas0nh0ng/social-cybersecurity-applying-social-psychology-to-cybersecurity-or",
    presentation_url: "", video_url: "",
    authors: ["Jason Hong", "Tiffany Hyun-Jin Kim", "Laura Dabbish"],
    awards: []
  },
  {
    id: 14, title: "A Market in Your Social Network: The Effects of Extrinsic Rewards on Friendsourcing and Relationships",
    venue: "ACM Conference on Human Factors In Computing Systems (CHI)", year: 2016, backing_type: 0, self_order: 2,
    tags: "Systems;Experiment;Friendsourcing;Experiment;Quantitative;Qualitative",
    html_paper_url: "", html_slides_url: "http://www.slideshare.net/SauvikDas2/a-market-in-your-social-network-the-effect-of-extrinsic-rewards-on-friendsourcing-and-relationships",
    presentation_url: "", video_url: "",
    authors: ["Haiyi Zhu", "Yiqun Cao", "Shuang Yu", "Aniket Kittur", "Robert Kraut"],
    awards: [{ body: "Best Paper Honorable Mention", year: 2016 }]
  },
  {
    id: 15, title: "Epistenet: Facilitating Programmatic Access & Processing of Semantically Related Mobile Personal Data",
    venue: "International Conference on Human-Interaction with Mobile Devices and Services (MobileHCI)", year: 2016, backing_type: 0, self_order: 1,
    tags: "Systems;Personal Data;Mobile;Information Retrieval;Semantic",
    html_paper_url: "", html_slides_url: "http://www.slideshare.net/SauvikDas2/epistenet-facilitating-programmatic-access-processing-of-semantically-related-data",
    presentation_url: "", video_url: "",
    authors: ["Jason Wiese", "Jason Hong"],
    awards: []
  },
  {
    id: 16, title: "Expert and Non-Expert Attitudes towards (Secure) Instant Messaging",
    venue: "Symposium on Usable Privacy and Security (SOUPS)", year: 2016, backing_type: 0, self_order: 2,
    tags: "Social Cybersecurity;Secure Messaging;Cross-cultural;Quantitative;Qualitative",
    html_paper_url: "", html_slides_url: "", presentation_url: "", video_url: "",
    authors: ["Alexander de Luca", "Martin Ortlieb", "Ben Laurie", "Iulia Ion"],
    awards: []
  },
  {
    id: 18, title: "Thumprint: Socially-Inclusive Local Group Authentication Through Shared Secret Knocks",
    venue: "ACM Conference on Human Factors In Computing Systems (CHI)", year: 2017, backing_type: 0, self_order: 1,
    tags: "Social Cybersecurity;Systems;ML;AI;Quantitative",
    html_paper_url: "", html_slides_url: "https://www.slideshare.net/SauvikDas2/thumprint-sociallyinclusive-local-group-authentication-through-shared-secret-knocks",
    presentation_url: "https://www.youtube.com/watch?v=Ht6JgxD_4ps&t=54s", video_url: "",
    authors: ["Gierad Laput", "Chris Harrison", "Jason Hong"],
    awards: [{ body: "Best Paper Honorable Mention", year: 2017 }]
  },
  {
    id: 20, title: "Breaking! A Typology of Security and Privacy News and How It's Shared",
    venue: "ACM Conference on Human Factors In Computing Systems (CHI)", year: 2018, backing_type: 0, self_order: 1,
    tags: "Social Cybersecurity;Quantitative;Survey;Longitudinal",
    html_paper_url: "", html_slides_url: "", presentation_url: "", video_url: "",
    authors: ["Joanne Lo", "Laura Dabbish", "Jason Hong"],
    awards: []
  },
  {
    id: 21, title: "A Typology of Perceived Triggers for End-User Security and Privacy Behaviors",
    venue: "Symposium on Usable Privacy and Security (SOUPS)", year: 2019, backing_type: nil, self_order: 1,
    tags: "Social Cybersecurity;Quantitative;Survey",
    html_paper_url: "", html_slides_url: "",
    presentation_url: "https://www.youtube.com/watch?v=JY7LGdJi-uk", video_url: "",
    authors: ["Laura Dabbish", "Jason Hong"],
    awards: []
  },
  {
    id: 22, title: "The Memory Palace: Exploring Visual-Spatial Paths for Strong, Memorable, Infrequent Authentication",
    venue: "ACM User Interface Software and Technology Symposium (UIST)", year: 2019, backing_type: nil, self_order: 1,
    tags: "Authentication;Systems;Quantitative;Mobile",
    html_paper_url: "", html_slides_url: "",
    presentation_url: "https://www.youtube.com/watch?v=gMSJ4xiizx0",
    video_url: "https://www.youtube.com/watch?v=I02XDR7Mg0I",
    authors: ["David Lu", "Taehoon Lee", "Joanne Lo", "Jason Hong"],
    awards: []
  },
  {
    id: 23, title: "\"We Hold Each Other Accountable\": Unpacking How Social Groups Approach Cybersecurity and Privacy Together",
    venue: "ACM Conference on Human Factors In Computing Systems (CHI)", year: 2020, backing_type: nil, self_order: 4,
    tags: "Social Cybersecurity;Qualitative;Groups",
    html_paper_url: "", html_slides_url: "",
    presentation_url: "https://www.youtube.com/watch?v=JJz5czvO5-g&list=PLl2dezBNo_Bl83xLB6xvKvN6hwMWGuLFI&index=4",
    video_url: "",
    authors: ["Hue Watson", "Eyitemi Moju-Igbene", "Akanksha Kumari"],
    awards: [{ body: "Best Paper Honorable Mention", year: 2020 }]
  },
]

papers_data.each do |data|
  paper = Paper.create!(
    title:            data[:title],
    venue:            data[:venue],
    year:             data[:year],
    backing_type:     data[:backing_type],
    self_order:       data[:self_order],
    tags:             data[:tags],
    html_paper_url:   data[:html_paper_url],
    html_slides_url:  data[:html_slides_url],
    presentation_url: data[:presentation_url],
    video_url:        data[:video_url],
    downloads:        0
  )

  data[:authors].each_with_index do |name, idx|
    author = Author.find_or_create_by!(name: name)
    PaperAuthorLink.create!(paper: paper, author: author, author_order: idx)
  end

  data[:awards].each do |award_data|
    Award.create!(paper: paper, body: award_data[:body], year: award_data[:year], pinned: false)
  end

  puts "Created: #{paper.title}"
end

puts "\nDone — #{papers_data.length} papers seeded."
