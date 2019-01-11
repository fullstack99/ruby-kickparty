class HomeController < ApplicationController

  def index
    @view = 'index'
    @page = :home
  end

end
