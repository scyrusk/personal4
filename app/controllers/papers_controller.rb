class PapersController < ApplicationController
  before_action :set_paper, only: [:edit, :update, :serve, :destroy]
  before_action :authenticate, :except => [:index, :serve]

  # SF-04: an unknown paper id also lands on the recovery page, not an error
  rescue_from ActiveRecord::RecordNotFound do
    @paper = nil
    render 'papers/recovery', status: :not_found
  end

  def index
    @papers = Paper.all
    respond_to do |format|
      format.json { render json: @papers }
    end
  end

  # GET /papers/new
  # GET /papers/new.json
  def new
    @paper = Paper.new
  end

  # GET /papers/1/edit
  def edit
    @paper = Paper.find(params[:id])
  end

  # POST /papers
  # POST /papers.json
  def create
    params = paper_params
    authors = params.delete(:authors).split(",").map do |aname|
      Author.find_or_create_by(name: aname.strip)
    end

    awards = params.delete(:awards).split(",").map do |abody|
      Award.find_or_create_by(body: abody.strip, year: paper_params[:year])
    end

    @paper = Paper.new(params)
    @paper.authors = authors
    @paper.awards = awards

    respond_to do |format|
      if @paper.save
        format.js { render json: @paper }
      else
        format.js { render json: { error: @paper.errors } }
      end
    end
  end

  # PUT /papers/1
  # PUT /papers/1.json
  def update
    params = paper_params

    @paper.authors = params.delete(:authors).split(",").map do |aname|
      Author.find_or_create_by(name: aname.strip)
    end

    @paper.awards = params.delete(:awards).split(",").map do |abody|
      Award.find_or_create_by(body: abody.strip)
    end

    respond_to do |format|
      if @paper.update(params)
        format.js { render json: @paper }
      else
        format.js { render json: { error: @paper.errors } }
      end
    end
  end

  # DELETE /papers/1
  # DELETE /papers/1.json
  def destroy
    @paper.destroy

    respond_to do |format|
      format.html { redirect_to admin_path }
      format.json { head :ok }
    end
  end

  def serve
    # SF-04: a missing or unhosted PDF lands on a branded recovery page with
    # alternate sources — never a bare 404/500.
    pdf_path = @paper.pdf.present? && @paper.pdf.path.present? ? Rails.root.join('public', @paper.pdf.path) : nil
    unless pdf_path && File.exist?(pdf_path)
      Rails.logger.warn("[link-health] missing PDF for paper #{@paper.id} (#{@paper.title})")
      render 'papers/recovery', status: :not_found and return
    end

    # HEAD requests are client-side availability probes (SF-04) — don't count them
    unless request.head?
      @paper.downloads = @paper.downloads.present? ? @paper.downloads + 1 : 1
      @paper.save
    end

    unless session[:authenticated] || request.head?
      begin
        Analytics::Tracker.track(request, event_name: 'download',
                                 properties: { 'paper_id' => @paper.id, 'title' => @paper.title })
      rescue StandardError => e
        Rails.logger.error("[analytics] failed to track download: #{e.class}: #{e.message}")
      end
    end

    begin
      filename = "#{@paper.self_order == 1 ? "Das" : @paper.authors.first.name.split(" ").last}#{@paper.year}"
    rescue StandardError
      filename = "file.pdf"
    end
    send_file pdf_path, filename: filename, type: 'application/pdf', disposition: 'inline'
  end

  protected
    def authenticate
      authenticate_or_request_with_http_basic do |user, password|
        retval = user == ENV['PERSONAL_UN'] && password == ENV['PERSONAL_PASS']
        session[:authenticated] = true if retval
        retval
      end
    end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_paper
      @paper = Paper.find(params[:id])
    end

    #Never trust parameters from the scary internet, only allow the white list through.
    def paper_params
      params.require(:paper).permit(
          :title,
          :venue,
          :year,
          :self_order,
          :authors,
          :awards,
          :backing_type,
          :featured,
          :thumbnail,
          :downloads,
          :pdf,
          :slides,
          :html_slides_url,
          :html_paper_url,
          :doi,
          :bibtex,
          :summary,
          :presentation_url,
          :video_url,
          :tweets,
          :tags,
          :project_page_url
        )
    end
end
