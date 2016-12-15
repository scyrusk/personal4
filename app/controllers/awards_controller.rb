class AwardsController < ApplicationController
  before_action :set_award, only: [:edit, :update, :destroy]
  before_action :get_paper_opts, only: [:new, :edit]
  before_filter :authenticate, :except => [:index]

  def index
    @awards = Award.all
    respond_to do |format|
      format.json { render json: @awards }
    end
  end

  # GET /awards/new
  # GET /awards/new.json
  def new
    @award = Award.new
  end

  # GET /awards/1/edit
  def edit
    @award = Award.find(params[:id])
  end

  # POST /awards
  # POST /awards.json
  def create
    @award = Award.new(award_params)

    respond_to do |format|
      if @award.save
        format.js { render json: @award }
      else
        format.js { render json: { error: @award.errors } }
      end
    end
  end

  # PUT /papers/1
  # PUT /papers/1.json
  def update
    respond_to do |format|
      if @award.update_attributes(award_params)
        format.js { render json: @award }
      else
        format.js { render json: { error: @award.errors } }
      end
    end
  end

  # DELETE /awards/1
  # DELETE /awards/1.json
  def destroy
    @award.destroy

    respond_to do |format|
      format.html { redirect_to admin_path }
      format.json { head :ok }
    end
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
    def set_award
      @award = Award.find(params[:id])
    end

    def award_params
      params.require(:award).permit(:year, :body, :pinned, :paper_id)
    end

    def get_paper_opts
      @paper_opts = [{ id: -1, title: "" }] + Paper.all.map { |p| { id: p.id.to_i, title: p.title } }
    end
end