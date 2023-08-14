class UpdatesController < ApplicationController
  before_action :set_update, only: [:edit, :update, :destroy]
  before_action :authenticate, :except => [:index]

  def index
    @updates = Update.all
    respond_to do |format|
      format.json { render json: @updates }
    end
  end

  # GET /updates/new
  # GET /updates/new.json
  def new
    @update = Update.new
  end

  # GET /updates/1/edit
  def edit
    @update = Update.find(params[:id])
  end

  # POST /updates
  # POST /updates.json
  def create
    @update = Update.new(update_params)

    respond_to do |format|
      if @update.save
        format.js { render json: @update }
      else
        format.js { render json: { error: @update.errors } }
      end
    end
  end

  # PUT /updates/1
  # PUT /updates/1.json
  def update
    respond_to do |format|
      if @update.update_attributes(update_params)
        format.js { render json: @update }
      else
        format.js { render json: { error: @update.errors } }
      end
    end
  end

  # DELETE /updates/1
  # DELETE /updates/1.json
  def destroy
    @update.destroy

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
    def set_update
      @update = Update.find(params[:id])
    end

    def update_params
      params.require(:update).permit(:date, :text, :backing_type)
    end
end