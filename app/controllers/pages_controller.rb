class PagesController < ApplicationController

  def about
    @page = :about
  end

  def contact
    @page = :contact
  end

end
