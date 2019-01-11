class AuthController < ApplicationController
  def signin
    if logged_in?
      redirect_to :root
    end

    @next = params[:next]
    @page = :signin
  end

  def signin_submit
    user = params[:user]

    begin
      response = kppost("/users/sign_in", query: {
        user: {
          email: user['email'],
          password: user['password']
        }
      })
    rescue API40XError => ex
      flash[:error] = ex.message
      render :signin
      return
    end

    # TODO
    # Handle Error

    session[:user] = response['data']
    cookies[:auth_token] = response['data']['auth_token']

    redirect_to params[:next]
  end

  def signup
    if logged_in?
      redirect_to :root
    end

    @next = params[:next]
  end

  def signup_submit
    user = params.permit(user: [
      :first_name,
      :last_name,
      :slug,
      :email,
      :mobile_number,
      :password,
      :password_confirmation
    ]).to_h

    image = params[:user][:profile_img]
    if image
      user[:user][:profile_img] = {
        data: Base64.encode64(image.read),
        name: image.original_filename,
        type: image.content_type
      }
    end

    @user = user[:user]

    begin
      response = kppost("/users/", body: user)

      # TODO: Handle error
      # Response can contain an erray of errors, these should be displayed

      if response['data']
        session[:user] = response['data']
        cookies[:auth_token] = response['data']['auth_token']
        flash[:notice] = "You have created an account."
        redirect_to params[:next]
      end
    rescue API40XError => ex
      flash.now[:error] = ex.message.sub! ex.code.to_s, ""
      render :signup
    end
  end

  def signin_facebook
    # call API to login
    r = kppost('/facebook_login', query: {fb_user: {access_token: params[:access_token], user_id: params[:user_id]}})
    puts 'api response'
    p r

    session[:user] = r['data']
    cookies[:auth_token] = r['data']['auth_token']

    render :json => {"status": "success"}
  end

  def signout
    reset_session
    cookies.delete(:auth_token)
    flash[:notice] = "You have been logged out."
    redirect_to '/'
  end

end
