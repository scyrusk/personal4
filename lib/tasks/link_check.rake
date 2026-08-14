# SF-04: link-integrity audit — run on deploy and weekly (cron/CI):
#   bin/rake links:check          # report all failures, exit 1 if any
#   bin/rake links:check[warn]    # report but always exit 0
require 'net/http'

namespace :links do
  desc 'Verify hosted PDFs exist and external paper links respond'
  task :check, [:mode] => :environment do |_t, args|
    failures = []

    check_url = lambda do |url, context|
      return if url.blank?
      begin
        uri = URI.parse(url)
        return unless uri.is_a?(URI::HTTP) # skip mailto etc.
        res = nil
        Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == 'https',
                        open_timeout: 10, read_timeout: 15) do |http|
          res = http.head(uri.request_uri.presence || '/')
          # Some hosts reject HEAD; retry with GET before failing
          res = http.get(uri.request_uri.presence || '/') if res.code.to_i >= 400
        end
        code = res.code.to_i
        failures << "#{context}: #{url} → HTTP #{code}" if code >= 400
      rescue StandardError => e
        failures << "#{context}: #{url} → #{e.class}: #{e.message}"
      end
    end

    # Hosted files: every paper PDF/thumbnail the site links to must exist on disk
    Paper.find_each do |paper|
      if paper.pdf.present? && paper.pdf.path.present?
        path = Rails.root.join('public', paper.pdf.path)
        failures << "paper #{paper.id} (#{paper.title}): hosted PDF missing at #{path}" unless File.exist?(path)
      elsif paper.html_paper_url.blank?
        failures << "paper #{paper.id} (#{paper.title}): no hosted PDF and no publisher link"
      end
      check_url.call(paper.html_paper_url, "paper #{paper.id} publisher")
      check_url.call(paper.project_page_url, "paper #{paper.id} project page")
      check_url.call(paper.video_url, "paper #{paper.id} video")
      check_url.call("https://doi.org/#{paper.doi}", "paper #{paper.id} DOI") if paper.respond_to?(:doi) && paper.doi.present?
    end

    # CV asset must be present
    cv = Rails.root.join('app', 'assets', 'jobs', 'cv.pdf')
    failures << "CV asset missing at #{cv}" unless File.exist?(cv)

    if failures.any?
      puts "link check: #{failures.length} failure(s)"
      failures.each { |f| puts "  ✗ #{f}" }
      exit 1 unless args[:mode] == 'warn'
    else
      puts 'link check: all links healthy'
    end
  end
end
