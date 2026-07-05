require 'uri'

# Public ingest endpoint for client-side journey events (section views,
# outbound/email clicks, CV downloads) reported by journey_tracking.js via
# navigator.sendBeacon. Beacons cannot carry custom headers, so CSRF
# verification is skipped; in exchange the endpoint accepts only a fixed
# vocabulary of events and derives every stored value server-side, so a
# forged request can at worst record one of the same events a real click
# would.
class AnalyticsEventsController < ApplicationController
  skip_before_action :verify_authenticity_token

  # The homepage sections observed by journey_tracking.js. Must match the
  # section ids in static_pages/index.html.haml.
  SECTIONS = %w[about recruiting students publications].freeze

  # Tracking must never surface errors to visitors: bad payloads are dropped
  # with 204 just like successful ones, and failures are logged server-side.
  def create
    return head :no_content if session[:authenticated]

    attrs = event_attributes
    Analytics::Tracker.track(request, **attrs) if attrs
    head :no_content
  rescue StandardError => e
    Rails.logger.error("[analytics] failed to record client event: #{e.class}: #{e.message}")
    head :no_content
  end

  private

  # => { event_name:, path:, ... } or nil when the payload isn't one of the
  # known client events. Paths are virtual journey steps ("/#about",
  # "/outbound/github.com") so the sankey and transition aggregates work on
  # them with no special cases.
  def event_attributes
    case params[:event]
    when 'section_view'
      section = params[:section].to_s
      { event_name: 'section_view', path: "/##{section}" } if SECTIONS.include?(section)
    when 'outbound_click'
      host = outbound_host
      { event_name: 'outbound_click', path: "/outbound/#{host}",
        properties: { 'url' => params[:url].to_s.first(2048) } } if host
    when 'email_click'
      { event_name: 'email_click', path: '/email' }
    when 'cv_download'
      { event_name: 'download', path: '/cv.pdf', properties: { 'title' => 'CV / Résumé' } }
    end
  end

  def outbound_host
    host = URI.parse(params[:url].to_s).host
    host&.downcase&.delete_prefix('www.').presence
  rescue URI::Error
    nil
  end
end
