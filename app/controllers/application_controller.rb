require 'errors'
class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  # rescue_from APIError, :with => :render_error

  private

  def render_error

  end

  def logged_in?
    !current_user.nil?
  end

  def current_user
    return session[:user]
  end
  helper_method :current_user

  # will set flash message and redirect user if not logged in
  def is_authenticated?(referrer)
    if !logged_in?
      redirect_to controller: :auth, action: :signin, next: referrer
    end
  end

  def kpget(path)
    headers = {"Accept" => "application/json"}
    if current_user
      headers["Authorization"] = current_user['auth_token']
    end
    r = HTTParty.get(
      Rails.application.config.api_url + path,
      :headers => headers
    )
    return api_response(r)
  end

  def kppost(path, options={})
    headers = {"Accept" => "application/json"}

    if current_user.present?
      headers["Authorization"] = current_user['auth_token']
    # elsif auth.present?
    #   p "*********** using auth"
    #   headers["Authorization"] = auth
    end
    hpops = {
       headers: headers,
    }.merge(options)

    p "*********** options"
    pp hpops

    r = HTTParty.post(
      Rails.application.config.api_url + path,
      hpops
    )
    return api_response(r)
  end

  def kpdelete(path)
    headers = {"Accept" => "application/json"}
    if current_user
      headers["Authorization"] = current_user['auth_token']
    end
    r = HTTParty.delete(
      Rails.application.config.api_url + path,
      :headers => headers
    )
    return api_response(r)
  end

  def api_response(r)
     # error response from rails-api looks like this:
     # {"status":400,"error":"Bad Request","exception":"#\u003cActionController::ParameterMissing: param is missing or the value is empty: user\u003e","traces":{"Application Trace":[{"id":1,"trace":"app
     if r.code < 400
       return r.parsed_response
     end
     puts "API Error #{r.code} - body: #{r.body}"
     err = "#{r.code} error"
     begin
       body_parsed = r.parsed_response
       if body_parsed['error']
         message = body_parsed['error']
       elsif body_parsed['errors']
         message = body_parsed['errors'].join('<br/>')
       end

       err = "#{r.code} #{message}  #{body_parsed['exception']}"
     rescue => ex
       puts "Couldn't parse error response"
     end
     case r.code
      when 404
        raise APINotFoundError.new(r.code, err)
      when 400...500
        raise API40XError.new(r.code, err)
      when 500...600
        raise API50XError.new(r.code, err)
      else
        return r.parsed_response
    end
  end

end
