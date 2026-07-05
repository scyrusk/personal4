require 'digest'

module Analytics
  # Records an AnalyticsEvent from a Rack request. Visitor identity is a
  # cookieless, privacy-preserving daily hash of (secret, date, IP, UA) in the
  # style of Plausible: no cookies, nothing personally identifiable stored,
  # unique-visitor counts reset each day.
  class Tracker
    BOT_PATTERN = /
      bot|crawl|spider|slurp|search|archive|preview|fetch|monitor|scrape|
      curl|wget|python|java|ruby|go-http|okhttp|httpclient|libwww|
      headless|phantom|lighthouse|pagespeed|pingdom|uptime|
      facebookexternalhit|embedly|quora\slink|vkshare|w3c_validator|
      whatsapp|telegram|discord|slack
    /xi

    SEARCH_ENGINES = {
      'google'      => 'Google',
      'bing'        => 'Bing',
      'duckduckgo'  => 'DuckDuckGo',
      'yahoo'       => 'Yahoo',
      'baidu'       => 'Baidu',
      'yandex'      => 'Yandex',
      'ecosia'      => 'Ecosia',
      'brave'       => 'Brave Search',
      'startpage'   => 'Startpage',
      'perplexity'  => 'Perplexity'
    }.freeze

    SOCIAL_SITES = {
      'twitter.com'         => 'Twitter/X',
      'x.com'               => 'Twitter/X',
      't.co'                => 'Twitter/X',
      'facebook.com'        => 'Facebook',
      'fb.me'               => 'Facebook',
      'linkedin.com'        => 'LinkedIn',
      'lnkd.in'             => 'LinkedIn',
      'reddit.com'          => 'Reddit',
      'news.ycombinator.com' => 'Hacker News',
      'bsky.app'            => 'Bluesky',
      'mastodon.social'     => 'Mastodon',
      'hci.social'          => 'Mastodon',
      'instagram.com'       => 'Instagram',
      'youtube.com'         => 'YouTube',
      'medium.com'          => 'Medium'
    }.freeze

    def self.track(request, event_name: 'pageview', properties: nil)
      new(request).track(event_name: event_name, properties: properties)
    end

    def initialize(request)
      @request = request
    end

    def track(event_name: 'pageview', properties: nil)
      return nil if bot?

      source, medium = classify_source
      AnalyticsEvent.create!(
        event_name: event_name,
        visitor_token: visitor_token,
        path: @request.path,
        referrer: truncate(external_referrer, 2048),
        referrer_host: referrer_host,
        source: source,
        medium: medium,
        utm_source: truncate(params['utm_source'], 255),
        utm_medium: truncate(params['utm_medium'], 255),
        utm_campaign: truncate(params['utm_campaign'], 255),
        device_type: device_type,
        browser: browser,
        os: os,
        props: properties,
        occurred_at: Time.current
      )
    end

    def bot?
      user_agent.blank? || user_agent.match?(BOT_PATTERN)
    end

    def visitor_token
      Digest::SHA256.hexdigest(
        [Rails.application.secret_key_base, Date.current.iso8601,
         @request.remote_ip, user_agent].join('|')
      ).first(32)
    end

    private

    def params
      @request.query_parameters
    rescue StandardError
      {}
    end

    def user_agent
      @request.user_agent.to_s
    end

    def referrer_host
      @referrer_host ||= begin
        host = URI.parse(@request.referrer.to_s).host
        host&.downcase&.delete_prefix('www.')
      rescue URI::Error
        nil
      end
    end

    def internal_referrer?
      referrer_host.present? && referrer_host == @request.host.to_s.downcase.delete_prefix('www.')
    end

    # Full referrer URL, blanked for internal navigation so the sources
    # report only reflects how visitors arrived at the site.
    def external_referrer
      internal_referrer? ? nil : @request.referrer.presence
    end

    # => [source, medium]
    def classify_source
      return [params['utm_source'], params['utm_medium'].presence || 'campaign'] if params['utm_source'].present?
      return [nil, 'internal'] if internal_referrer?
      return ['Direct', 'direct'] if referrer_host.blank?

      if referrer_host == 'scholar.google.com'
        return ['Google Scholar', 'organic']
      end
      SEARCH_ENGINES.each do |key, name|
        return [name, 'organic'] if referrer_host.include?(key)
      end
      SOCIAL_SITES.each do |host, name|
        return [name, 'social'] if referrer_host == host || referrer_host.end_with?(".#{host}")
      end
      [referrer_host, 'referral']
    end

    def device_type
      case user_agent
      when /ipad|tablet|kindle|silk/i then 'tablet'
      when /mobile|iphone|android|ipod|blackberry|windows phone/i then 'mobile'
      else 'desktop'
      end
    end

    def browser
      case user_agent
      when /edg(e|a|ios)?\//i   then 'Edge'
      when /opr\/|opera/i       then 'Opera'
      when /samsungbrowser/i    then 'Samsung Internet'
      when /firefox|fxios/i     then 'Firefox'
      when /chrome|crios/i      then 'Chrome'
      when /safari/i            then 'Safari'
      when /msie|trident/i      then 'Internet Explorer'
      else 'Other'
      end
    end

    def os
      case user_agent
      when /windows/i             then 'Windows'
      when /iphone|ipad|ipod/i    then 'iOS'
      when /mac os x|macintosh/i  then 'macOS'
      when /android/i             then 'Android'
      when /cros/i                then 'ChromeOS'
      when /linux/i               then 'Linux'
      else 'Other'
      end
    end

    def truncate(value, length)
      value.to_s.presence&.first(length)
    end
  end
end
