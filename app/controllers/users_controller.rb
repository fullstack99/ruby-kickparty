class UsersController < ApplicationController
  def show
    r = kpget("/users/" + params[:id])

    if r.blank?
      raise ActionController::RoutingError.new('Not Found')
    else
      @user = r
    end
  end

  def edit
    r = kpget("/users/" + params[:id])

    if r.blank?
      raise ActionController::RoutingError.new('Not Found')
    else
      @user = r
    end
  end

  def update
    p params
  end
end
