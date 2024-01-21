class TravelsController < ApplicationController
  before_action :set_travel, only: [:edit, :update, :destroy]
  before_action :authenticate, :except => [:index]

  # GET /travels
  # GET /travels.json
  def index
    @travels = Travel.all
    respond_to do |format|
      format.json { render json: @travels }
    end
  end

  # GET /travels/new
  def new
    @travel = Travel.new
  end

  # GET /travels/1/edit
  def edit
    @travel = Travel.find(params[:id])
  end

  # POST /travels
  # POST /travels.json
  def create
    @travel = Travel.new(travel_params)

    respond_to do |format|
      if @travel.save
        format.js { render json: @travel }
      else
        format.js { render json: { error: @travel.errors } }
      end
    end
  end

  # PATCH/PUT /travels/1
  # PATCH/PUT /travels/1.json
  def update
    respond_to do |format|
      if @travel.update(travel_params)
        format.js { render json: @travel }
      else
        format.js { render json: { error: @travel.errors } }
      end
    end
  end

  # DELETE /travels/1
  # DELETE /travels/1.json
  def destroy
    @travel.destroy
    respond_to do |format|
      format.html { redirect_to admin_path }
      format.json { head :ok }
    end
  end

  private
    def authenticate
      authenticate_or_request_with_http_basic do |user, password|
        retval = user == ENV['PERSONAL_UN'] && password == ENV['PERSONAL_PASS']
        session[:authenticated] = true if retval
        retval
      end
    end

    # Use callbacks to share common setup or constraints between actions.
    def set_travel
      @travel = Travel.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def travel_params
      params.require(:travel).permit(
        :date,
        :location,
        :title,
        :link
      )
    end
end