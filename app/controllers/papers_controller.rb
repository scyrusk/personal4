class PapersController < ApplicationController
  before_action :set_paper, only: [:edit, :update, :serve, :destroy]
  before_action :authenticate, :except => [:index, :serve]

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
      if @paper.update_attributes(params)
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
    @paper.downloads = @paper.downloads.present? ? @paper.downloads + 1 : 1
    @paper.save

    pdf_path =  Rails.root.join('public', @paper.pdf.path)

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
          :thumbnail,
          :downloads,
          :pdf,
          :slides,
          :html_slides_url,
          :html_paper_url,
          :summary,
          :presentation_url,
          :video_url,
          :tweets,
          :tags
        )
    end
end